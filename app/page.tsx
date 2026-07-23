"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Node, Company } from "@/types";
import { MIN_RADIUS, SCALING_FACTOR } from "@/lib/constants";
import Artboard from "@/components/Artboard";
import ProfileModal from "@/components/ProfileModal";
import Link from "next/link";

/**
 * Main page - displays the dynamic logo artboard
 *
 * Real-time Firestore listener updates the display whenever:
 * - A new company is added
 * - A company's graduate count changes
 * - Logo URLs are updated
 *
 * Automatically converts company data to nodes with computed radius
 */
export default function Home() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [showProfileButton, setShowProfileButton] = useState(true);

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
        const companiesData: Node[] = [];

        snapshot.forEach((doc) => {
          const data = doc.data() as Company;
          const companyName = doc.id;

          // Skip companies with 0 graduates
          if (!data.count || data.count <= 0) {
            return;
          }

          // Calculate radius based on graduate count
          const radius = MIN_RADIUS + data.count * SCALING_FACTOR;

          companiesData.push({
            id: companyName,
            count: data.count,
            radius,
            logoUrl: data.logoUrl, // Include logo URL
          });
        });

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
      <Artboard nodes={nodes} />

      {/* Floating action buttons */}
      {/* <Link
        href="/submit"
        className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 py-3 shadow-2xl transition-all duration-300 hover:scale-105 font-semibold z-10"
      >
        + Add Graduate
      </Link> */}

      {/* My Profile button */}
      {showProfileButton ? (
        <button
          onClick={() => setIsProfileModalOpen(true)}
          className="fixed top-3 right-3 z-10 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_12px_30px_rgba(6,182,212,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] sm:top-8 sm:right-8 sm:px-6 sm:py-3 sm:text-base"
        >
          My Profile
        </button>
      ) : null}

      {/* Browse Graduates button */}
      <Link
        href="/browse-graduates"
        className="fixed bottom-3 left-3 z-10 rounded-full border border-slate-700/70 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-100 shadow-[0_12px_30px_rgba(2,8,23,0.24)] transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-slate-700 sm:bottom-8 sm:left-8 sm:px-6 sm:py-3 sm:text-base"
      >
        Browse Graduates
      </Link>

      {/* Admin button hidden - only accessible via direct URL */}
      {/* <Link
        href="/admin"
        className="fixed bottom-8 left-8 bg-gray-700 hover:bg-gray-600 text-white rounded-full px-6 py-3 shadow-2xl transition-all duration-300 hover:scale-105 font-semibold z-10"
      >
        Admin
      </Link> */}

      {/* Title overlay */}
      <div className="fixed top-3 left-3 z-10 rounded-2xl border border-slate-800/70 bg-slate-950/50 px-3 py-2 backdrop-blur sm:top-8 sm:left-8 sm:px-4 sm:py-3">
        <h1 className="mb-0.5 text-lg font-semibold tracking-tight text-white sm:mb-2 sm:text-4xl">
          CESS Graduates
        </h1>
        <p className="text-xs text-slate-400 sm:text-base">
          {nodes.length} {nodes.length === 1 ? "company" : "companies"} •{" "}
          {nodes.reduce((sum, node) => sum + node.count, 0)} graduates
        </p>
      </div>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </main>
  );
}
