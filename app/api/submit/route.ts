import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { isValidLinkedInUrl } from "@/lib/utils";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
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
 * Handles graduate submission form.
 *
 * Security:
 * - Rate-limited to 5 requests per minute per IP
 *
 * Flow:
 * 1. Rate limit check
 * 2. Validate input data
 * 3. Add submission to 'submissions' collection
 * 4. Update or create company in 'companies' collection
 * 5. Increment company count
 */
export async function POST(request: NextRequest) {
  try {
    // ── Rate limit ──
    const clientIp = getClientIp(request.headers);
    if (!rateLimit(clientIp, 5, 60_000)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    // ── Parse & validate ──
    const body = await request.json();
    const { name, title, linkedin, company } = body;

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
    const trimmedCompany = typeof company === "string" ? company.trim() : "";

    if (!isValidLinkedInUrl(trimmedLinkedin)) {
      return NextResponse.json(
        { error: "LinkedIn URL is invalid" },
        { status: 400 },
      );
    }

    // ── Create submission ──
    const submissionsRef = collection(db, "submissions");
    await addDoc(submissionsRef, {
      name: trimmedName,
      title: trimmedTitle,
      linkedin: trimmedLinkedin,
      company: trimmedCompany,
      timestamp: serverTimestamp(),
    });

    // ── Update company count ──
    if (trimmedCompany) {
      const companyRef = doc(db, "companies", trimmedCompany);
      const companyDoc = await getDoc(companyRef);

      if (companyDoc.exists()) {
        await updateDoc(companyRef, {
          count: increment(1),
        });
      } else {
        await setDoc(companyRef, {
          count: 1,
        });
      }
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
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("Error processing submission:", error);

    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      {
        error: "Failed to process submission",
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
