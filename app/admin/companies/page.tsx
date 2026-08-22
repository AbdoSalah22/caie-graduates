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
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CompanyItem } from "@/types";
import AdminGate from "@/components/AdminGate";
import { useAdminAuth } from "@/hooks/useAdminAuth";

/* ─────────────────────────────────────────────
   Company Form + List
   ───────────────────────────────────────────── */

function CompanySection({
  companies,
  loading,
  onAddCompany,
  onUpdateLogo,
  onEditCompany,
  onDeleteCompany,
}: {
  companies: CompanyItem[];
  loading: boolean;
  onAddCompany: (name: string, logoUrl: string) => Promise<void>;
  onUpdateLogo: (name: string, logoUrl: string) => Promise<void>;
  onEditCompany: (oldName: string, newName: string) => Promise<void>;
  onDeleteCompany: (name: string) => Promise<void>;
}) {
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyLogo, setNewCompanyLogo] = useState("");

  // ── Per-row edit state ──
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAddCompany(newCompanyName, newCompanyLogo);
    setNewCompanyName("");
    setNewCompanyLogo("");
  };

  const startEdit = (company: CompanyItem) => {
    setEditingName(company.name);
    setEditValue(company.name);
  };

  const cancelEdit = () => {
    setEditingName(null);
    setEditValue("");
  };

  const trimmedEdit = editValue.trim();
  const editIsDuplicate =
    !!trimmedEdit && companies.some((c) => c.name === trimmedEdit);
  const canSaveEdit =
    !!trimmedEdit &&
    !editIsDuplicate &&
    trimmedEdit !== editingName &&
    !savingEdit;

  const handleSaveEdit = async () => {
    if (!editingName || !canSaveEdit) return;
    setSavingEdit(true);
    try {
      await onEditCompany(editingName, trimmedEdit);
      cancelEdit();
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <>
      {/* Add Company Form */}
      <div className="surface-card p-6 mb-8">
        <h2 className="text-2xl font-semibold text-white mb-4">
          Add New Company
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="section-label">Company Name</label>
              <input
                type="text"
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                placeholder="Company Name"
                className="field-input"
                disabled={loading}
              />
            </div>
          </div>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="section-label">
                Logo URL{" "}
                <span className="text-slate-500 text-sm">
                  (optional - e.g., /logos/company.png)
                </span>
              </label>
              <input
                type="text"
                value={newCompanyLogo}
                onChange={(e) => setNewCompanyLogo(e.target.value)}
                placeholder="/logos/company.png or https://..."
                className="field-input"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="primary-btn px-6 py-3 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add Company"}
            </button>
          </div>
        </form>
      </div>

      {/* Companies List */}
      <div className="surface-card p-6">
        <h2 className="text-2xl font-semibold text-white mb-4">
          Existing Companies ({companies.length})
        </h2>
        <div className="space-y-3">
          {companies.map((company) => (
            <div
              key={company.name}
              className="space-y-3 rounded-2xl border border-slate-800/80 bg-slate-800/70 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gray-600 shrink-0">
                    {company.logoUrl && (
                      <img
                        src={company.logoUrl}
                        alt={`${company.name} logo`}
                        className="w-10 h-10 object-contain"
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-white font-semibold text-lg truncate">
                      {company.name}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {company.count}{" "}
                      {company.count === 1 ? "graduate" : "graduates"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
                  <Link
                    href={`/company/${encodeURIComponent(company.name)}`}
                    className="text-cyan-400 transition-colors hover:text-cyan-300 text-sm whitespace-nowrap"
                  >
                    View Details →
                  </Link>
                  <button
                    type="button"
                    onClick={() =>
                      editingName === company.name
                        ? cancelEdit()
                        : startEdit(company)
                    }
                    disabled={loading}
                    className="secondary-btn px-3 py-1.5 text-sm"
                  >
                    {editingName === company.name ? "Cancel" : "Edit"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteCompany(company.name)}
                    disabled={loading}
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white transition-all hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Rename editor */}
              {editingName === company.name ? (
                <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-3">
                  <label className="section-label">Company Name</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="field-input flex-1"
                      disabled={savingEdit || loading}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      disabled={!canSaveEdit}
                      className="primary-btn px-4 py-2.5 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {savingEdit ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                  {editIsDuplicate ? (
                    <p className="mt-2 text-xs text-red-400">
                      A company with this name already exists.
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500">
                      Renaming also updates all graduates assigned to this
                      company.
                    </p>
                  )}
                </div>
              ) : null}

              {/* Logo URL input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Logo URL (e.g., /logos/company.png)"
                  defaultValue={company.logoUrl || ""}
                  key={company.logoUrl || ""}
                  onBlur={(e) => {
                    if (e.target.value !== (company.logoUrl || "")) {
                      onUpdateLogo(company.name, e.target.value);
                    }
                  }}
                  className="field-input flex-1 text-sm"
                />
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

export default function ManageCompaniesPage() {
  const { user, signOutUser } = useAdminAuth();
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
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

  useEffect(() => {
    if (user) {
      loadCompanies();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ── Action handlers ──
  const handleAddCompany = async (name: string, logoUrl: string) => {
    if (!name.trim()) {
      showMsg("Company name is required");
      return;
    }
    setLoading(true);
    try {
      const companyRef = doc(db, "companies", name.trim());
      await setDoc(companyRef, {
        count: 0,
        logoUrl: logoUrl.trim() || null,
      });
      showMsg(`Company "${name}" added successfully!`);
      loadCompanies();
    } catch (error) {
      console.error("Error adding company:", error);
      showMsg("Error adding company");
    } finally {
      setLoading(false);
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
      showMsg(`Logo updated for ${companyName}`);
      loadCompanies();
    } catch (error) {
      console.error("Error updating logo:", error);
      showMsg("Error updating logo");
    }
  };

  const handleEditCompany = async (oldName: string, newName: string) => {
    setLoading(true);
    try {
      const oldRef = doc(db, "companies", oldName);
      const oldSnap = await getDoc(oldRef);
      if (!oldSnap.exists()) {
        showMsg("Company not found");
        return;
      }

      const data = oldSnap.data();
      const newRef = doc(db, "companies", newName);

      // Create the renamed company first so nothing is lost mid-flight
      await setDoc(newRef, {
        count: data.count || 0,
        logoUrl: data.logoUrl || null,
      });

      // Move all graduates to the new company name
      const gradsQuery = query(
        collection(db, "submissions"),
        where("company", "==", oldName),
      );
      const gradsSnap = await getDocs(gradsQuery);
      await Promise.all(
        gradsSnap.docs.map((gradDoc) =>
          updateDoc(doc(db, "submissions", gradDoc.id), {
            company: newName,
          }),
        ),
      );

      await deleteDoc(oldRef);
      showMsg(`Company renamed to "${newName}"`);
      loadCompanies();
    } catch (error) {
      console.error("Error renaming company:", error);
      showMsg("Error renaming company");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCompany = async (name: string) => {
    const company = companies.find((c) => c.name === name);
    const count = company?.count ?? 0;

    const confirmed = window.confirm(
      count > 0
        ? `Delete company "${name}"? Its ${count} graduate${
            count === 1 ? "" : "s"
          } will be unassigned and hidden from the board. This cannot be undone.`
        : `Delete company "${name}"? This cannot be undone.`,
    );
    if (!confirmed) return;

    try {
      // Unassign all graduates so they fall back to the default
      // ("Hide from board") company option
      if (count > 0) {
        const gradsQuery = query(
          collection(db, "submissions"),
          where("company", "==", name),
        );
        const gradsSnap = await getDocs(gradsQuery);
        await Promise.all(
          gradsSnap.docs.map((gradDoc) =>
            updateDoc(doc(db, "submissions", gradDoc.id), { company: "" }),
          ),
        );
      }

      await deleteDoc(doc(db, "companies", name));
      showMsg(`Company "${name}" deleted`);
      loadCompanies();
    } catch (error) {
      console.error("Error deleting company:", error);
      showMsg("Error deleting company");
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
              <h1 className="page-title">Manage Companies</h1>
              <p className="page-subtitle">
                Add new companies or edit and remove existing ones.
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

          <CompanySection
            companies={companies}
            loading={loading}
            onAddCompany={handleAddCompany}
            onUpdateLogo={handleUpdateLogo}
            onEditCompany={handleEditCompany}
            onDeleteCompany={handleDeleteCompany}
          />
        </div>
      </div>
    </AdminGate>
  );
}
