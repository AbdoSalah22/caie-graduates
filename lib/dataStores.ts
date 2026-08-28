import {
  collection,
  getDocs,
  onSnapshot,
  query,
  Query,
  QuerySnapshot,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type SubmissionRow = {
  id: string;
  name: string;
  title: string;
  linkedin: string;
  company: string;
  portfolioCv?: string;
  graduationClass?: string;
  timestamp: unknown;
};

export type CompanyDoc = {
  logoUrl?: string;
  count?: number;
};

export type CompaniesMap = Record<string, CompanyDoc>;

/**
 * A module-level cache for a single Firestore query.
 *
 * Exactly one real-time listener is kept alive per store, so every page that
 * reads the same collection shares the same cached snapshot and no document
 * is downloaded more than once per session. Pages render instantly from the
 * cache on remount and only receive changed documents thereafter (Firestore
 * replays deltas against the IndexedDB persistence layer).
 */
interface QueryStore<T> {
  get: () => T | null;
  subscribe: (cb: (data: T | null) => void) => () => void;
  refresh: () => Promise<void>;
}

function createQueryStore<T>(
  buildQuery: () => Query,
  mapSnapshot: (snap: QuerySnapshot) => T,
): QueryStore<T> {
  let data: T | null = null;
  const listeners = new Set<(data: T | null) => void>();
  let unsubscribe: Unsubscribe | null = null;

  function emit() {
    listeners.forEach((cb) => cb(data));
  }

  function ensureListener() {
    if (unsubscribe) return;
    unsubscribe = onSnapshot(
      buildQuery(),
      (snap) => {
        data = mapSnapshot(snap);
        emit();
      },
      (error) => {
        console.error("Error in cached query listener:", error);
      },
    );
  }

  return {
    get: () => data,
    subscribe: (cb) => {
      listeners.add(cb);
      ensureListener();
      cb(data);
      return () => listeners.delete(cb);
    },
    refresh: async () => {
      const snap = await getDocs(buildQuery());
      data = mapSnapshot(snap);
      emit();
    },
  };
}

/** All submissions, cached (shared by the browse and company pages). */
export const submissionsStore = createQueryStore<SubmissionRow[]>(
  () => query(collection(db, "submissions")),
  (snap) => {
    const rows: SubmissionRow[] = [];
    snap.forEach((doc) => {
      const d = doc.data();
      rows.push({
        id: doc.id,
        name: d.name || "",
        title: d.title || "",
        linkedin: d.linkedin || "",
        company: d.company || "",
        portfolioCv: d.portfolioCv || undefined,
        graduationClass: d.graduationClass || undefined,
        timestamp: d.timestamp ?? null,
      });
    });
    return rows;
  },
);

/** All company documents keyed by name, cached (shared by all pages). */
export const companiesStore = createQueryStore<CompaniesMap>(
  () => query(collection(db, "companies")),
  (snap) => {
    const map: CompaniesMap = {};
    snap.forEach((doc) => {
      map[doc.id] = doc.data() as CompanyDoc;
    });
    return map;
  },
);