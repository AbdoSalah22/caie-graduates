"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Node } from "@/types";
import { getCachedNodes, subscribeToBoard } from "@/lib/boardStore";
import Artboard from "@/components/Artboard";
import ProfileModal from "@/components/ProfileModal";
import Link from "next/link";
import { BoardView } from "@/hooks/useForceGraph";

/**
 * Main page - displays the dynamic logo artboard.
 *
 * Board data is read from a module-level cache (lib/boardStore) whose
 * real-time Firestore listener stays alive across navigations, so going
 * back to the board renders instantly without re-downloading everything:
 * - First visit establishes the listener.
 * - Navigating away keeps the listener (and cached snapshot) alive.
 * - Returning reuses the cached snapshot; the page is already up to date.
 * - A new company added elsewhere updates the cache through the same
 *   listener, so only that change is ever fetched.
 */
export default function Home() {
  const [nodes, setNodes] = useState<Node[]>(() => getCachedNodes() ?? []);
  const [loading, setLoading] = useState(() => getCachedNodes() === null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [showProfileButton, setShowProfileButton] = useState(true);
  const [view, setView] = useState<BoardView>("bubble");

  useEffect(() => {
    const unsubscribe = subscribeToBoard((latest) => {
      setNodes(latest);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

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
