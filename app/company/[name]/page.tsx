"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Graduate } from "@/types";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function CompanyPage() {
  const params = useParams();
  const companyName = decodeURIComponent(params.name as string);
  const [graduates, setGraduates] = useState<Graduate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGraduates = async () => {
      try {
        // Fetch all graduates for this company
        const q = query(
          collection(db, "submissions"),
          where("company", "==", companyName)
        );
        const querySnapshot = await getDocs(q);

        const grads: Graduate[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          grads.push({
            name: data.name,
            title: data.title,
            linkedin: data.linkedin,
            timestamp: data.timestamp,
          });
        });

        // Sort by name
        grads.sort((a, b) => a.name.localeCompare(b.name));
        setGraduates(grads);
      } catch (error) {
        console.error("Error fetching graduates:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGraduates();
  }, [companyName]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading employees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-4"
          >
            ← Back to Board
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg bg-gray-600"></div>
            <div>
              <h1 className="text-4xl font-bold text-white">{companyName}</h1>
              <p className="text-gray-400 mt-1">
                {graduates.length}{" "}
                {graduates.length === 1 ? "Employee" : "Employees"}
              </p>
            </div>
          </div>
        </div>

        {/* Employees List */}
        <div className="bg-gray-800 rounded-lg shadow-2xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Employees</h2>

          {graduates.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              No employees registered yet
            </p>
          ) : (
            <div className="space-y-4">
              {graduates.map((grad, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-700 p-4 rounded-lg hover:bg-gray-600 transition-all"
                >
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">
                      {grad.name}
                    </h3>
                    <p className="text-gray-400 text-sm">{grad.title}</p>
                  </div>
                  <a
                    href={grad.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-all flex items-center gap-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    LinkedIn
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
