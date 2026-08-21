/**
 * Utility functions for the GradBoard application
 */

/**
 * Validate LinkedIn profile or company URLs.
 * Accepts optional http/https and optional www.
 */
export function isValidLinkedInUrl(linkedinUrl: string): boolean {
  const url = linkedinUrl.trim();
  if (!url) return false;

  const linkedinRegex =
    /^(https?:\/\/)?(www\.)?linkedin\.com\/(in|pub|company)\/[A-Za-z0-9\-_%]{2,}(\/.*)?$/i;
  return linkedinRegex.test(url);
}

/**
 * Validate company name
 */
export function isValidCompanyName(name: string): boolean {
  return name.trim().length > 0 && name.trim().length <= 100;
}

/**
 * Validate graduate name
 */
export function isValidGraduateName(name: string): boolean {
  return name.trim().length > 0 && name.trim().length <= 100;
}

/**
 * Format company name for display
 */
export function formatCompanyName(name: string): string {
  return name.trim();
}
