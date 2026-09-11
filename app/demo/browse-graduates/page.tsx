"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useDemoData } from "@/lib/demoData";
import SiteFooter from "@/components/SiteFooter";

type Filters = {
  name: string;
  company: string;
  graduationClass: string;
  title: string;
};

const EMPTY_FILTERS: Filters = {
  name: "",
  company: "",
  graduationClass: "",
  title: "",
};

/** Sentinel value for filtering graduates with no company assigned */
const UNASSIGNED_COMPANY = "__unassigned__";

export default function DemoBrowseGraduatesPage() {
  const { submissions, companiesMap, loading, error } = useDemoData();

  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS);
  const [hasSearched, setHasSearched] = useState(false);

  const rows = useMemo(() => submissions, [submissions]);

  const updateDraft = (key: keyof Filters, value: string) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    setApplied(draft);
    setHasSearched(true);
  };

  const handleClear = () => {
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
    setHasSearched(false);
  };

  const companyOptions = useMemo(() => {
    const names = new Set<string>();
    Object.keys(companiesMap).forEach((name) => {
      if ((companiesMap[name]?.count ?? 0) > 0) names.add(name);
    });
    rows.forEach((s) => {
      if (s.company) names.add(s.company);
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [companiesMap, rows]);

  const classOptions = useMemo(() => {
    const years = new Set<string>();
    rows.forEach((s) => {
      if (s.graduationClass) years.add(s.graduationClass);
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [rows]);

  const filtered = useMemo(() => {
    const nameQ = applied.name.trim().toLowerCase();
    const titleQ = applied.title.trim().toLowerCase();

    return rows
      .filter((s) => {
        if (!applied.company) return true;
        if (applied.company === UNASSIGNED_COMPANY) return !s.company;
        return s.company === applied.company;
      })
      .filter((s) =>
        applied.graduationClass ? s.graduationClass === applied.graduationClass : true,
      )
      .filter((s) => (nameQ ? s.name.toLowerCase().includes(nameQ) : true))
      .filter((s) => (titleQ ? s.title.toLowerCase().includes(titleQ) : true))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [rows, applied]);

  const resultsKey = JSON.stringify(applied);

  const hasActiveFilters =
    !!applied.name || !!applied.company || !!applied.graduationClass || !!applied.title;

  return (
    <div className="page-shell px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="page-container max-w-5xl">
        <div className="page-header mb-6">
          <Link href="/demo" className="ghost-link mb-4">
            ← Back to Demo Board
          </Link>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-200">
            Static demo
          </div>
          <h1 className="page-title">Browse Graduates</h1>
          <p className="page-subtitle">
            Use the filters to find graduates by name, company, class, or
            title. Filtering on this static snapshot.
          </p>
        </div>

        {loading ? (
          <div className="surface-card p-10 text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-400"></div>
            <p className="text-slate-400">Loading demo data...</p>
          </div>
        ) : error ? (
          <div className="surface-card p-8 text-center">
            <p className="text-red-300 mb-4">
              Demo data unavailable — run{" "}
              <code className="text-cyan-300">npm run export-demo</code>.
            </p>
            <Link href="/demo" className="primary-btn px-4 py-2">
              Back to Demo Board
            </Link>
          </div>
        ) : (
          <>
            {/* ── Advanced filter panel ─────────────────────────── */}
            <form onSubmit={handleSearch} className="surface-card p-4 sm:p-6 mb-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="filter-name" className="section-label">
                    Name
                  </label>
                  <input
                    id="filter-name"
                    value={draft.name}
                    onChange={(e) => updateDraft("name", e.target.value)}
                    placeholder="e.g. Ahmed Hassan"
                    className="field-input"
                  />
                </div>

                <div>
                  <label htmlFor="filter-company" className="section-label">
                    Company
                  </label>
                  <select
                    id="filter-company"
                    value={draft.company}
                    onChange={(e) => updateDraft("company", e.target.value)}
                    className="field-select"
                  >
                    <option value="">All companies</option>
                    <option value={UNASSIGNED_COMPANY}>Unassigned</option>
                    {companyOptions.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="filter-title" className="section-label">
                    Job Title
                  </label>
                  <input
                    id="filter-title"
                    value={draft.title}
                    onChange={(e) => updateDraft("title", e.target.value)}
                    placeholder="e.g. Software Engineer"
                    className="field-input"
                  />
                </div>

                <div>
                  <label htmlFor="filter-class" className="section-label">
                    Graduation Class
                  </label>
                  <select
                    id="filter-class"
                    value={draft.graduationClass}
                    onChange={(e) => updateDraft("graduationClass", e.target.value)}
                    className="field-select"
                  >
                    <option value="">All classes</option>
                    {classOptions.map((year) => (
                      <option key={year} value={year}>
                        Class of {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <button
                  type="submit"
                  className="primary-btn gap-2 px-6 py-3"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                  Search
                </button>

                <button
                  type="button"
                  onClick={handleClear}
                  className="secondary-btn px-4 py-3"
                >
                  Clear
                </button>

                {hasSearched && hasActiveFilters ? (
                  <span className="ml-auto text-sm text-slate-400">
                    {filtered.length} graduate{filtered.length === 1 ? "" : "s"}{" "}
                    found
                  </span>
                ) : null}
              </div>
            </form>

            {/* ── Results ───────────────────────────────────────── */}
            {!hasSearched ? (
              <div className="surface-card p-10 text-center">
                <svg
                  className="mx-auto mb-4 h-10 w-10 text-slate-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <p className="text-slate-300 font-medium">
                  Set your filters above and press Search
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Results will appear here once you search.
                </p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="surface-card p-8 text-center">
                <p className="text-slate-400">
                  No graduates match your filters. Try loosening your search.
                </p>
                <button onClick={handleClear} className="secondary-btn mt-4 px-4 py-2">
                  Clear filters
                </button>
              </div>
            ) : (
              <div key={resultsKey} className="space-y-4">
                {filtered.map((grad, index) => {
                  const logoUrl = companiesMap[grad.company]?.logoUrl;
                  return (
                    <div
                      key={grad.id}
                      className="flex flex-col gap-3 rounded-2xl border border-slate-800/80 bg-slate-800/70 p-3 transition-all duration-200 animate-rise hover:-translate-y-0.5 hover:border-slate-600 hover:bg-slate-700/80 sm:flex-row sm:items-center sm:justify-between sm:p-4"
                      style={{ animationDelay: `${Math.min(index * 30, 240)}ms` }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-600/70 bg-white p-1.5 shadow-sm">
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
          </>
        )}
      </div>

      <footer className="pb-6 text-center">
        <SiteFooter />
      </footer>
    </div>
  );
}