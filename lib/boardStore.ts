import { Node } from "@/types";
import { MIN_BUBBLE_SIZE, MAX_BUBBLE_SIZE } from "@/lib/constants";
import { CompaniesMap, companiesStore } from "@/lib/dataStores";

/**
 * Compute bubble radius using logarithmic scaling.
 *
 * Log scaling prevents a single dominant company from dwarfing all others.
 * A company with 50 employees will be noticeably larger than one with 5,
 * but not 10× larger.
 */
function computeRadius(count: number, maxCount: number): number {
  if (maxCount <= 1) return MIN_BUBBLE_SIZE / 2;
  const logScale = Math.log(count + 1) / Math.log(maxCount + 1);
  const diameter = MIN_BUBBLE_SIZE + (MAX_BUBBLE_SIZE - MIN_BUBBLE_SIZE) * logScale;
  return diameter / 2; // radius = half of diameter
}

function computeNodes(companies: CompaniesMap): Node[] {
  const rawData: { id: string; count: number; logoUrl?: string }[] = [];
  let maxCount = 1;

  Object.entries(companies).forEach(([id, company]) => {
    const count = company.count || 0;
    if (count <= 0) return; // Skip empty companies

    rawData.push({
      id,
      count,
      logoUrl: company.logoUrl,
    });

    if (count > maxCount) maxCount = count;
  });

  return rawData
    .map((company) => ({
      id: company.id,
      count: company.count,
      radius: computeRadius(company.count, maxCount),
      logoUrl: company.logoUrl,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Module-level board cache.
 *
 * Derives board nodes from the shared companies store, so the whole app
 * keeps a single real-time listener on the companies collection. The
 * listener stays alive across navigations and the cached snapshot renders
 * the board instantly on return, while newly added companies flow in as
 * deltas through the same listener.
 */
let cachedNodes: Node[] | null = null;
let changeListeners: Array<(nodes: Node[]) => void> = [];
let started = false;

function ensureSync() {
  if (started) return;
  started = true;

  companiesStore.subscribe((companies) => {
    if (companies === null) return; // Store still loading
    cachedNodes = computeNodes(companies);
    changeListeners.forEach((cb) => cb(cachedNodes as Node[]));
  });
}

/** Return the last board snapshot (or null before the first load). */
export function getCachedNodes(): Node[] | null {
  return cachedNodes;
}

/**
 * Subscribe to board updates. If a cached snapshot already exists it is
 * delivered synchronously, so remounting the board is instant.
 */
export function subscribeToBoard(cb: (nodes: Node[]) => void): () => void {
  changeListeners.push(cb);
  if (cachedNodes) cb(cachedNodes);

  ensureSync();

  return () => {
    changeListeners = changeListeners.filter((listener) => listener !== cb);
  };
}