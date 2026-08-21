import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { isValidLinkedInUrl } from "@/lib/utils";
import { verifyIdToken, extractBearerToken } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
  runTransaction,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

/**
 * POST /api/update-profile
 *
 * Handles user profile updates.
 *
 * Security:
 * - Requires Firebase ID token in Authorization header
 * - Verifies token and matches userId to prevent impersonation
 * - Rate-limited to 10 requests per minute per IP
 *
 * Flow:
 * 1. Verify authentication
 * 2. Validate input data
 * 3. Find user's existing submission by userId
 * 4. If exists: update submission and handle company count changes
 * 5. If not exists: create new submission
 * 6. Update company counts in a transaction
 */
export async function POST(request: NextRequest) {
  try {
    // ── Rate limit ──
    const clientIp = getClientIp(request.headers);
    if (!rateLimit(clientIp, 10, 60_000)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    // ── Authentication ──
    const authHeader = request.headers.get("authorization");
    const idToken = extractBearerToken(authHeader);

    if (!idToken) {
      return NextResponse.json(
        { error: "Authentication required. Please sign in." },
        { status: 401 },
      );
    }

    let verifiedUser;
    try {
      verifiedUser = await verifyIdToken(idToken);
    } catch {
      return NextResponse.json(
        { error: "Invalid or expired session. Please sign in again." },
        { status: 401 },
      );
    }

    // ── Parse & validate ──
    const body = await request.json();
    const {
      userId,
      name,
      title,
      linkedin,
      company,
      portfolioCv,
      graduationClass,
    } = body;

    // Verify the userId in the body matches the authenticated user
    if (!userId || userId !== verifiedUser.uid) {
      return NextResponse.json(
        { error: "User ID mismatch — cannot update another user's profile." },
        { status: 403 },
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
        { status: 400 },
      );
    }

    if (company !== undefined && typeof company !== "string") {
      return NextResponse.json(
        { error: "Company must be a string" },
        { status: 400 },
      );
    }

    const trimmedName = name.trim();
    const trimmedTitle = title.trim();
    const trimmedLinkedin = linkedin.trim();
    const trimmedCompany = company ? company.trim() : "";
    const trimmedPortfolioCv =
      typeof portfolioCv === "string" ? portfolioCv.trim() : "";
    const trimmedGraduationClass =
      typeof graduationClass === "string" ? graduationClass.trim() : "";

    if (!isValidLinkedInUrl(trimmedLinkedin)) {
      return NextResponse.json(
        { error: "LinkedIn URL is invalid" },
        { status: 400 },
      );
    }

    // ── Find existing submission ──
    const submissionRef = doc(db, "submissions", userId);
    const submissionDoc = await getDoc(submissionRef);

    let oldCompany: string | null = null;
    let submissionId: string | null = null;

    if (submissionDoc.exists()) {
      submissionId = submissionDoc.id;
      const submissionData = submissionDoc.data();
      oldCompany = submissionData.company || null;
    } else {
      // Fallback: query by userId field (for backwards compatibility)
      const submissionsRef = collection(db, "submissions");
      const q = query(submissionsRef, where("userId", "==", userId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const existingDoc = querySnapshot.docs[0];
        submissionId = existingDoc.id;
        const submissionData = existingDoc.data();
        oldCompany = submissionData.company || null;
      }
    }

    // ── Handle company count changes ──
    if (oldCompany && oldCompany !== trimmedCompany) {
      // User changed companies — decrement old, increment new
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

      if (trimmedCompany) {
        const newCompanyRef = doc(db, "companies", trimmedCompany);
        const newCompanyDoc = await getDoc(newCompanyRef);

        if (newCompanyDoc.exists()) {
          await updateDoc(newCompanyRef, {
            count: increment(1),
          });
        } else {
          await setDoc(newCompanyRef, { count: 1 });
        }
      }
    } else if (!oldCompany && trimmedCompany) {
      // New submission — increment company count
      const companyRef = doc(db, "companies", trimmedCompany);
      const companyDoc = await getDoc(companyRef);

      if (companyDoc.exists()) {
        await updateDoc(companyRef, {
          count: increment(1),
        });
      } else {
        await setDoc(companyRef, { count: 1 });
      }
    }

    // ── Update or create submission ──
    if (submissionId) {
      const existingRef = doc(db, "submissions", submissionId);
      await updateDoc(existingRef, {
        name: trimmedName,
        title: trimmedTitle,
        linkedin: trimmedLinkedin,
        company: trimmedCompany,
        portfolioCv: trimmedPortfolioCv || null,
        graduationClass: trimmedGraduationClass,
        updatedAt: serverTimestamp(),
      });
    } else {
      const newSubmissionRef = doc(db, "submissions", userId);
      await setDoc(newSubmissionRef, {
        userId,
        name: trimmedName,
        title: trimmedTitle,
        linkedin: trimmedLinkedin,
        company: trimmedCompany,
        portfolioCv: trimmedPortfolioCv || null,
        graduationClass: trimmedGraduationClass,
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
          graduationClass: trimmedGraduationClass,
        },
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("Error updating profile:", error);

    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      {
        error: "Failed to update profile",
        details: message,
      },
      { status: 500 },
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
