import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
} from "firebase/firestore";

/**
 * POST /api/update-profile
 *
 * Handles user profile updates
 *
 * Flow:
 * 1. Validate input data
 * 2. Find user's existing submission by userId
 * 3. If exists: update submission and handle company count changes
 * 4. If not exists: create new submission
 * 5. Update company counts accordingly
 *
 * Returns success message or error
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { userId, name, title, linkedin, company, portfolioCv } = body;

    // Validation
    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!linkedin || typeof linkedin !== "string" || !linkedin.trim()) {
      return NextResponse.json(
        { error: "LinkedIn URL is required" },
        { status: 400 }
      );
    }

    if (!company || typeof company !== "string" || !company.trim()) {
      return NextResponse.json(
        { error: "Company is required" },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    const trimmedTitle = title.trim();
    const trimmedLinkedin = linkedin.trim();
    const trimmedCompany = company.trim();
    const trimmedPortfolioCv =
      typeof portfolioCv === "string" ? portfolioCv.trim() : "";

    // Find user's existing submission
    // First try by document ID (userId)
    const submissionRef = doc(db, "submissions", userId);
    const submissionDoc = await getDoc(submissionRef);

    let oldCompany: string | null = null;
    let submissionId: string | null = null;

    if (submissionDoc.exists()) {
      submissionId = submissionDoc.id;
      const submissionData = submissionDoc.data();
      oldCompany = submissionData.company;
    } else {
      // Fallback: query by userId field (for backwards compatibility)
      const submissionsRef = collection(db, "submissions");
      const q = query(submissionsRef, where("userId", "==", userId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        submissionId = doc.id;
        const submissionData = doc.data();
        oldCompany = submissionData.company;
      }
    }

    // Handle company count changes
    if (oldCompany && oldCompany !== trimmedCompany) {
      // User changed companies - decrement old company
      const oldCompanyRef = doc(db, "companies", oldCompany);
      const oldCompanyDoc = await getDoc(oldCompanyRef);

      if (oldCompanyDoc.exists()) {
        const oldCount = oldCompanyDoc.data().count || 0;
        if (oldCount > 0) {
          await updateDoc(oldCompanyRef, {
            count: increment(-1),
          });
        }
      }

      // Increment new company
      const newCompanyRef = doc(db, "companies", trimmedCompany);
      const newCompanyDoc = await getDoc(newCompanyRef);

      if (newCompanyDoc.exists()) {
        await updateDoc(newCompanyRef, {
          count: increment(1),
        });
      } else {
        // New company - create with count = 1
        await setDoc(newCompanyRef, {
          count: 1,
        });
      }
    } else if (!oldCompany) {
      // New submission - increment company count
      const companyRef = doc(db, "companies", trimmedCompany);
      const companyDoc = await getDoc(companyRef);

      if (companyDoc.exists()) {
        await updateDoc(companyRef, {
          count: increment(1),
        });
      } else {
        // New company - create with count = 1
        await setDoc(companyRef, {
          count: 1,
        });
      }
    }
    // If oldCompany === trimmedCompany, no count changes needed

    // Update or create submission
    if (submissionId) {
      // Update existing submission
      const submissionRef = doc(db, "submissions", submissionId);
      await updateDoc(submissionRef, {
        name: trimmedName,
        title: trimmedTitle,
        linkedin: trimmedLinkedin,
        company: trimmedCompany,
        portfolioCv: trimmedPortfolioCv || null,
        updatedAt: serverTimestamp(),
      });
    } else {
      // Create new submission - use userId as document ID for easy lookup
      const newSubmissionRef = doc(db, "submissions", userId);
      await setDoc(newSubmissionRef, {
        userId,
        name: trimmedName,
        title: trimmedTitle,
        linkedin: trimmedLinkedin,
        company: trimmedCompany,
        portfolioCv: trimmedPortfolioCv || null,
        timestamp: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Profile updated successfully",
        data: {
          name: trimmedName,
          title: trimmedTitle,
          linkedin: trimmedLinkedin,
          company: trimmedCompany,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating profile:", error);

    return NextResponse.json(
      {
        error: "Failed to update profile",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
