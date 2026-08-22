"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AdminGate from "@/components/AdminGate";
import { useAdminAuth } from "@/hooks/useAdminAuth";

/* ─────────────────────────────────────────────
   Sub-components
   ───────────────────────────────────────────── */

// ── Settings Section ──
function SettingsSection({
  showProfileButton,
  setShowProfileButton,
  onSave,
}: {
  showProfileButton: boolean;
  setShowProfileButton: (v: boolean) => void;
  onSave: () => void;
}) {
  return (
    <div className="surface-card p-6 mb-8">
      <h2 className="text-2xl font-semibold text-white mb-4">
        Home Page Settings
      </h2>
      <div className="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-800/70 p-4">
        <div>
          <h3 className="text-white font-semibold">
            Show My Profile button
          </h3>
          <p className="text-gray-400 text-sm">
            Enable or disable the button on the home page.
          </p>
        </div>
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            checked={showProfileButton}
            onChange={(e) => setShowProfileButton(e.target.checked)}
            className="peer sr-only"
          />
          <div className="h-6 w-11 rounded-full bg-gray-600 peer-checked:bg-blue-600 transition-all"></div>
          <div className="pointer-events-none absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-all peer-checked:translate-x-5"></div>
        </label>
      </div>
      <button
        type="button"
        onClick={onSave}
        className="primary-btn mt-4 px-4 py-2"
      >
        Save Settings
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Admin Dashboard
   ───────────────────────────────────────────── */

export default function AdminPage() {
  const { user, signOutUser } = useAdminAuth();
  const [showProfileButton, setShowProfileButton] = useState(true);
  const [message, setMessage] = useState("");

  // ── Settings ──
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settingsRef = doc(db, "settings", "home");
        const settingsDoc = await getDoc(settingsRef);
        if (settingsDoc.exists()) {
          setShowProfileButton(settingsDoc.data().showProfileButton ?? true);
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      }
    };

    if (user) loadSettings();
  }, [user]);

  const saveSettings = async () => {
    try {
      const settingsRef = doc(db, "settings", "home");
      await setDoc(
        settingsRef,
        { showProfileButton, updatedAt: serverTimestamp() },
        { merge: true },
      );
      setMessage("Home page settings updated");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage("Error saving settings");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  return (
    <AdminGate>
      <div className="page-shell px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <div className="page-container max-w-6xl">
          <div className="page-header mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="page-title">Admin Panel</h1>
              <p className="page-subtitle">
                Signed in as{" "}
                <span className="font-medium text-slate-200">{user?.email}</span>
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={signOutUser}
                className="secondary-btn px-4 py-2.5"
              >
                Sign out
              </button>
              <Link href="/" className="secondary-btn px-6 py-2.5">
                ← Back to Board
              </Link>
            </div>
          </div>

          {message && (
            <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
              {message}
            </div>
          )}

          {/* ── Management shortcuts ── */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2">
            <Link
              href="/admin/graduates"
              className="surface-card group flex flex-col gap-3 p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-400/40 hover:shadow-cyan-500/10"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-300">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  viewBox="0 0 24 24"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Manage Graduates
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Add new graduates or edit and remove existing ones.
                </p>
              </div>
              <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-cyan-400 transition-colors group-hover:text-cyan-300">
                Open
                <svg
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </span>
            </Link>

            <Link
              href="/admin/companies"
              className="surface-card group flex flex-col gap-3 p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-400/40 hover:shadow-cyan-500/10"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-300">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  viewBox="0 0 24 24"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="7" width="20" height="14" rx="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Manage Companies
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Add companies or update their logos.
                </p>
              </div>
              <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-cyan-400 transition-colors group-hover:text-cyan-300">
                Open
                <svg
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </span>
            </Link>
          </div>

          <SettingsSection
            showProfileButton={showProfileButton}
            setShowProfileButton={setShowProfileButton}
            onSave={saveSettings}
          />
        </div>
      </div>
    </AdminGate>
  );
}
