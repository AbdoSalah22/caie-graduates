import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
} from "firebase/firestore";

/**
 * POST /api/submit
 *
 * Handles graduate submission form
 *
 * Flow:
 * 1. Validate input data
 * 2. Add submission to 'submissions' collection
 * 3. Update or create company in 'companies' collection
 * 4. Increment company count
 * 5. Create default logo if new company
 *
 * Returns success message or error
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { name, title, linkedin, company } = body;

    // Validation
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

    // 1. Add submission to submissions collection
    const submissionsRef = collection(db, "submissions");
    await addDoc(submissionsRef, {
      name: trimmedName,
      title: trimmedTitle,
      linkedin: trimmedLinkedin,
      company: trimmedCompany,
      timestamp: serverTimestamp(),
    });

    // 2. Update or create company document
    const companyRef = doc(db, "companies", trimmedCompany);
    const companyDoc = await getDoc(companyRef);

    if (companyDoc.exists()) {
      // Company exists - increment count
      await updateDoc(companyRef, {
        count: increment(1),
      });
    } else {
      // New company - create with count = 1
      await setDoc(companyRef, {
        count: 1,
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Submission successful",
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
    console.error("Error processing submission:", error);

    return NextResponse.json(
      {
        error: "Failed to process submission",
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
