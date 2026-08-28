import { useEffect, useState } from "react";
import { Node } from "@/types";
import Link from "next/link";
import { getDominantColor } from "@/lib/logoColor";

interface LogoNodeProps {
  node: Node;
}

/**
 * LogoNode component - renders a single company as a proportionally-sized bubble.
 *
 * The size is driven by `node.radius` (computed from employee count).
 * Absolutely positioned based on force simulation coordinates.
 * CSS transitions provide smooth movement when positions update.
 */
export default function LogoNode({ node }: LogoNodeProps) {
  const { x = 0, y = 0, id, logoUrl, radius } = node;

  // Diameter is 2× radius
  const size = Math.round(radius * 2);
  const borderRadius = Math.round(size * 0.18);

  // Scale font size based on available space for the fallback text
  const textLength = id.length;
  const fontSize = Math.max(9, Math.min(size * 0.14, 120 / textLength));

  // White glow for hover effect
  const whiteGlow = "255, 255, 255";

  // Square takes the logo's dominant color when one clearly exists,
  // otherwise the company's own configured square color (default white).
  const [bg, setBg] = useState<string | null>(null);
  useEffect(() => {
    if (!logoUrl) return;
    let active = true;
    getDominantColor(logoUrl).then((color) => {
      if (active && color) setBg(`rgb(${color})`);
    });
    return () => {
      active = false;
    };
  }, [logoUrl]);

  return (
    <Link
      href={`/company/${encodeURIComponent(id)}`}
      className="absolute transition-all duration-300 ease-out transform-gpu -translate-x-1/2 -translate-y-1/2 flex items-center justify-center shadow-lg hover:scale-110 hover:z-50 hover:brightness-110 active:scale-95 cursor-pointer"
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 20px 60px rgba(${whiteGlow}, 0.6)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "";
      }}
      style={{
        left: x,
        top: y,
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: `${borderRadius}px`,
        background: logoUrl ? (bg ?? node.squareColor ?? "#ffffff") : "#374151",
      }}
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={`${id} logo`}
          className="max-w-[85%] max-h-[85%] object-contain"
          draggable={false}
        />
      ) : (
        <div className="text-center px-2 overflow-hidden">
          <div
            className="font-bold text-white leading-tight"
            style={{ fontSize: `${fontSize}px` }}
          >
            {id}
          </div>
          <div
            className="text-slate-400 mt-0.5"
            style={{ fontSize: `${Math.max(8, fontSize * 0.7)}px` }}
          >
            {node.count}
          </div>
        </div>
      )}
    </Link>
  );
}
