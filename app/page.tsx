"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Node } from "@/types";
import { BoardView } from "@/hooks/useForceGraph";
import { MIN_BUBBLE_SIZE, MAX_BUBBLE_SIZE } from "@/lib/constants";
import Artboard from "@/components/Artboard";
import ProfileModal from "@/components/ProfileModal";
import Link from "next/link";

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

/**
 * Main page - displays the dynamic logo artboard
 *
 * Real-time Firestore listener updates the display whenever:
 * - A new company is added
 * - A company's graduate count changes
 * - Logo URLs are updated
 *
 * Companies are sized proportionally to their graduate count
 * using logarithmic scaling and D3 force-directed layout.
 */
export default function Home() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [showProfileButton, setShowProfileButton] = useState(true);
  const [view, setView] = useState<BoardView>("bubble");

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settingsRef = doc(db, "settings", "home");
        const settingsDoc = await getDoc(settingsRef);
        if (settingsDoc.exists()) {
          setShowProfileButton(settingsDoc.data().showProfileButton ?? true);
        }
      } catch (error) {
        console.error("Error loading home settings:", error);
      }
    };

    loadSettings();

    // Set up real-time listener for companies collection
    const q = query(collection(db, "companies"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        // First pass: collect raw data and find maxCount
        const rawData: { id: string; count: number; logoUrl?: string }[] = [];
        let maxCount = 1;

        snapshot.forEach((doc) => {
          const data = doc.data();
          const count = data.count || 0;

          if (count <= 0) return; // Skip empty companies

          rawData.push({
            id: doc.id,
            count,
            logoUrl: data.logoUrl,
          });

          if (count > maxCount) maxCount = count;
        });

        // Second pass: compute logarithmic radii
        const companiesData: Node[] = rawData.map((company) => ({
          id: company.id,
          count: company.count,
          radius: computeRadius(company.count, maxCount),
          logoUrl: company.logoUrl,
        }));

        // Sort by count descending (largest companies first)
        companiesData.sort((a, b) => b.count - a.count);

        setNodes(companiesData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching companies:", error);
        setLoading(false);
      },
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="page-shell flex min-h-screen items-center justify-center">
        <div className="surface-card-soft px-8 py-10 text-center">
          <div className="mx-auto mb-4 h-14 w-14 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-400"></div>
          <p className="text-slate-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="page-shell relative overflow-hidden">
      <Artboard nodes={nodes} view={view} />

      {/* My Profile button */}
      {showProfileButton ? (
        <button
          onClick={() => setIsProfileModalOpen(true)}
          className="fixed top-3 right-3 z-10 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_12px_30px_rgba(6,182,212,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] sm:top-8 sm:right-8 sm:px-6 sm:py-3 sm:text-base"
        >
          My Profile
        </button>
      ) : null}

      {/* Title overlay */}
      <div className="fixed top-3 left-3 z-10 rounded-2xl border border-slate-800/70 bg-slate-950/50 px-3 py-2 backdrop-blur sm:top-8 sm:left-8 sm:px-4 sm:py-3">
        <h1 className="mb-0 text-lg font-semibold tracking-tight text-white sm:mb-1 sm:text-4xl">
          CAIE Graduates
        </h1>
        <p className="-mt-1 text-xs italic text-slate-300/90 sm:text-sm tracking-tight">
          Formerly CESS
        </p>
        <p className="text-xs text-slate-400 sm:text-base">
          {nodes.length} {nodes.length === 1 ? "company" : "companies"} •{" "}
          {nodes.reduce((sum, node) => sum + node.count, 0)} graduates
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Link
            href="/browse-graduates"
            className="inline-flex rounded-full border border-slate-700/70 bg-slate-800/80 px-3 py-1.5 text-[11px] font-semibold text-slate-100 shadow-[0_10px_24px_rgba(2,8,23,0.18)] transition-all duration-300 hover:bg-slate-700"
          >
            Browse Graduates
          </Link>
          <button
            onClick={() =>
              setView((v) => (v === "bubble" ? "grid" : "bubble"))
            }
            className="inline-flex rounded-full border border-slate-700/70 bg-slate-800/80 px-3 py-1.5 text-[11px] font-semibold text-slate-100 shadow-[0_10px_24px_rgba(2,8,23,0.18)] transition-all duration-300 hover:bg-slate-700"
          >
            {view === "bubble" ? "Grid View" : "Bubble View"}
          </button>
        </div>
      </div>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </main>
  );
}
