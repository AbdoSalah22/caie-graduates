/**
 * Utility functions for the GradBoard application
 */

import { Node, Company } from "@/types";
import { MIN_RADIUS, SCALING_FACTOR } from "./constants";

/**
 * Convert company data from Firestore to Node format for force simulation
 */
export function companyToNode(companyId: string, company: Company): Node {
  return {
    id: companyId,
    count: company.count,
    radius: MIN_RADIUS + company.count * SCALING_FACTOR,
  };
}

/**
 * Calculate total number of graduates across all companies
 */
export function getTotalGraduates(nodes: Node[]): number {
  return nodes.reduce((sum, node) => sum + node.count, 0);
}

/**
 * Get the largest company by graduate count
 */
export function getLargestCompany(nodes: Node[]): Node | null {
  if (nodes.length === 0) return null;
  return nodes.reduce((max, node) => (node.count > max.count ? node : max));
}

/**
 * Sort nodes by count (descending)
 */
export function sortNodesByCount(nodes: Node[]): Node[] {
  return [...nodes].sort((a, b) => b.count - a.count);
}

/**
 * Format company name for display
 */
export function formatCompanyName(name: string): string {
  return name.trim();
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
 * Validate LinkedIn profile or company URLs.
 * Accepts optional http/https and optional www.
 */
export function isValidLinkedInUrl(linkedinUrl: string): boolean {
  const url = linkedinUrl.trim();
  if (!url) return false;

  const linkedinRegex = /^(https?:\/\/)?(www\.)?linkedin\.com\/(in|pub|company)\/[A-Za-z0-9\-_%]{2,}(\/.*)?$/i;
  return linkedinRegex.test(url);
}
