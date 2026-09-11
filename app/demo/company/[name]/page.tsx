"use client";

import { useMemo } from "react";
import { useDemoData } from "@/lib/demoData";
import Link from "next/link";
import { useParams } from "next/navigation";
import SiteFooter from "@/components/SiteFooter";

export default function DemoCompanyPage() {
  const params = useParams();
  const companyName = params?.name
    ? decodeURIComponent(params.name as string)
    : "";

  const { companiesMap, submissions, loading, error } = useDemoData();

  const companyDoc = companiesMap[companyName];

  const graduates = useMemo(() => {
    if (!companyName) return [];
    return submissions
      .filter((s) => s.company === companyName)
      .map((s) => ({
        name: s.name,
        title: s.title,
        linkedin: s.linkedin,
        portfolioCv: s.portfolioCv,
        graduationClass: s.graduationClass,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [submissions, companyName]);

  const pageError = !companyName ? "Invalid company selected" : error;

  if (loading) {
    return (
      <div className="page-shell flex min-h-screen items-center justify-center">
        <div className="surface-card-soft px-8 py-10 text-center">
          <div className="mx-auto mb-4 h-14 w-14 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-400"></div>
          <p className="text-slate-300">Loading demo data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="page-container">
        <div className="page-header mb-8 animate-rise">
          <Link href="/demo" className="ghost-link mb-4">
            ← Back to Demo Board
          </Link>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-200">
            Static demo
          </div>
          <div className="flex items-center gap-4">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-lg border border-slate-700/70 p-2 shadow-sm"
              style={{
                backgroundColor: companyDoc?.squareColor || "#ffffff",
              }}
            >
              {companyDoc?.logoUrl && (
                <img
                  src={companyDoc.logoUrl}
                  alt={`${companyName} logo`}
                  className="max-h-full max-w-full object-contain"
                />
              )}
            </div>
            <div className="min-w-0">
              <h1 className="page-title break-words">{companyName}</h1>
              <p className="page-subtitle">
                {graduates.length}{" "}
                {graduates.length === 1 ? "Employee" : "Employees"}
              </p>
            </div>
          </div>
        </div>

        {pageError && !loading ? (
          <div className="surface-card p-8 text-center">
            <p className="mb-4 text-lg font-semibold text-white">{pageError}</p>
            <Link href="/demo" className="primary-btn px-4 py-2">
              Back to Demo Board
            </Link>
          </div>
        ) : (
          <div
            className="surface-card p-4 sm:p-6 animate-rise"
            style={{ animationDelay: "80ms" }}
          >
            <div className="mb-4 flex items-center justify-between sm:mb-6">
              <h2 className="text-xl font-semibold text-white sm:text-2xl">
                Employees
              </h2>
              <div className="info-badge">{graduates.length} total</div>
            </div>

            {graduates.length === 0 ? (
              <p className="py-8 text-center text-slate-400">
                No employees registered yet
              </p>
            ) : (
              <div className="space-y-4">
                {graduates.map((grad, index) => (
                  <div
                    key={index}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-800/80 bg-slate-800/70 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-600 hover:bg-slate-700/80 animate-rise sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4"
                    style={{ animationDelay: `${Math.min(index * 30, 240)}ms` }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="premium-name truncate">{grad.name}</h3>
                        {grad.graduationClass ? (
                          <span className="info-badge">
                            {grad.graduationClass}
                          </span>
                        ) : null}
                      </div>
                      <div className="premium-muted truncate">{grad.title}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {grad.portfolioCv ? (
                        <a
                          href={grad.portfolioCv}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="primary-btn shrink-0 gap-2 px-4 py-1.5 sm:px-6 sm:py-2"
                        >
                          <span>Portfolio/CV</span>
                        </a>
                      ) : null}
                      <a
                        href={grad.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="primary-btn shrink-0 gap-2 px-4 py-1.5 sm:px-6 sm:py-2"
                      >
                        <svg
                          className="w-4 h-4 sm:w-5 sm:h-5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                        LinkedIn
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <footer className="pb-6 text-center">
        <SiteFooter />
      </footer>
    </div>
  );
}