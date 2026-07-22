export interface Node {
  id: string; // company name
  count: number;
  radius: number; // computed size
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
  graduationClass?: string;
  timestamp: any;
}

export interface Company {
  count: number;
  logoUrl?: string; // path to logo image in public/logos/
}

export interface Graduate {
  name: string;
  title: string;
  linkedin: string;
  portfolioCv?: string;
  graduationClass?: string;
  timestamp: any;
}
