"use client";

import { useState } from "react";

/**
 * Collapsible site credit. Collapsed: a compact, inviting "i" button.
 * Expanded: slides open horizontally to reveal (© Abdelrahman • phone).
 * Clicking the pill toggles it.
 */
export default function SiteFooter() {
  const [open, setOpen] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setOpen((o) => !o)}
      aria-expanded={open}
      aria-label={open ? "Hide creator info" : "Show creator info"}
      className="group flex cursor-pointer items-center rounded-full border border-slate-600/60 bg-slate-950/60 py-1.5 pl-2 text-slate-300 shadow-[0_10px_30px_rgba(2,8,23,0.35)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-400/60 hover:text-white hover:shadow-[0_10px_30px_rgba(6,182,212,0.25)]"
      style={{ paddingRight: open ? "0.75rem" : "0.5rem" }}
    >
      <span
        className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-slate-500/70 bg-slate-800/80 text-[12px] font-bold leading-none text-slate-200 transition-colors duration-300 group-hover:border-cyan-400/70 group-hover:text-cyan-300"
        style={{ fontStyle: "italic" }}
      >
        i
      </span>

      <span
        className="grid transition-all duration-300 ease-out"
        style={{ gridTemplateColumns: open ? "1fr" : "0fr" }}
      >
        <span
          className="overflow-hidden whitespace-nowrap text-xs transition-opacity duration-200"
          style={{ opacity: open ? 1 : 0, paddingLeft: open ? "0.375rem" : "0" }}
        >
          © {new Date().getFullYear()} Abdelrahman Salah
          <span className="mx-2 text-slate-500">•</span>
          <span className="tabular-nums">01121105774</span>
        </span>
      </span>
    </button>
  );
}