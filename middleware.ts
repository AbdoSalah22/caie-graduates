import { NextRequest, NextResponse } from "next/server";

/**
 * Lock-down middleware for the preview branch only.
 *
 * The preview branch's Vercel deployment is detected three ways (any match
 * enables the lock):
 *   1. VERCEL_GIT_COMMIT_REF === "preview" (set on git-triggered deployments)
 *   2. VERCEL_BRANCH_URL contains "-git-preview-" (the preview branch preview URL)
 *   3. The request hostname contains "-git-preview-" (same preview URL, works
 *      even if the git env vars aren't exposed to the middleware runtime)
 *
 * When active, every route other than the static preview pages and their
 * assets is redirected to /preview. All other deployments pass straight
 * through, so production behavior is untouched.
 */
const PREVIEW_ONLY_BRANCH = "preview";

function isPreviewDeployment(req: NextRequest): boolean {
  if (process.env.VERCEL_GIT_COMMIT_REF === PREVIEW_ONLY_BRANCH) return true;
  if ((process.env.VERCEL_BRANCH_URL ?? "").includes(`-git-${PREVIEW_ONLY_BRANCH}-`)) {
    return true;
  }
  return req.nextUrl.hostname.includes(`-git-${PREVIEW_ONLY_BRANCH}-`);
}

export function middleware(req: NextRequest) {
  if (!isPreviewDeployment(req)) {
    return NextResponse.next();
  }

  const { pathname } = req.nextUrl;
  const allowed =
    pathname === "/preview" ||
    pathname.startsWith("/preview/") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/preview-data") ||
    pathname.startsWith("/logos") ||
    pathname === "/favicon.svg";

  return allowed
    ? NextResponse.next()
    : NextResponse.redirect(new URL("/preview", req.url));
}

export const config = {
  matcher: ["/:path*"],
};