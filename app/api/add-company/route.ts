import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { isValidWebsiteUrl, isValidCompanyName } from "@/lib/utils";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { doc, getDoc, setDoc } from "firebase/firestore";

/**
 * Extract the registrable domain (company.com) from a website link.
 * Accepts "https://www.acme.com/careers", "acme.com", etc.
 */
function extractDomain(website: string): string | null {
  try {
    const candidate = /^https?:\/\//i.test(website)
      ? website
      : `https://${website}`;
    const url = new URL(candidate);
    return url.hostname.replace(/^www\./i, "").toLowerCase() || null;
  } catch {
    return null;
  }
}

/**
 * POST /api/add-company
 *
 * Adds a new company to the 'companies' collection and generates its
 * logo URL via logo.dev. The logo.dev token lives only in this server
 * route (LOGO_DEV_TOKEN env var) — never shipped to the client.
 *
 * Body: { name: string, website: string }
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
    const { name, website } = body;

    if (!name || typeof name !== "string" || !isValidCompanyName(name)) {
      return NextResponse.json(
        { error: "Company name is required" },
        { status: 400 },
      );
    }

    if (!website || typeof website !== "string" || !isValidWebsiteUrl(website)) {
      return NextResponse.json(
        { error: "A valid company website is required" },
        { status: 400 },
      );
    }

    const trimmedName = name.trim();
    const domain = extractDomain(website.trim());
    if (!domain) {
      return NextResponse.json(
        { error: "A valid company website is required" },
        { status: 400 },
      );
    }

    // ── Skip if it already exists ──
    const companyRef = doc(db, "companies", trimmedName);
    const existing = await getDoc(companyRef);
    if (existing.exists()) {
      return NextResponse.json({
        success: true,
        alreadyExists: true,
        name: trimmedName,
        message: "Company already exists",
      });
    }

    // ── Build logo URL server-side with the private token ──
    const token = process.env.LOGO_DEV_TOKEN;
    if (!token) {
      console.error("LOGO_DEV_TOKEN is not configured");
      return NextResponse.json(
        { error: "Server is not configured for company creation" },
        { status: 500 },
      );
    }

    const logoUrl = `https://img.logo.dev/${domain}?token=${encodeURIComponent(
      token,
    )}&format=webp&retina=true`;

    await setDoc(companyRef, {
      count: 0,
      logoUrl,
    });

    return NextResponse.json({
      success: true,
      alreadyExists: false,
      name: trimmedName,
      message: "Company added successfully",
    });
  } catch (error: unknown) {
    console.error("Error adding company:", error);

    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: "Failed to add company", details: message },
      { status: 500 },
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
