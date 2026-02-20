import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";

/**
 * POST /api/suggest-company
 *
 * Handles company suggestion submissions
 *
 * Flow:
 * 1. Validate input data
 * 2. Check if company already exists
 * 3. Add suggestion to 'companySuggestions' collection
 *
 * Returns success message or error
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { companyName } = body;

    // Validation
    if (!companyName || typeof companyName !== "string" || !companyName.trim()) {
      return NextResponse.json(
        { error: "Company name is required" },
        { status: 400 }
      );
    }

    const trimmedCompanyName = companyName.trim();

    // Check if company already exists
    const companyRef = doc(db, "companies", trimmedCompanyName);
    const companyDoc = await getDoc(companyRef);

    if (companyDoc.exists()) {
      return NextResponse.json(
        { error: "This company already exists in the list" },
        { status: 400 }
      );
    }

    // Add suggestion to companySuggestions collection
    const suggestionsRef = collection(db, "companySuggestions");
    await addDoc(suggestionsRef, {
      companyName: trimmedCompanyName,
      timestamp: serverTimestamp(),
      status: "pending", // pending, approved, rejected
    });

    return NextResponse.json(
      {
        success: true,
        message: "Company suggestion submitted successfully",
        data: {
          companyName: trimmedCompanyName,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error processing company suggestion:", error);

    return NextResponse.json(
      {
        error: "Failed to process suggestion",
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
