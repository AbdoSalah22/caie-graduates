"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Node, Company } from "@/types";
import { MIN_RADIUS, SCALING_FACTOR } from "@/lib/constants";
import Artboard from "@/components/Artboard";
import Link from "next/link";

/**
 * Main page - displays the dynamic logo artboard
 *
 * Real-time Firestore listener updates the display whenever:
 * - A new company is added
 * - A company's graduate count changes
 * - Logo URLs are updated
 *
 * Automatically converts company data to nodes with computed radius
 */
export default function Home() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up real-time listener for companies collection
    const q = query(collection(db, "companies"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const companiesData: Node[] = [];

        snapshot.forEach((doc) => {
          const data = doc.data() as Company;
          const companyName = doc.id;

          // Calculate radius based on graduate count
          const radius = MIN_RADIUS + data.count * SCALING_FACTOR;

          companiesData.push({
            id: companyName,
            count: data.count,
            radius,
            color: data.color, // Include custom color from admin
            logoUrl: data.logoUrl, // Include logo URL
          });
        });

        // Sort by count descending (largest companies first)
        companiesData.sort((a, b) => b.count - a.count);

        setNodes(companiesData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching companies:", error);
        setLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading companies...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="relative">
      <Artboard nodes={nodes} />

      {/* Floating action buttons */}
      <Link
        href="/submit"
        className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 py-3 shadow-2xl transition-all duration-300 hover:scale-105 font-semibold z-10"
      >
        + Add Graduate
      </Link>

      {/* Admin button hidden - only accessible via direct URL */}
      {/* <Link
        href="/admin"
        className="fixed bottom-8 left-8 bg-gray-700 hover:bg-gray-600 text-white rounded-full px-6 py-3 shadow-2xl transition-all duration-300 hover:scale-105 font-semibold z-10"
      >
        Admin
      </Link> */}

      {/* Title overlay */}
      <div className="fixed top-8 left-8 z-10">
        <h1 className="text-4xl font-bold text-white mb-2">GradBoard</h1>
        <p className="text-gray-400">
          {nodes.length} {nodes.length === 1 ? "company" : "companies"} •{" "}
          {nodes.reduce((sum, node) => sum + node.count, 0)} graduates
        </p>
      </div>
    </main>
  );
}
