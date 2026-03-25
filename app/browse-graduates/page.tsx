"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

type SubmissionRow = {
  id: string;
  name: string;
  title: string;
  linkedin: string;
  company: string;
  portfolioCv?: string;
  timestamp?: any;
};

type CompanyRow = {
  logoUrl?: string;
  count?: number;
};

export default function BrowseGraduatesPage() {
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [companies, setCompanies] = useState<Record<string, CompanyRow>>({});

  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "submissions"), (snapshot) => {
      const rows: SubmissionRow[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as any;
        rows.push({
          id: doc.id,
          name: data.name || "",
          title: data.title || "",
          linkedin: data.linkedin || "",
          company: data.company || "",
          portfolioCv: data.portfolioCv || undefined,
          timestamp: data.timestamp,
        });
      });
      setSubmissions(rows);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "companies"), (snapshot) => {
      const map: Record<string, CompanyRow> = {};
      snapshot.forEach((doc) => {
        map[doc.id] = doc.data() as CompanyRow;
      });
      setCompanies(map);
    });

    return () => unsub();
  }, []);

  const companyOptions = useMemo(() => {
    const names = Object.keys(companies).filter((name) => {
      const c = companies[name]?.count ?? 0;
      return c > 0;
    });
    return names.sort((a, b) => a.localeCompare(b));
  }, [companies]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return submissions
      .filter((s) => (selectedCompany === "all" ? true : s.company === selectedCompany))
      .filter((s) => {
        if (!q) return true;
        return (
          s.name.toLowerCase().includes(q) ||
          s.title.toLowerCase().includes(q) ||
          s.company.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [submissions, selectedCompany, search]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-4"
          >
            ← Back to Board
          </Link>
          <h1 className="text-2xl sm:text-4xl font-bold text-white">Browse Graduates</h1>
          <p className="text-gray-400 mt-2 text-sm sm:text-base">
            Filter by company and view Portfolio/CV + LinkedIn for each graduate.
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-2xl p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1">
              <label className="block text-gray-300 font-semibold mb-2">
                Company
              </label>
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="all">All companies</option>
                {companyOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-gray-300 font-semibold mb-2">
                Search
              </label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, title, or company"
                className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <div className="sm:pb-1">
              <button
                onClick={() => {
                  setSelectedCompany("all");
                  setSearch("");
                }}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg font-semibold transition-all"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="mt-4 text-gray-400 text-sm">
            Showing {filtered.length} graduate{filtered.length === 1 ? "" : "s"}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-gray-800 rounded-lg shadow-2xl p-8 text-center">
            <p className="text-gray-400">No graduates match your filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((grad) => {
              const logoUrl = companies[grad.company]?.logoUrl;
              return (
                <div
                  key={grad.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-700 p-3 sm:p-4 rounded-lg hover:bg-gray-600 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-gray-600 flex items-center justify-center overflow-hidden shrink-0">
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt={`${grad.company} logo`}
                          className="w-7 h-7 object-contain"
                        />
                      ) : (
                        <div className="text-xs font-bold text-white">
                          {grad.company.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="text-white font-semibold truncate">
                        {grad.name}
                      </div>
                      <div className="text-gray-400 text-sm truncate">{grad.title}</div>
                      <div className="text-gray-500 text-xs truncate">{grad.company}</div>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap justify-end">
                    {grad.portfolioCv ? (
                      <a
                        href={grad.portfolioCv}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2"
                      >
                        <span>Portfolio/CV</span>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <path d="M14 2v6h6" />
                          <path d="M8 13h8" />
                          <path d="M8 17h6" />
                        </svg>
                      </a>
                    ) : null}

                    {grad.linkedin ? (
                      <a
                        href={grad.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                        LinkedIn
                      </a>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

