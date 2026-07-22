"use client";

import { useState } from "react";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

interface CompanyItem {
  name: string;
  count: number;
  logoUrl?: string;
}

interface GraduateItem {
  id: string;
  name: string;
  title: string;
  linkedin: string;
  company: string;
  portfolioCv?: string;
  graduationClass?: string;
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyLogo, setNewCompanyLogo] = useState("");
  const [graduates, setGraduates] = useState<GraduateItem[]>([]);
  const [graduateForm, setGraduateForm] = useState({
    name: "",
    title: "",
    linkedin: "",
    company: "",
    portfolioCv: "",
    graduationClass: "",
  });
  const [editingGraduateId, setEditingGraduateId] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const ADMIN_PASSWORD = "admin123"; // Change this to your secure password
  const graduationYears = Array.from({ length: 2027 - 2014 + 1 }, (_, index) =>
    String(2014 + index),
  );

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      loadCompanies();
      loadGraduates();
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

  const loadGraduates = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "submissions"));
      const graduatesList: GraduateItem[] = [];
      querySnapshot.forEach((snapshot) => {
        const data = snapshot.data();
        graduatesList.push({
          id: snapshot.id,
          name: data.name || "",
          title: data.title || "",
          linkedin: data.linkedin || "",
          company: data.company || "",
          portfolioCv: data.portfolioCv || "",
          graduationClass: data.graduationClass || "",
        });
      });
      graduatesList.sort((a, b) => a.name.localeCompare(b.name));
      setGraduates(graduatesList);
    } catch (error) {
      console.error("Error loading graduates:", error);
      setMessage("Error loading graduates");
    }
  };

  const updateCompanyCount = async (companyName: string, delta: number) => {
    if (!companyName.trim()) return;

    const companyRef = doc(db, "companies", companyName.trim());
    const companyDoc = await getDoc(companyRef);

    if (companyDoc.exists()) {
      await updateDoc(companyRef, {
        count: increment(delta),
      });
    } else if (delta > 0) {
      await setDoc(companyRef, {
        count: 1,
        logoUrl: null,
      });
    }
  };

  const resetGraduateForm = () => {
    setGraduateForm({
      name: "",
      title: "",
      linkedin: "",
      company: "",
      portfolioCv: "",
      graduationClass: "",
    });
    setEditingGraduateId(null);
  };

  const handleSaveGraduate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!graduateForm.name.trim()) {
      setMessage("Graduate name is required");
      return;
    }
    if (!graduateForm.title.trim()) {
      setMessage("Job title is required");
      return;
    }
    if (!graduateForm.linkedin.trim()) {
      setMessage("LinkedIn URL is required");
      return;
    }
    if (!graduateForm.company.trim()) {
      setMessage("Company is required");
      return;
    }

    setLoading(true);
    try {
      const trimmedGraduate = {
        name: graduateForm.name.trim(),
        title: graduateForm.title.trim(),
        linkedin: graduateForm.linkedin.trim(),
        company: graduateForm.company.trim(),
        portfolioCv: graduateForm.portfolioCv.trim() || null,
        graduationClass: graduateForm.graduationClass.trim() || null,
        updatedAt: serverTimestamp(),
      };

      if (editingGraduateId) {
        const currentGraduate = graduates.find(
          (item) => item.id === editingGraduateId,
        );
        const graduateRef = doc(db, "submissions", editingGraduateId);

        if (
          currentGraduate &&
          currentGraduate.company !== graduateForm.company.trim()
        ) {
          await updateCompanyCount(currentGraduate.company, -1);
          await updateCompanyCount(graduateForm.company.trim(), 1);
        }

        await updateDoc(graduateRef, trimmedGraduate);
        setMessage("Graduate updated successfully");
      } else {
        const newGraduateRef = doc(collection(db, "submissions"));
        await setDoc(newGraduateRef, {
          ...trimmedGraduate,
          timestamp: serverTimestamp(),
        });
        await updateCompanyCount(graduateForm.company.trim(), 1);
        setMessage("Graduate added successfully");
      }

      resetGraduateForm();
      await loadGraduates();
      await loadCompanies();
    } catch (error) {
      console.error("Error saving graduate:", error);
      setMessage("Error saving graduate");
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleEditGraduate = (graduate: GraduateItem) => {
    setEditingGraduateId(graduate.id);
    setGraduateForm({
      name: graduate.name,
      title: graduate.title,
      linkedin: graduate.linkedin,
      company: graduate.company,
      portfolioCv: graduate.portfolioCv || "",
      graduationClass: graduate.graduationClass || "",
    });
  };

  const handleDeleteGraduate = async (graduateId: string) => {
    const graduate = graduates.find((item) => item.id === graduateId);
    if (!graduate) return;

    const confirmed = window.confirm(
      `Delete ${graduate.name} from ${graduate.company}?`,
    );
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, "submissions", graduateId));
      await updateCompanyCount(graduate.company, -1);
      setMessage("Graduate deleted successfully");
      await loadGraduates();
      await loadCompanies();
    } catch (error) {
      console.error("Error deleting graduate:", error);
      setMessage("Error deleting graduate");
    } finally {
      setTimeout(() => setMessage(""), 3000);
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
        logoUrl: newCompanyLogo.trim() || null,
      });

      setMessage(`Company "${newCompanyName}" added successfully!`);
      setNewCompanyName("");
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

  const handleUpdateLogo = async (companyName: string, newLogoUrl: string) => {
    try {
      const companyRef = doc(db, "companies", companyName);
      await setDoc(
        companyRef,
        { logoUrl: newLogoUrl.trim() || null },
        { merge: true },
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

        {/* Graduate Management */}
        <div className="bg-gray-800 rounded-lg shadow-2xl p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">
              {editingGraduateId ? "Edit Graduate" : "Add Graduate"}
            </h2>
            {editingGraduateId ? (
              <button
                type="button"
                onClick={resetGraduateForm}
                className="text-sm text-gray-400 hover:text-white"
              >
                Cancel
              </button>
            ) : null}
          </div>

          <form onSubmit={handleSaveGraduate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 mb-2">Full Name</label>
                <input
                  type="text"
                  value={graduateForm.name}
                  onChange={(e) =>
                    setGraduateForm((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-2">Job Title</label>
                <input
                  type="text"
                  value={graduateForm.title}
                  onChange={(e) =>
                    setGraduateForm((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-2">LinkedIn URL</label>
                <input
                  type="text"
                  value={graduateForm.linkedin}
                  onChange={(e) =>
                    setGraduateForm((prev) => ({
                      ...prev,
                      linkedin: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-2">Company</label>
                <select
                  value={graduateForm.company}
                  onChange={(e) =>
                    setGraduateForm((prev) => ({
                      ...prev,
                      company: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  disabled={loading}
                >
                  <option value="">Select company</option>
                  {companies.map((company) => (
                    <option key={company.name} value={company.name}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-300 mb-2">
                  Graduation Class
                </label>
                <select
                  value={graduateForm.graduationClass}
                  onChange={(e) =>
                    setGraduateForm((prev) => ({
                      ...prev,
                      graduationClass: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  disabled={loading}
                >
                  <option value="">Select year</option>
                  {graduationYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-300 mb-2">
                  Portfolio / CV URL (optional)
                </label>
                <input
                  type="text"
                  value={graduateForm.portfolioCv}
                  onChange={(e) =>
                    setGraduateForm((prev) => ({
                      ...prev,
                      portfolioCv: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50"
            >
              {loading
                ? "Saving..."
                : editingGraduateId
                  ? "Save Changes"
                  : "Add Graduate"}
            </button>
          </form>
        </div>

        {/* Graduates List */}
        <div className="bg-gray-800 rounded-lg shadow-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">
            Existing Graduates ({graduates.length})
          </h2>
          <div className="space-y-3">
            {graduates.map((graduate) => (
              <div
                key={graduate.id}
                className="bg-gray-700 p-4 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div>
                  <h3 className="text-white font-semibold text-lg">
                    {graduate.name}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {graduate.title} • {graduate.company}
                    {graduate.graduationClass
                      ? ` • Class ${graduate.graduationClass}`
                      : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleEditGraduate(graduate)}
                    className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition-all"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteGraduate(graduate.id)}
                    className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg transition-all"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
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
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gray-600">
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
