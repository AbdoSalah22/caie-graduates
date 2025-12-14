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
  const [companyColor, setCompanyColor] = useState("#3B82F6");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGraduates = async () => {
      try {
        // Fetch company color
        const companyRef = doc(db, "companies", companyName);
        const companyDoc = await getDoc(companyRef);
        if (companyDoc.exists()) {
          setCompanyColor(companyDoc.data().color || "#3B82F6");
        }

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
            <div
              className="w-16 h-16 rounded-lg"
              style={{ backgroundColor: companyColor }}
            ></div>
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
                      viewBox="0 0 20 20"
                    >
                      <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
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
