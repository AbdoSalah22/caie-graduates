"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { isValidLinkedInUrl } from "@/lib/utils";
import { GraduateItem, CompanyItem } from "@/types";
import AdminGate from "@/components/AdminGate";
import { useAdminAuth } from "@/hooks/useAdminAuth";

/* ─────────────────────────────────────────────
   Graduate Form + List
   ───────────────────────────────────────────── */

function GraduateSection({
  graduates,
  companies,
  loading,
  onSave,
  onDelete,
}: {
  graduates: GraduateItem[];
  companies: CompanyItem[];
  loading: boolean;
  onSave: (data: GraduateItem) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    title: "",
    linkedin: "",
    company: "",
    portfolioCv: "",
    graduationClass: "",
  });

  const graduationYears = Array.from({ length: 2027 - 2014 + 1 }, (_, i) =>
    String(2014 + i),
  );

  const resetForm = () => {
    setForm({
      name: "",
      title: "",
      linkedin: "",
      company: "",
      portfolioCv: "",
      graduationClass: "",
    });
    setEditingId(null);
  };

  const handleEdit = (grad: GraduateItem) => {
    if (!grad.id) return;
    setEditingId(grad.id);
    setForm({
      name: grad.name,
      title: grad.title,
      linkedin: grad.linkedin,
      company: grad.company,
      portfolioCv: grad.portfolioCv || "",
      graduationClass: grad.graduationClass || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(editingId ? { id: editingId, ...form } : form);
    resetForm();
  };

  return (
    <>
      {/* Graduate Form */}
      <div className="surface-card p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">
            {editingId ? "Edit Graduate" : "Add Graduate"}
          </h2>
          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="ghost-link text-sm"
            >
              Cancel
            </button>
          ) : null}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="section-label">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                className="field-input"
                disabled={loading}
              />
            </div>
            <div>
              <label className="section-label">Job Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, title: e.target.value }))
                }
                className="field-input"
                disabled={loading}
              />
            </div>
            <div>
              <label className="section-label">LinkedIn URL</label>
              <input
                type="text"
                value={form.linkedin}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, linkedin: e.target.value }))
                }
                className="field-input"
                disabled={loading}
              />
            </div>
            <div>
              <label className="section-label">Company</label>
              <select
                value={form.company}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, company: e.target.value }))
                }
                className="field-select"
                disabled={loading}
              >
                <option value="">Hide from board</option>
                {companies.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-sm text-slate-400">
                Leave blank to hide this graduate from the board.
              </p>
            </div>
            <div>
              <label className="section-label">Graduation Class</label>
              <select
                value={form.graduationClass}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    graduationClass: e.target.value,
                  }))
                }
                className="field-select"
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
              <label className="section-label">
                Portfolio / CV URL (optional)
              </label>
              <input
                type="text"
                value={form.portfolioCv}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    portfolioCv: e.target.value,
                  }))
                }
                className="field-input"
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="primary-btn px-6 py-3 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Saving..."
              : editingId
                ? "Save Changes"
                : "Add Graduate"}
          </button>
        </form>
      </div>

      {/* Graduates List */}
      <div className="surface-card p-6 mb-8">
        <h2 className="text-2xl font-semibold text-white mb-4">
          Existing Graduates ({graduates.length})
        </h2>
        <div className="space-y-3">
          {graduates.map((graduate) => (
            <div
              key={graduate.id}
              className="flex flex-col gap-3 rounded-2xl border border-slate-800/80 bg-slate-800/70 p-4 md:flex-row md:items-center md:justify-between"
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
                  onClick={() => handleEdit(graduate)}
                  className="secondary-btn px-4 py-2"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(graduate.id!)}
                  className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white transition-all hover:bg-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   Page
   ───────────────────────────────────────────── */

export default function ManageGraduatesPage() {
  const { user, signOutUser } = useAdminAuth();
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [graduates, setGraduates] = useState<GraduateItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const showMsg = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  // ── Data loading ──
  const loadCompanies = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "companies"));
      const companiesList: CompanyItem[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        companiesList.push({
          name: docSnap.id,
          count: data.count || 0,
          logoUrl: data.logoUrl,
        });
      });
      companiesList.sort((a, b) => a.name.localeCompare(b.name));
      setCompanies(companiesList);
    } catch (error) {
      console.error("Error loading companies:", error);
      showMsg("Error loading companies");
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
      showMsg("Error loading graduates");
    }
  };

  useEffect(() => {
    if (user) {
      loadGraduates();
      loadCompanies();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ── Action handlers ──
  const updateCompanyCount = async (companyName: string, delta: number) => {
    if (!companyName.trim()) return;
    const companyRef = doc(db, "companies", companyName.trim());
    const companyDoc = await getDoc(companyRef);

    if (companyDoc.exists()) {
      await updateDoc(companyRef, { count: increment(delta) });
    } else if (delta > 0) {
      await setDoc(companyRef, { count: 1, logoUrl: null });
    }
  };

  const handleSaveGraduate = async (data: GraduateItem) => {
    if (!data.name.trim()) {
      showMsg("Graduate name is required");
      return;
    }
    if (!data.title.trim()) {
      showMsg("Job title is required");
      return;
    }
    if (!data.linkedin.trim()) {
      showMsg("LinkedIn URL is required");
      return;
    }
    if (!isValidLinkedInUrl(data.linkedin)) {
      showMsg("Please enter a valid LinkedIn URL");
      return;
    }

    setLoading(true);
    try {
      const trimmedGraduate = {
        name: data.name.trim(),
        title: data.title.trim(),
        linkedin: data.linkedin.trim(),
        company: data.company.trim(),
        portfolioCv: data.portfolioCv?.trim() || null,
        graduationClass: data.graduationClass?.trim() || null,
        updatedAt: serverTimestamp(),
      };

      if (data.id) {
        // Editing existing
        const currentGraduate = graduates.find((g) => g.id === data.id);
        const graduateRef = doc(db, "submissions", data.id);

        if (
          currentGraduate &&
          currentGraduate.company !== data.company.trim()
        ) {
          if (currentGraduate.company.trim()) {
            await updateCompanyCount(currentGraduate.company, -1);
          }
          if (data.company.trim()) {
            await updateCompanyCount(data.company.trim(), 1);
          }
        }

        await updateDoc(graduateRef, trimmedGraduate);
        showMsg("Graduate updated successfully");
      } else {
        // Adding new
        const newGraduateRef = doc(collection(db, "submissions"));
        await setDoc(newGraduateRef, {
          ...trimmedGraduate,
          timestamp: serverTimestamp(),
        });
        if (data.company.trim()) {
          await updateCompanyCount(data.company.trim(), 1);
        }
        showMsg("Graduate added successfully");
      }

      await loadGraduates();
      await loadCompanies();
    } catch (error) {
      console.error("Error saving graduate:", error);
      showMsg("Error saving graduate");
    } finally {
      setLoading(false);
    }
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
      if (graduate.company.trim()) {
        await updateCompanyCount(graduate.company, -1);
      }
      showMsg("Graduate deleted successfully");
      await loadGraduates();
      await loadCompanies();
    } catch (error) {
      console.error("Error deleting graduate:", error);
      showMsg("Error deleting graduate");
    }
  };

  return (
    <AdminGate>
      <div className="page-shell px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <div className="page-container max-w-6xl">
          <div className="page-header mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link href="/admin" className="ghost-link mb-2">
                ← Back to Admin
              </Link>
              <h1 className="page-title">Manage Graduates</h1>
              <p className="page-subtitle">
                Add, edit, or remove graduates from the board.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={signOutUser}
                className="secondary-btn px-4 py-2.5"
              >
                Sign out
              </button>
              <Link href="/" className="secondary-btn px-6 py-2.5">
                ← Back to Board
              </Link>
            </div>
          </div>

          {message && (
            <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
              {message}
            </div>
          )}

          <GraduateSection
            graduates={graduates}
            companies={companies}
            loading={loading}
            onSave={handleSaveGraduate}
            onDelete={handleDeleteGraduate}
          />
        </div>
      </div>
    </AdminGate>
  );
}
