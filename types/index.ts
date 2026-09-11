export interface Node {
  id: string; // company name
  count: number;
  radius: number; // computed bubble radius (half the rendered diameter)
  slug?: string; // URL/file-safe segment for the /preview/company/[name] route
  logoUrl?: string;
  squareColor?: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}