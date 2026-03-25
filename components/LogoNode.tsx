import { Node } from "@/types";
import Link from "next/link";

interface LogoNodeProps {
  node: Node;
  nodeSize?: number;
}

/**
 * LogoNode component - renders a single company name with smooth animations
 *
 * The node is absolutely positioned based on force simulation coordinates
 * CSS transitions provide smooth movement when positions update
 * Transform: translate(-50%, -50%) centers the node on its coordinates
 */
export default function LogoNode({ node, nodeSize }: LogoNodeProps) {
  const { x = 0, y = 0, id, logoUrl } = node;

  // Responsive square size — smaller on mobile
  const size = nodeSize ?? 120;
  const borderRadius = Math.round(size * 0.1);

  // Calculate font size based on text length to fit nicely in square
  const textLength = id.length;
  const fontSize = Math.max(10, Math.min(14, 120 / textLength));

  // White glow for hover effect
  const whiteGlow = "64, 64, 64";
  const hoverScale = 1.06;

  return (
    <Link
      href={`/company/${encodeURIComponent(id)}`}
      className="absolute transition-transform duration-300 ease-out flex items-center justify-center shadow-lg hover:z-50 hover:brightness-110 cursor-pointer"
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 20px 60px rgba(${whiteGlow}, 0.6)`;
        e.currentTarget.style.transform = `translate(-50%, -50%) scale(${hoverScale})`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "";
        e.currentTarget.style.transform = "translate(-50%, -50%)";
      }}
      style={{
        left: x,
        top: y,
        transform: "translate(-50%, -50%)",
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: `${borderRadius}px`,
        background: logoUrl ? "#ffffff" : "#374151", // Gray background if no logo
      }}
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={`${id} logo`}
          className="max-w-[85%] max-h-[85%] object-contain"
        />
      ) : (
        <div className="text-center px-4">
          <div
            className="font-bold text-white whitespace-nowrap"
            style={{ fontSize: `${fontSize}px` }}
          >
            {id}
          </div>
        </div>
      )}
    </Link>
  );
}
