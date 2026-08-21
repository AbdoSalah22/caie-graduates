/**
 * Server-side Firebase Auth utilities
 *
 * Verifies Firebase ID tokens using the Firebase Auth REST API,
 * so we don't need the firebase-admin SDK or a service account key.
 */

interface VerifiedUser {
  uid: string;
  email: string;
}

/**
 * Verify a Firebase ID token via the Google Identity Toolkit REST API.
 *
 * Returns the authenticated user's uid and email if the token is valid.
 * Throws if the token is invalid, expired, or the API call fails.
 */
export async function verifyIdToken(idToken: string): Promise<VerifiedUser> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) {
    throw new Error("Firebase API key is not configured");
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData?.error?.message || "Invalid or expired ID token",
    );
  }

  const data = await response.json();
  const user = data.users?.[0];

  if (!user || !user.localId) {
    throw new Error("Could not resolve user from ID token");
  }

  return {
    uid: user.localId,
    email: user.email || "",
  };
}

/**
 * Check whether an email address is in the admin allow-list.
 *
 * The list is read from the ADMIN_EMAILS environment variable
 * (comma-separated, case-insensitive).
 */
export function isAdminEmail(email: string): boolean {
  const raw = process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAILS || "";
  if (!raw.trim()) return false;

  const allowList = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return allowList.includes(email.trim().toLowerCase());
}

/**
 * Extract the Bearer token from an Authorization header value.
 * Returns null if the header is missing or malformed.
 */
export function extractBearerToken(
  authHeader: string | null | undefined,
): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;
  return parts[1];
}
