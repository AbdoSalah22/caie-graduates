import { Node } from "@/types";
import Link from "next/link";

interface LogoNodeProps {
  node: Node;
}

/**
 * LogoNode component - renders a single company name with smooth animations
 *
 * The node is absolutely positioned based on force simulation coordinates
 * CSS transitions provide smooth movement when positions update
 * Transform: translate(-50%, -50%) centers the node on its coordinates
 */
/**
 * Lighten or darken a hex color
 */
function adjustColor(color: string, amount: number): string {
  const num = parseInt(color.replace("#", ""), 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amount));
  const b = Math.max(0, Math.min(255, (num & 0x0000ff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

/**
 * Generate consistent color from company name using hash (fallback)
 */
function getCompanyColor(
  companyName: string,
  customColor?: string
): { from: string; to: string } {
  if (customColor) {
    // Use custom color from admin with a lighter shade for gradient
    return {
      from: customColor,
      to: adjustColor(customColor, -30),
    };
  }

  // Fallback: Hash the company name to get a consistent color
  let hash = 0;
  for (let i = 0; i < companyName.length; i++) {
    hash = companyName.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue = Math.abs(hash % 360);
  const hue2 = (hue + 30) % 360;

  const from = `hsl(${hue}, 75%, 55%)`;
  const to = `hsl(${hue2}, 75%, 45%)`;

  return { from, to };
}
export default function LogoNode({ node }: LogoNodeProps) {
  const { x = 0, y = 0, id, color, logoUrl } = node;

  // Get colors for this company (custom from admin or generated from hash)
  const colors = getCompanyColor(id, color);

  // Fixed square size for all nodes
  const size = 120;
  const borderRadius = 12;

  // Calculate font size based on text length to fit nicely in square
  const textLength = id.length;
  const fontSize = Math.max(10, Math.min(14, 120 / textLength));

  // Convert color to rgba for glow effect
  const glowColor = color || colors.from;
  const rgbaGlow = glowColor.startsWith("#")
    ? `${parseInt(glowColor.slice(1, 3), 16)}, ${parseInt(
        glowColor.slice(3, 5),
        16
      )}, ${parseInt(glowColor.slice(5, 7), 16)}`
    : "59, 130, 246"; // fallback blue

  return (
    <Link
      href={`/company/${encodeURIComponent(id)}`}
      className="absolute transition-all duration-300 ease-out flex items-center justify-center shadow-lg hover:scale-110 hover:z-50 hover:brightness-110 cursor-pointer"
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 20px 60px rgba(${rgbaGlow}, 0.6)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "";
      }}
      style={{
        left: x,
        top: y,
        transform: "translate(-50%, -50%)",
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: `${borderRadius}px`,
        background: logoUrl
          ? "#ffffff"
          : `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
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
