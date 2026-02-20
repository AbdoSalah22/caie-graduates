"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * Suggest Company page
 *
 * Allows students to suggest a new company that is not in the list
 * The suggestion will be stored for admin review
 */
export default function SuggestCompanyPage() {
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validation
    if (!companyName.trim()) {
      setError("Please enter a company name");
      setLoading(false);
      return;
    }

    try {
      // Call API route
      const response = await fetch("/api/suggest-company", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyName: companyName.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit suggestion");
      }

      // Success
      setSuccess(true);
      setCompanyName("");

      // Redirect to board after 2 seconds
      setTimeout(() => {
        router.push("/");
      }, 1000);
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
          <Link href="/submit" className="inline-block">
            <h1 className="text-4xl font-bold text-white mb-2 hover:text-blue-400 transition-colors">
              CESS Graduates
            </h1>
          </Link>
          <p className="text-gray-400">Suggest a new company</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-600 text-white px-4 py-3 rounded-lg animate-fade-in">
            ✓ Company suggestion submitted! Redirecting...
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-gray-800 rounded-lg shadow-2xl p-8"
        >
          {/* Company Name Input */}
          <div className="mb-6">
            <label
              htmlFor="companyName"
              className="block text-gray-300 font-semibold mb-2"
            >
              Company Name
            </label>
            <input
              id="companyName"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Enter company name"
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              disabled={loading || success}
            />
            <p className="text-gray-400 text-sm mt-2">
              Your suggestion will be reviewed by an admin. Once approved, you
              can add yourself to this company.
            </p>
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
            {loading ? "Submitting..." : success ? "Submitted!" : "Suggest"}
          </button>

          {/* Back Link */}
          <Link
            href="/"
            className="block text-center mt-4 text-gray-400 hover:text-white transition-colors"
          >
            ← Back to graduates board
          </Link>
        </form>
      </div>
    </div>
  );
}
