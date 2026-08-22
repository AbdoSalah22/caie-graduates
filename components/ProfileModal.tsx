"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  User,
} from "firebase/auth";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import {
  isValidLinkedInUrl,
  isValidWebsiteUrl,
} from "@/lib/utils";
import Link from "next/link";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ProfileData {
  name: string;
  title: string;
  linkedin: string;
  company: string;
  portfolioCv: string;
  graduationClass: string;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [companies, setCompanies] = useState<string[]>([]);
  const [profileData, setProfileData] = useState<ProfileData>({
    name: "",
    title: "",
    linkedin: "",
    company: "",
    portfolioCv: "",
    graduationClass: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // ── Add Company popup state ──
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyWebsite, setNewCompanyWebsite] = useState("");
  const [addingCompany, setAddingCompany] = useState(false);
  const [addCompanyError, setAddCompanyError] = useState("");
  const [companyAddedNote, setCompanyAddedNote] = useState("");

  // ── Company search box state ──
  const [companyQuery, setCompanyQuery] = useState("");
  const [companyOpen, setCompanyOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Keep the text box in sync when the company changes programmatically
  // (profile load, newly added company, etc.)
  useEffect(() => {
    setCompanyQuery(profileData.company);
  }, [profileData.company]);

  const companyMatches = useMemo(() => {
    const q = companyQuery.trim().toLowerCase();
    if (!q) return companies;
    const starts = companies.filter((c) =>
      c.toLowerCase().startsWith(q),
    );
    const includes = companies.filter(
      (c) =>
        !c.toLowerCase().startsWith(q) && c.toLowerCase().includes(q),
    );
    return [...starts, ...includes];
  }, [companies, companyQuery]);

  // Keep a live ref so the blur handler never reverts to a stale company
  const companyRef = useRef(profileData.company);
  useEffect(() => {
    companyRef.current = profileData.company;
  }, [profileData.company]);

  const selectCompany = (name: string) => {
    setProfileData((prev) => ({ ...prev, company: name }));
    setCompanyQuery(name);
    setCompanyOpen(false);
    setHighlightedIndex(-1);
  };

  const clearCompany = () => {
    setProfileData((prev) => ({ ...prev, company: "" }));
    setCompanyQuery("");
    setCompanyOpen(false);
    setHighlightedIndex(-1);
  };

  const handleCompanyKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (!companyOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setCompanyOpen(true);
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          Math.min(prev + 1, companyMatches.length - 1),
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => Math.max(prev - 1, -1));
        break;
      case "Enter":
        if (companyOpen && highlightedIndex >= 0) {
          e.preventDefault();
          const match = companyMatches[highlightedIndex];
          if (match) selectCompany(match);
        }
        break;
      case "Escape":
        setCompanyOpen(false);
        break;
    }
  };

  const graduationYears = Array.from({ length: 2027 - 2014 + 1 }, (_, index) =>
    String(2014 + index),
  );

  // Check auth state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
        loadUserProfile(currentUser.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch companies list
  const fetchCompanies = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "companies"));
      const companyNames = querySnapshot.docs
        .map((doc) => doc.id)
        .sort((a, b) => a.localeCompare(b));
      setCompanies(companyNames);
    } catch (err) {
      console.error("Error fetching companies:", err);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchCompanies();
    }
  }, [isOpen, fetchCompanies]);

  // Load user's existing profile
  const loadUserProfile = async (userId: string) => {
    try {
      // Try to get submission by document ID (userId)
      const submissionRef = doc(db, "submissions", userId);
      const submissionDoc = await getDoc(submissionRef);

      if (submissionDoc.exists()) {
        const submission = submissionDoc.data();
        setProfileData({
          name: submission.name || "",
          title: submission.title || "",
          linkedin: submission.linkedin || "",
          company: submission.company || "",
          portfolioCv: submission.portfolioCv || "",
          graduationClass: submission.graduationClass || "",
        });
      } else {
        // Fallback: query by userId field (for backwards compatibility)
        const submissionsRef = collection(db, "submissions");
        const q = query(submissionsRef, where("userId", "==", userId));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const submission = querySnapshot.docs[0].data();
          setProfileData({
            name: submission.name || "",
            title: submission.title || "",
            linkedin: submission.linkedin || "",
            company: submission.company || "",
            portfolioCv: submission.portfolioCv || "",
            graduationClass: submission.graduationClass || "",
          });
        }
      }
    } catch (err) {
      console.error("Error loading profile:", err);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError("");
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // Profile will be loaded via auth state change
    } catch (err: unknown) {
      console.error("Sign in error:", err);
      const message = err instanceof Error ? err.message : "Failed to sign in with Google";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setProfileData({
        name: "",
        title: "",
        linkedin: "",
        company: "",
        portfolioCv: "",
        graduationClass: "",
      });
      setSuccess(false);
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  // ── Add Company popup ──
  const websiteIsValid = isValidWebsiteUrl(newCompanyWebsite);
  const canSubmitCompany =
    !!newCompanyName.trim() && websiteIsValid && !addingCompany;

  const closeAddCompanyPopup = () => {
    setShowAddCompany(false);
    setNewCompanyName("");
    setNewCompanyWebsite("");
    setAddCompanyError("");
  };

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmitCompany) return;

    const addedName = newCompanyName.trim();

    setAddingCompany(true);
    setAddCompanyError("");
    try {
      const response = await fetch("/api/add-company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addedName,
          website: newCompanyWebsite.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to add company");
      }

      // Update the dropdown and select the new company immediately
      setCompanies((prev) =>
        prev.includes(addedName)
          ? prev
          : [...prev, addedName].sort((a, b) => a.localeCompare(b)),
      );
      setProfileData((prev) => ({
        ...prev,
        company: addedName,
      }));

      closeAddCompanyPopup();
      setCompanyAddedNote("✓ Company added and selected below");
      setTimeout(() => setCompanyAddedNote(""), 4000);

      // Reconcile with Firestore in the background (no await needed)
      fetchCompanies();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to add company";
      setAddCompanyError(message);
    } finally {
      setAddingCompany(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setError("");
    setLoading(true);

    // Validation
    if (!profileData.name.trim()) {
      setError("Please enter your name");
      setLoading(false);
      return;
    }

    if (!profileData.title.trim()) {
      setError("Please enter your job title");
      setLoading(false);
      return;
    }

    if (!profileData.linkedin.trim()) {
      setError("Please enter your LinkedIn URL");
      setLoading(false);
      return;
    }

    if (!isValidLinkedInUrl(profileData.linkedin)) {
      setError("Please enter a valid LinkedIn URL");
      setLoading(false);
      return;
    }

    if (!profileData.company.trim()) {
      // Hidden profile from board: allowed
    }

    try {
      // Get fresh ID token for server-side verification
      const idToken = await user.getIdToken();

      const response = await fetch("/api/update-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          userId: user.uid,
          name: profileData.name.trim(),
          title: profileData.title.trim(),
          linkedin: profileData.linkedin.trim(),
          company: profileData.company.trim(),
          portfolioCv: profileData.portfolioCv.trim() || "",
          graduationClass: profileData.graduationClass.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="surface-card max-h-[90vh] w-full max-w-md overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/80 p-4 sm:p-6">
          <h2 className="text-xl font-semibold text-white sm:text-2xl">
            My Profile
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {authLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : !user ? (
            /* Sign In View */
            <div className="text-center">
              <div className="mb-6">
                <svg
                  className="w-16 h-16 mx-auto text-gray-400 mb-4"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Sign in with Google
                </h3>
                <p className="text-gray-400 text-sm mb-6">
                  Sign in to manage your profile and update your information
                </p>
              </div>

              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-6 py-3 font-semibold text-slate-800 transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-gray-800"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Sign in with Google
                  </>
                )}
              </button>

              {error && (
                <div className="mt-4 bg-red-600 text-white px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
            </div>
          ) : (
            /* Profile Form View */
            <div>
              {/* User Info */}
              <div className="mb-6 border-b border-slate-800/80 pb-6">
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={user.photoURL || "/default-avatar.png"}
                    alt={user.displayName || "User"}
                    className="h-12 w-12 rounded-full border border-slate-700/70"
                  />
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">
                      {user.displayName || user.email}
                    </h3>
                    <p className="text-gray-400 text-sm">{user.email}</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="text-sm text-slate-400 transition-colors hover:text-white"
                  >
                    Sign out
                  </button>
                </div>
              </div>

              {/* Success Message */}
              {success && (
                <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                  ✓ Profile updated successfully!
                </div>
              )}

              {/* Form */}
              <div className="space-y-4">
                {/* Name Input */}
                <div>
                  <label
                    htmlFor="profile-name"
                    className="section-label"
                  >
                    Your Name
                  </label>
                  <input
                    id="profile-name"
                    type="text"
                    value={profileData.name}
                    onChange={(e) =>
                      setProfileData({ ...profileData, name: e.target.value })
                    }
                    placeholder="John Doe"
                    className="field-input"
                    disabled={loading}
                  />
                </div>

                {/* Title Input */}
                <div>
                  <label
                    htmlFor="profile-title"
                    className="section-label"
                  >
                    Job Title
                  </label>
                  <input
                    id="profile-title"
                    type="text"
                    value={profileData.title}
                    onChange={(e) =>
                      setProfileData({ ...profileData, title: e.target.value })
                    }
                    placeholder="Software Engineer"
                    className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    disabled={loading}
                  />
                </div>

                {/* LinkedIn Input */}
                <div>
                  <label
                    htmlFor="profile-linkedin"
                    className="section-label"
                  >
                    LinkedIn URL
                  </label>
                  <input
                    id="profile-linkedin"
                    type="url"
                    value={profileData.linkedin}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        linkedin: e.target.value,
                      })
                    }
                    placeholder="https://linkedin.com/in/yourprofile"
                    className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    disabled={loading}
                  />
                </div>

                {/* Portfolio/CV Input (optional) */}
                <div>
                  <label
                    htmlFor="profile-portfolio-cv"
                    className="section-label"
                  >
                    Portfolio/CV URL (optional)
                  </label>
                  <input
                    id="profile-portfolio-cv"
                    type="url"
                    value={profileData.portfolioCv}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        portfolioCv: e.target.value,
                      })
                    }
                    placeholder="https://yourportfolio.com or https://yourcv.pdf"
                    className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    disabled={loading}
                  />
                </div>

                {/* Graduation Class Dropdown */}
                <div>
                  <label
                    htmlFor="profile-graduation-class"
                    className="section-label"
                  >
                    Graduation Class
                  </label>
                  <select
                    id="profile-graduation-class"
                    value={profileData.graduationClass}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        graduationClass: e.target.value,
                      }))
                    }
                    className="field-select"
                    disabled={loading}
                  >
                    <option value="">Select your graduation class</option>
                    {graduationYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Company Search Box */}
                <div className="relative">
                  <label
                    htmlFor="profile-company"
                    className="section-label"
                  >
                    Company
                  </label>
                  <div className="relative">
                    <input
                      id="profile-company"
                      type="text"
                      role="combobox"
                      aria-expanded={companyOpen}
                      aria-controls="profile-company-listbox"
                      aria-autocomplete="list"
                      autoComplete="off"
                      value={companyQuery}
                      onChange={(e) => {
                        setCompanyQuery(e.target.value);
                        setCompanyOpen(true);
                        setHighlightedIndex(-1);
                      }}
                      onFocus={() => {
                        setCompanyOpen(true);
                        setHighlightedIndex(-1);
                      }}
                      onBlur={() => {
                        // Delay so option mousedown/click wins over blur
                        setTimeout(() => {
                          setCompanyOpen(false);
                          setHighlightedIndex(-1);
                          setCompanyQuery(companyRef.current);
                        }, 150);
                      }}
                      onKeyDown={handleCompanyKeyDown}
                      placeholder="Start typing to search companies"
                      className="field-input pr-9"
                      disabled={loading}
                    />
                    {profileData.company ? (
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={clearCompany}
                        title="Clear company (hide from board)"
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    ) : null}

                    {companyOpen && !loading ? (
                      <div
                        id="profile-company-listbox"
                        role="listbox"
                        className="absolute z-20 mt-1 w-full overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 shadow-2xl max-h-52"
                      >
                        {companyMatches.length ? (
                          companyMatches.map((name, index) => (
                            <button
                              key={name}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => selectCompany(name)}
                              onMouseEnter={() => setHighlightedIndex(index)}
                              className={`block w-full px-4 py-2.5 text-left text-sm transition-colors ${
                                index === highlightedIndex
                                  ? "bg-cyan-500/10 text-cyan-200"
                                  : "text-slate-200 hover:bg-slate-800"
                              }`}
                            >
                              {name}
                            </button>
                          ))
                        ) : (
                          <p className="px-4 py-3 text-sm text-slate-500">
                            No matching company — use “Add it here” below
                          </p>
                        )}
                      </div>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-slate-400">
                    Leave empty to hide your profile from the board.
                  </p>
                </div>

                {/* Add Company Section */}
                <div className="rounded-2xl border border-slate-700/70 bg-slate-800/70 p-4">
                  <label className="section-label">
                    Can&apos;t find your company? Add it here:
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddCompany(true)}
                    disabled={loading}
                    className="secondary-btn w-full py-2.5"
                  >
                    + Add Company
                  </button>
                  {companyAddedNote ? (
                    <p className="mt-2 text-sm text-emerald-300">
                      {companyAddedNote}
                    </p>
                  ) : null}
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-600 text-white px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {/* Save Button */}
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="primary-btn w-full py-3 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Company Popup */}
      {showAddCompany ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
          onClick={closeAddCompanyPopup}
        >
          <div
            className="surface-card w-full max-w-sm p-5 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                Add New Company
              </h3>
              <button
                type="button"
                onClick={closeAddCompanyPopup}
                className="text-gray-400 transition-colors hover:text-white"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddCompany} className="space-y-4">
              <div>
                <label htmlFor="new-company-name" className="section-label">
                  Company Name
                </label>
                <input
                  id="new-company-name"
                  type="text"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  placeholder="e.g. Siemens"
                  className="field-input"
                  disabled={addingCompany}
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="new-company-website" className="section-label">
                  Company Website
                </label>
                <input
                  id="new-company-website"
                  type="url"
                  value={newCompanyWebsite}
                  onChange={(e) => setNewCompanyWebsite(e.target.value)}
                  placeholder="https://company.com"
                  className={`field-input ${
                    newCompanyWebsite && !websiteIsValid
                      ? "border-red-500/60 focus:border-red-500 focus:ring-red-500/20"
                      : ""
                  }`}
                  disabled={addingCompany}
                />
                {newCompanyWebsite && !websiteIsValid ? (
                  <p className="mt-1.5 text-xs text-red-400">
                    Please enter a valid link, e.g. https://company.com
                  </p>
                ) : null}
              </div>

              {addCompanyError ? (
                <div className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm">
                  {addCompanyError}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={!canSubmitCompany}
                className="primary-btn w-full py-3 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {addingCompany ? "Adding..." : "Add Company"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
