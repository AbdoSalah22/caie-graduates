import { useEffect, useMemo, useState } from "react";
import { MIN_BUBBLE_SIZE, MAX_BUBBLE_SIZE } from "@/lib/constants";

/**
 * Static demo data layer.
 *
 * The /demo route is fully static: it loads companies, submissions and
 * settings from local JSON files exported by `npm run export-demo` (see
 * scripts/export-demo.cjs). Nothing here touches Firebase or Firestore —
 * no auth, no listeners, no network requests except fetching the JSON
 * files (and the logged-in-free page images) straight from the static bundle.
 */

export type DemoCompany = {
  id: string;
  count?: number;
  logoUrl?: string;
  squareColor?: string;
  website?: string;
};

export type DemoSubmission = {
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

export type DemoHomeSettings = {
  showProfileButton?: boolean;
};

export type DemoData = {
  exportedAt: string | null;
  companies: DemoCompany[];
  submissions: DemoSubmission[];
  settings: DemoHomeSettings;
};

export type DemoNode = {
  id: string;
  count: number;
  radius: number;
  logoUrl?: string;
  squareColor?: string;
};

async function fetchJson<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } catch (err) {
    console.error(`Failed to load demo data from ${url}`, err);
    return fallback;
  }
}

let cachedPromise: Promise<DemoData> | null = null;

/** Load the exported demo snapshot (fetched once, shared across pages). */
export function loadDemoData(): Promise<DemoData> {
  if (!cachedPromise) {
    cachedPromise = Promise.all([
      fetchJson<{ companies: DemoCompany[] }>("/demo-data/companies.json", {
        companies: [],
      }),
      fetchJson<{ submissions: DemoSubmission[] }>(
        "/demo-data/submissions.json",
        { submissions: [] },
      ),
      fetchJson<{ settings: DemoHomeSettings }>("/demo-data/settings.json", {
        settings: {},
      }),
      fetchJson<{ exportedAt?: string }>("/demo-data/meta.json", {}),
    ]).then(([companiesPayload, submissionsPayload, settingsPayload, meta]) => ({
      exportedAt: meta?.exportedAt ?? null,
      companies: companiesPayload.companies ?? [],
      submissions: submissionsPayload.submissions ?? [],
      settings: settingsPayload.settings ?? {},
    }));
  }
  return cachedPromise;
}

/**
 * Bubble sizing, mirroring lib/boardStore so the demo board renders exactly
 * like the live one (logarithmic scaling between MIN and MAX diameter).
 */
function computeRadius(count: number, maxCount: number): number {
  if (maxCount <= 1) return MIN_BUBBLE_SIZE / 2;
  const logScale = Math.log(count + 1) / Math.log(maxCount + 1);
  const diameter =
    MIN_BUBBLE_SIZE + (MAX_BUBBLE_SIZE - MIN_BUBBLE_SIZE) * logScale;
  return diameter / 2;
}

export function computeDemoNodes(companies: DemoCompany[]): DemoNode[] {
  let maxCount = 1;
  const raw: Omit<DemoNode, "radius">[] = [];

  for (const company of companies) {
    const count = company.count || 0;
    if (count <= 0) continue; // Skip empty companies

    raw.push({
      id: company.id,
      count,
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

export function useDemoData() {
  const [data, setData] = useState<DemoData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    loadDemoData()
      .then((loaded) => {
        if (active) setData(loaded);
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load demo data");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const companiesMap = useMemo(() => {
    const map: Record<string, DemoCompany> = {};
    (data?.companies ?? []).forEach((company) => {
      map[company.id] = company;
    });
    return map;
  }, [data]);

  const nodes = useMemo(() => computeDemoNodes(data?.companies ?? []), [data]);

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