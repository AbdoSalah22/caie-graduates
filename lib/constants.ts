/** Path prefix for GitHub Pages project sites (must match basePath in next.config.js) */
export const BASE_PATH = "/caie-graduates";

/**
 * Build a URL/file-safe slug from a company name. Company names are display
 * keys in the data files and may contain characters that are invalid in URLs
 * or filenames (e.g. "3D|Diagnostix"). This slug is used only as the
 * /preview/company/[name] route segment.
 */
export function companySlug(name: string): string {
  const slug = name
    .replace(/[\s/\\:*?"<>|%#]+/g, "-")
    .replace(/[^a-zA-Z0-9._~-]+/g, "-")
    .replace(/^[.-]+|[.-]+$/g, "")
    .replace(/\.{2,}/g, "-")
    .slice(0, 80);
  return slug || "company";
}

/** Minimum bubble diameter in pixels */
export const MIN_BUBBLE_SIZE = 50;

/** Maximum bubble diameter in pixels */
export const MAX_BUBBLE_SIZE = 180;

/** Padding between bubbles in the force simulation (pixels) */
export const BUBBLE_PADDING = 6;
