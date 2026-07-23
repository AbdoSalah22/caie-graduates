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
  graduationClass?: string;
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
          graduationClass: data.graduationClass || undefined,
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
      .filter((s) =>
        selectedCompany === "all" ? true : s.company === selectedCompany,
      )
      .filter((s) => {
        if (!q) return true;
        return (
          s.name.toLowerCase().includes(q) ||
          s.title.toLowerCase().includes(q) ||
          s.company.toLowerCase().includes(q) ||
          (s.graduationClass || "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [submissions, selectedCompany, search]);

  return (
    <div className="page-shell px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="page-container max-w-5xl">
        <div className="page-header mb-6">
          <Link href="/" className="ghost-link mb-4">
            ← Back to Board
          </Link>
          <h1 className="page-title">Browse Graduates</h1>
          <p className="page-subtitle">
            Filter by company and view Portfolio/CV + LinkedIn for each
            graduate.
          </p>
        </div>

        <div className="surface-card p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1">
              <label className="section-label">Company</label>
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="field-select"
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
              <label className="section-label">Search</label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, title, or company"
                className="field-input"
              />
            </div>

            <div className="sm:pb-1">
              <button
                onClick={() => {
                  setSelectedCompany("all");
                  setSearch("");
                }}
                className="secondary-btn px-4 py-3"
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
          <div className="surface-card p-8 text-center">
            <p className="text-slate-400">No graduates match your filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((grad) => {
              const logoUrl = companies[grad.company]?.logoUrl;
              return (
                <div
                  key={grad.id}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-800/80 bg-slate-800/70 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-600 hover:bg-slate-700/80 sm:flex-row sm:items-center sm:justify-between sm:p-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-600/70 bg-white p-1.75 shadow-sm">
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt={`${grad.company} logo`}
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <div className="text-xs font-semibold text-slate-700">
                          {grad.company.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="text-white font-semibold truncate">
                          {grad.name}
                        </div>
                        {grad.graduationClass ? (
                          <span className="inline-flex items-center rounded-full border border-cyan-400/40 bg-cyan-500/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-cyan-300 shadow-sm">
                            {grad.graduationClass}
                          </span>
                        ) : null}
                      </div>
                      <div className="premium-muted truncate">{grad.title}</div>
                      <div className="text-xs truncate text-slate-500">
                        {grad.company}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap justify-end">
                    {grad.portfolioCv ? (
                      <a
                        href={grad.portfolioCv}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="primary-btn gap-2 px-4 py-2"
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
                        className="primary-btn gap-2 px-4 py-2"
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
