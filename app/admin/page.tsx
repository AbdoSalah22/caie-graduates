"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

interface CompanyItem {
  name: string;
  color: string;
  count: number;
  logoUrl?: string;
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyColor, setNewCompanyColor] = useState("#3B82F6");
  const [newCompanyLogo, setNewCompanyLogo] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const ADMIN_PASSWORD = "admin123"; // Change this to your secure password

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      loadCompanies();
    } else {
      setMessage("Incorrect password");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const loadCompanies = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "companies"));
      const companiesList: CompanyItem[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        companiesList.push({
          name: doc.id,
          color: data.color || "#3B82F6",
          count: data.count || 0,
          logoUrl: data.logoUrl,
        });
      });
      companiesList.sort((a, b) => a.name.localeCompare(b.name));
      setCompanies(companiesList);
    } catch (error) {
      console.error("Error loading companies:", error);
      setMessage("Error loading companies");
    }
  };

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim()) {
      setMessage("Company name is required");
      return;
    }

    setLoading(true);
    try {
      const companyRef = doc(db, "companies", newCompanyName.trim());
      await setDoc(companyRef, {
        count: 0,
        color: newCompanyColor,
        logoUrl: newCompanyLogo.trim() || null,
      });

      setMessage(`Company "${newCompanyName}" added successfully!`);
      setNewCompanyName("");
      setNewCompanyColor("#3B82F6");
      setNewCompanyLogo("");
      loadCompanies();
    } catch (error) {
      console.error("Error adding company:", error);
      setMessage("Error adding company");
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };
  const handleUpdateColor = async (companyName: string, newColor: string) => {
    try {
      const companyRef = doc(db, "companies", companyName);
      await setDoc(companyRef, { color: newColor }, { merge: true });
      setMessage(`Color updated for ${companyName}`);
      loadCompanies();
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error updating color:", error);
      setMessage("Error updating color");
    }
  };

  const handleUpdateLogo = async (companyName: string, newLogoUrl: string) => {
    try {
      const companyRef = doc(db, "companies", companyName);
      await setDoc(
        companyRef,
        { logoUrl: newLogoUrl.trim() || null },
        { merge: true }
      );
      setMessage(`Logo updated for ${companyName}`);
      loadCompanies();
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error updating logo:", error);
      setMessage("Error updating logo");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Admin Panel</h1>
            <p className="text-gray-400">Enter password to continue</p>
          </div>

          <form
            onSubmit={handleLogin}
            className="bg-gray-800 rounded-lg shadow-2xl p-8"
          >
            <div className="mb-6">
              <label
                htmlFor="password"
                className="block text-gray-300 font-semibold mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>

            {message && (
              <div className="mb-4 bg-red-600 text-white px-4 py-2 rounded-lg text-sm">
                {message}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all"
            >
              Login
            </button>

            <Link
              href="/"
              className="block text-center mt-4 text-gray-400 hover:text-white transition-colors"
            >
              ← Back to home
            </Link>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Admin Panel</h1>
          <Link
            href="/"
            className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-all"
          >
            ← Back to Board
          </Link>
        </div>

        {/* Add Company Form */}
        <div className="bg-gray-800 rounded-lg shadow-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">
            Add New Company
          </h2>
          <form onSubmit={handleAddCompany} className="space-y-4">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-gray-300 mb-2">Company Name</label>
                <input
                  type="text"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  placeholder="Company Name"
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-2">Color</label>
                <input
                  type="color"
                  value={newCompanyColor}
                  onChange={(e) => setNewCompanyColor(e.target.value)}
                  className="h-12 w-24 bg-gray-700 rounded-lg border border-gray-600 cursor-pointer"
                  disabled={loading}
                />
              </div>
            </div>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-gray-300 mb-2">
                  Logo URL{" "}
                  <span className="text-gray-500 text-sm">
                    (optional - e.g., /logos/company.png)
                  </span>
                </label>
                <input
                  type="text"
                  value={newCompanyLogo}
                  onChange={(e) => setNewCompanyLogo(e.target.value)}
                  placeholder="/logos/company.png or https://..."
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50"
              >
                {loading ? "Adding..." : "Add Company"}
              </button>
            </div>
          </form>

          {message && (
            <div className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg">
              {message}
            </div>
          )}
        </div>

        {/* Companies List */}
        <div className="bg-gray-800 rounded-lg shadow-2xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4">
            Existing Companies ({companies.length})
          </h2>
          <div className="space-y-3">
            {companies.map((company) => (
              <div
                key={company.name}
                className="bg-gray-700 p-4 rounded-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{
                        backgroundColor: company.logoUrl
                          ? "#ffffff"
                          : company.color,
                      }}
                    >
                      {company.logoUrl && (
                        <img
                          src={company.logoUrl}
                          alt={`${company.name} logo`}
                          className="w-10 h-10 object-contain"
                        />
                      )}
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-lg">
                        {company.name}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {company.count}{" "}
                        {company.count === 1 ? "graduate" : "graduates"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={company.color}
                      onChange={(e) =>
                        handleUpdateColor(company.name, e.target.value)
                      }
                      className="h-10 w-20 bg-gray-600 rounded-lg border border-gray-500 cursor-pointer"
                    />
                    <Link
                      href={`/company/${encodeURIComponent(company.name)}`}
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>

                {/* Logo URL input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Logo URL (e.g., /logos/company.png)"
                    defaultValue={company.logoUrl || ""}
                    onBlur={(e) => {
                      if (e.target.value !== (company.logoUrl || "")) {
                        handleUpdateLogo(company.name, e.target.value);
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-lg border border-gray-500 focus:border-blue-500 focus:outline-none text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
