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
        c.toLowerCase().includes(company.toLowerCase())
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-4xl font-bold text-white mb-2 hover:text-blue-400 transition-colors">
              CESS Graduates
            </h1>
          </Link>
          <p className="text-gray-400">Submit your information</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-600 text-white px-4 py-3 rounded-lg animate-fade-in">
            ✓ Successfully submitted! Redirecting...
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-gray-800 rounded-lg shadow-2xl p-8"
        >
          {/* Name Input */}
          <div className="mb-6">
            <label
              htmlFor="name"
              className="block text-gray-300 font-semibold mb-2"
            >
              Your Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              disabled={loading || success}
            />
          </div>

          {/* Title Input */}
          <div className="mb-6">
            <label
              htmlFor="title"
              className="block text-gray-300 font-semibold mb-2"
            >
              Job Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Software Engineer"
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              disabled={loading || success}
            />
          </div>

          {/* LinkedIn Input */}
          <div className="mb-6">
            <label
              htmlFor="linkedin"
              className="block text-gray-300 font-semibold mb-2"
            >
              LinkedIn URL
            </label>
            <input
              id="linkedin"
              type="url"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              placeholder="https://linkedin.com/in/yourprofile"
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              disabled={loading || success}
            />
          </div>

          {/* Company Dropdown */}
          <div className="mb-6">
            <label
              htmlFor="company"
              className="block text-gray-300 font-semibold mb-2"
            >
              Company
            </label>
            <select
              id="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
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
          <div className="mb-6 p-4 bg-gray-700 rounded-lg border border-gray-600">
            <label className="block text-gray-300 font-semibold mb-2">
              If your company is not in the list, add it here
            </label>
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLScG4TfmYF4Is0Xzu07tY-I_bl9z8HVKC7MXK-w7D7_r-mS2HA/viewform?usp=publish-editor"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block w-full bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 hover:scale-105 text-center"
            >
              Suggest
            </a>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-600 text-white px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || success}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading ? "Submitting..." : success ? "Submitted!" : "Submit"}
          </button>

          {/* Back Link */}
          <Link
            href="/"
            className="block text-center mt-4 text-gray-400 hover:text-white transition-colors"
          >
            ← Back to artboard
          </Link>
        </form>
      </div>
    </div>
  );
}
