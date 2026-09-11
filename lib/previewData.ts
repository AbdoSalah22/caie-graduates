import { useEffect, useMemo, useState } from "react";
import {
  MIN_BUBBLE_SIZE,
  MAX_BUBBLE_SIZE,
  BASE_PATH,
  companySlug,
} from "@/lib/constants";

/**
 * Static preview data layer.
 *
 * The /preview route is fully static: it loads companies, submissions and
 * settings from local JSON files exported by `npm run export-preview` (see
 * scripts/export-preview.cjs). Nothing here touches Firebase or Firestore —
 * no auth, no listeners, no network requests except fetching the JSON
 * files (and the logged-in-free page images) straight from the static bundle.
 */

export type PreviewCompany = {
  id: string;
  count?: number;
  logoUrl?: string;
  squareColor?: string;
  website?: string;
};

export type PreviewSubmission = {
  id: string;
  name: string;
  title: string;
  linkedin: string;
  company: string;
  portfolioCv?: string;
  graduationClass?: string;
  userId?: string;
  timestamp?: string | null;
};

export type PreviewHomeSettings = {
  showProfileButton?: boolean;
};

export type PreviewData = {
  exportedAt: string | null;
  companies: PreviewCompany[];
  submissions: PreviewSubmission[];
  settings: PreviewHomeSettings;
};

export type PreviewNode = {
  id: string;
  count: number;
  radius: number;
  slug?: string; // URL/file-safe segment for the /preview/company/[name] route
  logoUrl?: string;
  squareColor?: string;
};

async function fetchJson<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } catch (err) {
    console.error(`Failed to load preview data from ${url}`, err);
    return fallback;
  }
}

let cachedPromise: Promise<PreviewData> | null = null;

/** Prefix site-root asset paths (like /preview-data/...) with the basePath. */
function prefixAssetPath(url?: string): string | undefined {
  return url && url.startsWith("/") ? `${BASE_PATH}${url}` : url;
}

/** Load the exported preview snapshot (fetched once, shared across pages). */
export function loadPreviewData(): Promise<PreviewData> {
  if (!cachedPromise) {
    cachedPromise = Promise.all([
      fetchJson<{ companies: PreviewCompany[] }>(
        `${BASE_PATH}/preview-data/companies.json`,
        { companies: [] },
      ),
      fetchJson<{ submissions: PreviewSubmission[] }>(
        `${BASE_PATH}/preview-data/submissions.json`,
        { submissions: [] },
      ),
      fetchJson<{ settings: PreviewHomeSettings }>(
        `${BASE_PATH}/preview-data/settings.json`,
        { settings: {} },
      ),
      fetchJson<{ exportedAt?: string }>(
        `${BASE_PATH}/preview-data/meta.json`,
        {},
      ),
    ]).then(([companiesPayload, submissionsPayload, settingsPayload, meta]) => ({
      exportedAt: meta?.exportedAt ?? null,
      companies: (companiesPayload.companies ?? []).map((company) => ({
        ...company,
        logoUrl: prefixAssetPath(company.logoUrl),
      })),
      submissions: submissionsPayload.submissions ?? [],
      settings: settingsPayload.settings ?? {},
    }));
  }
  return cachedPromise;
}

/**
 * Bubble sizing, mirroring the live board so the preview renders exactly like
 * the live one (logarithmic scaling between MIN and MAX diameter).
 */
function computeRadius(count: number, maxCount: number): number {
  if (maxCount <= 1) return MIN_BUBBLE_SIZE / 2;
  const logScale = Math.log(count + 1) / Math.log(maxCount + 1);
  const diameter =
    MIN_BUBBLE_SIZE + (MAX_BUBBLE_SIZE - MIN_BUBBLE_SIZE) * logScale;
  return diameter / 2;
}

export function computePreviewNodes(companies: PreviewCompany[]): PreviewNode[] {
  let maxCount = 1;
  const raw: Omit<PreviewNode, "radius">[] = [];

  for (const company of companies) {
    const count = company.count || 0;
    if (count <= 0) continue; // Skip empty companies

    raw.push({
      id: company.id,
      count,
      slug: companySlug(company.id),
      logoUrl: company.logoUrl,
      squareColor: company.squareColor,
    });

    if (count > maxCount) maxCount = count;
  }

  return raw
    .map((company) => ({
      ...company,
      radius: computeRadius(company.count, maxCount),
    }))
    .sort((a, b) => b.count - a.count);
}

export function usePreviewData() {
  const [data, setData] = useState<PreviewData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    loadPreviewData()
      .then((loaded) => {
        if (active) setData(loaded);
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load preview data");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const companiesMap = useMemo(() => {
    const map: Record<string, PreviewCompany> = {};
    (data?.companies ?? []).forEach((company) => {
      map[company.id] = company;
    });
    return map;
  }, [data]);

  const nodes = useMemo(() => computePreviewNodes(data?.companies ?? []), [data]);

  return {
    data,
    companiesMap,
    companies: data?.companies ?? [],
    submissions: data?.submissions ?? [],
    settings: data?.settings ?? {},
    nodes,
    loading: data === null && error === null,
    error,
    exportedAt: data?.exportedAt ?? null,
  };
}