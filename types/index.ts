import { Timestamp } from "firebase/firestore";

export interface Node {
  id: string; // company name
  count: number;
  radius: number; // computed bubble radius (half the rendered diameter)
  logoUrl?: string;
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
  portfolioCv?: string;
  graduationClass?: string;
  userId?: string;
  timestamp: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface Company {
  count: number;
  logoUrl?: string;
}

export interface Graduate {
  name: string;
  title: string;
  linkedin: string;
  portfolioCv?: string;
  graduationClass?: string;
  timestamp: Timestamp | null;
}

export interface CompanyItem {
  name: string;
  count: number;
  logoUrl?: string;
}

export interface GraduateItem {
  id?: string;
  name: string;
  title: string;
  linkedin: string;
  company: string;
  portfolioCv?: string;
  graduationClass?: string;
}
