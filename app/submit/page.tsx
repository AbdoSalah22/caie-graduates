"use client";

import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * Submission form page
 *
 * Allows graduates to submit their name and company
 * Features auto-suggest for existing companies
 * Validates input and provides user feedback
 */
export default function SubmitPage() {
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [company, setCompany] = useState("");
  const [companies, setCompanies] = useState<string[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  // Fetch existing companies for dropdown
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "companies"));
        const companyNames = querySnapshot.docs.map((doc) => doc.id);
        companyNames.sort();
        setCompanies(companyNames);
      } catch (err) {
        console.error("Error fetching companies:", err);
      }
    };

    fetchCompanies();
  }, []);

  // Filter companies based on input
  useEffect(() => {
    if (company.trim()) {
      const filtered = companies.filter((c) =>
        c.toLowerCase().includes(company.toLowerCase()),
      );
      setFilteredCompanies(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setFilteredCompanies([]);
      setShowSuggestions(false);
    }
  }, [company, companies]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validation
    if (!name.trim()) {
      setError("Please enter your name");
      setLoading(false);
      return;
    }

    if (!title.trim()) {
      setError("Please enter your title");
      setLoading(false);
      return;
    }

    if (!linkedin.trim()) {
      setError("Please enter your LinkedIn URL");
      setLoading(false);
      return;
    }

    if (!company) {
      setError("Please select a company");
      setLoading(false);
      return;
    }

    try {
      // Call API route
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          title: title.trim(),
          linkedin: linkedin.trim(),
          company: company,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit");
      }

      // Success
      setSuccess(true);
      setName("");
      setTitle("");
      setLinkedin("");
      setCompany("");

      // Redirect to home after 2 seconds
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="page-header mb-8 text-center">
          <Link href="/" className="inline-block">
            <h1 className="page-title mb-2 hover:text-cyan-300 transition-colors">
              CAIE Graduates
            </h1>
          </Link>
          <p className="page-subtitle">Submit your information</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            ✓ Successfully submitted! Redirecting...
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="surface-card p-8">
          {/* Name Input */}
          <div className="mb-6">
            <label htmlFor="name" className="section-label">
              Your Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="field-input"
              disabled={loading || success}
            />
          </div>

          {/* Title Input */}
          <div className="mb-6">
            <label htmlFor="title" className="section-label">
              Job Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Software Engineer"
              className="field-input"
              disabled={loading || success}
            />
          </div>

          {/* LinkedIn Input */}
          <div className="mb-6">
            <label htmlFor="linkedin" className="section-label">
              LinkedIn URL
            </label>
            <input
              id="linkedin"
              type="url"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              placeholder="https://linkedin.com/in/yourprofile"
              className="field-input"
              disabled={loading || success}
            />
          </div>

          {/* Company Dropdown */}
          <div className="mb-6">
            <label htmlFor="company" className="section-label">
              Company
            </label>
            <select
              id="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="field-select"
              disabled={loading || success}
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
          <div className="mb-6 rounded-2xl border border-slate-700/70 bg-slate-800/70 p-4">
            <label className="section-label">
              If your company is not in the list, add it here
            </label>
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLScG4TfmYF4Is0Xzu07tY-I_bl9z8HVKC7MXK-w7D7_r-mS2HA/viewform?usp=publish-editor"
              target="_blank"
              rel="noopener noreferrer"
              className="secondary-btn w-full py-2.5"
            >
              Suggest
            </a>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || success}
            className="primary-btn w-full py-3 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Submitting..." : success ? "Submitted!" : "Submit"}
          </button>

          {/* Back Link */}
          <Link href="/" className="ghost-link mt-4 block justify-center">
            ← Back to artboard
          </Link>
        </form>
      </div>
    </div>
  );
}
