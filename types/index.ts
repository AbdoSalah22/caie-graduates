export interface Node {
  id: string; // company name
  count: number;
  radius: number; // computed size
  color?: string; // custom color from admin
  logoUrl?: string; // path to logo image in public/logos/
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface Submission {
  name: string;
  title: string;
  linkedin: string;
  company: string;
  timestamp: any;
}

export interface Company {
  count: number;
  color?: string;
  logoUrl?: string; // path to logo image in public/logos/
}

export interface Graduate {
  name: string;
  title: string;
  linkedin: string;
  timestamp: any;
}
