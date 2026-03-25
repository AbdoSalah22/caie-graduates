"use client";

import { useState, useEffect } from "react";
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
import { useRouter } from "next/navigation";
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
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

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
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "companies"));
        const companyNames = querySnapshot.docs
          .map((doc) => doc.id)
          .sort((a, b) => a.localeCompare(b));
        setCompanies(companyNames);
      } catch (err) {
        console.error("Error fetching companies:", err);
      }
    };

    if (isOpen) {
      fetchCompanies();
    }
  }, [isOpen]);

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
    } catch (err: any) {
      console.error("Sign in error:", err);
      setError(err.message || "Failed to sign in with Google");
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
      });
      setSuccess(false);
    } catch (err) {
      console.error("Sign out error:", err);
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

    if (!profileData.company.trim()) {
      setError("Please select a company");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/update-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.uid,
          name: profileData.name.trim(),
          title: profileData.title.trim(),
          linkedin: profileData.linkedin.trim(),
          company: profileData.company.trim(),
          portfolioCv: profileData.portfolioCv.trim() || "",
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
        // Refresh the page to reflect changes
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-4 sm:p-6 flex justify-between items-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white">
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
                className="w-full bg-white hover:bg-gray-100 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3"
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
              <div className="mb-6 pb-6 border-b border-gray-700">
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={user.photoURL || "/default-avatar.png"}
                    alt={user.displayName || "User"}
                    className="w-12 h-12 rounded-full"
                  />
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">
                      {user.displayName || user.email}
                    </h3>
                    <p className="text-gray-400 text-sm">{user.email}</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              </div>

              {/* Success Message */}
              {success && (
                <div className="mb-6 bg-green-600 text-white px-4 py-3 rounded-lg">
                  ✓ Profile updated successfully!
                </div>
              )}

              {/* Form */}
              <div className="space-y-4">
                {/* Name Input */}
                <div>
                  <label
                    htmlFor="profile-name"
                    className="block text-gray-300 font-semibold mb-2"
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
                    className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    disabled={loading}
                  />
                </div>

                {/* Title Input */}
                <div>
                  <label
                    htmlFor="profile-title"
                    className="block text-gray-300 font-semibold mb-2"
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
                    className="block text-gray-300 font-semibold mb-2"
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
                    className="block text-gray-300 font-semibold mb-2"
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

                {/* Company Dropdown */}
                <div>
                  <label
                    htmlFor="profile-company"
                    className="block text-gray-300 font-semibold mb-2"
                  >
                    Company
                  </label>
                  <select
                    id="profile-company"
                    value={profileData.company}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        company: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    disabled={loading}
                  >
                    <option value="">Select a company</option>
                    {companies.map((companyName) => (
                      <option key={companyName} value={companyName}>
                        {companyName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Suggest Company Section */}
                <div className="p-4 bg-gray-700 rounded-lg border border-gray-600">
                  <label className="block text-gray-300 font-semibold mb-2">
                    If your company is not in the list, add it here
                  </label>
                  <a
                    href="https://docs.google.com/forms/d/e/1FAIpQLScG4TfmYF4Is0Xzu07tY-I_bl9z8HVKC7MXK-w7D7_r-mS2HA/viewform?usp=publish-editor"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={onClose}
                    className="inline-block w-full bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 hover:scale-105 text-center"
                  >
                    Suggest
                  </a>
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
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
