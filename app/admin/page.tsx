"use client";

import { useState, useEffect } from "react";
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
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  User,
} from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import { isAdminEmail } from "@/lib/auth";
import { isValidLinkedInUrl } from "@/lib/utils";
import Link from "next/link";

/* ─────────────────────────────────────────────
   Sub-components
   ───────────────────────────────────────────── */

// ── Settings Section ──
function SettingsSection({
  showProfileButton,
  setShowProfileButton,
  onSave,
  message,
}: {
  showProfileButton: boolean;
  setShowProfileButton: (v: boolean) => void;
  onSave: () => void;
  message: string;
}) {
  return (
    <div className="surface-card p-6 mb-8">
      <h2 className="text-2xl font-semibold text-white mb-4">
        Home Page Settings
      </h2>
      <div className="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-800/70 p-4">
        <div>
          <h3 className="text-white font-semibold">
            Show My Profile button
          </h3>
          <p className="text-gray-400 text-sm">
            Enable or disable the button on the home page.
          </p>
        </div>
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            checked={showProfileButton}
            onChange={(e) => setShowProfileButton(e.target.checked)}
            className="peer sr-only"
          />
          <div className="h-6 w-11 rounded-full bg-gray-600 peer-checked:bg-blue-600 transition-all"></div>
          <div className="pointer-events-none absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-all peer-checked:translate-x-5"></div>
        </label>
      </div>
      <button
        type="button"
        onClick={onSave}
        className="primary-btn mt-4 px-4 py-2"
      >
        Save Settings
      </button>
    </div>
  );
}

// ── Company Section ──
interface CompanyItem {
  name: string;
  count: number;
  logoUrl?: string;
}

function CompanySection({
  companies,
  loading,
  onAddCompany,
  onUpdateLogo,
  message,
}: {
  companies: CompanyItem[];
  loading: boolean;
  onAddCompany: (name: string, logoUrl: string) => Promise<void>;
  onUpdateLogo: (name: string, logoUrl: string) => Promise<void>;
  message: string;
}) {
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyLogo, setNewCompanyLogo] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAddCompany(newCompanyName, newCompanyLogo);
    setNewCompanyName("");
    setNewCompanyLogo("");
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
                    className="text-cyan-400 transition-colors hover:text-cyan-300"
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

// ── Graduate Section ──
interface GraduateItem {
  id: string;
  name: string;
  title: string;
  linkedin: string;
  company: string;
  portfolioCv?: string;
  graduationClass?: string;
}

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
  onSave: (data: GraduateItem | Omit<GraduateItem, "id">) => Promise<void>;
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
    setEditingId(grad.id);
    setForm({
      name: grad.name,
      title: grad.title,
      linkedin: grad.linkedin,
      company: grad.company,
      portfolioCv: grad.portfolioCv || "",
      graduationClass: grad.graduationClass || "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await onSave({ id: editingId, ...form });
    } else {
      await onSave(form);
    }
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
                  onClick={() => onDelete(graduate.id)}
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
   Main Admin Page
   ───────────────────────────────────────────── */

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [graduates, setGraduates] = useState<GraduateItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showProfileButton, setShowProfileButton] = useState(true);

  // ── Auth state ──
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);

      if (currentUser) {
        const adminCheck = isAdminEmail(currentUser.email || "");
        setIsAdmin(adminCheck);

        if (adminCheck) {
          loadCompanies();
          loadGraduates();
          loadSettings();
        }
      } else {
        setIsAdmin(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setMessage("");
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: unknown) {
      const errMessage =
        err instanceof Error ? err.message : "Failed to sign in";
      setMessage(errMessage);
      setTimeout(() => setMessage(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setIsAdmin(false);
    } catch (err) {
      console.error("Sign out error:", err);
    }
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

  const loadSettings = async () => {
    try {
      const settingsRef = doc(db, "settings", "home");
      const settingsDoc = await getDoc(settingsRef);
      if (settingsDoc.exists()) {
        setShowProfileButton(settingsDoc.data().showProfileButton ?? true);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  // ── Action handlers ──
  const showMsg = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

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

  const saveSettings = async () => {
    try {
      const settingsRef = doc(db, "settings", "home");
      await setDoc(
        settingsRef,
        { showProfileButton, updatedAt: serverTimestamp() },
        { merge: true },
      );
      showMsg("Home page settings updated");
    } catch (error) {
      console.error("Error saving settings:", error);
      showMsg("Error saving settings");
    }
  };

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

  const handleSaveGraduate = async (
    data: GraduateItem | Omit<GraduateItem, "id">,
  ) => {
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

      if ("id" in data && data.id) {
        // Editing existing
        const currentGraduate = graduates.find((g) => g.id === data.id);
        const graduateRef = doc(db, "submissions", data.id);

        if (currentGraduate && currentGraduate.company !== data.company.trim()) {
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

  // ── Render: Auth loading ──
  if (authLoading) {
    return (
      <div className="page-shell flex min-h-screen items-center justify-center">
        <div className="surface-card-soft px-8 py-10 text-center">
          <div className="mx-auto mb-4 h-14 w-14 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-400"></div>
          <p className="text-slate-300">Loading...</p>
        </div>
      </div>
    );
  }

  // ── Render: Not signed in ──
  if (!user) {
    return (
      <div className="page-shell flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="page-header mb-8 text-center">
            <h1 className="page-title mb-2">Admin Panel</h1>
            <p className="page-subtitle">Sign in with your admin account</p>
          </div>

          <div className="surface-card p-8 text-center">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-6 py-3 font-semibold text-slate-800 transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-gray-800"></div>
                  Signing in...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Sign in with Google
                </>
              )}
            </button>

            {message && (
              <div className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg text-sm">
                {message}
              </div>
            )}

            <Link href="/" className="ghost-link mt-6 block justify-center">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: Signed in but not admin ──
  if (!isAdmin) {
    return (
      <div className="page-shell flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="surface-card p-8">
            <div className="mb-4 text-5xl">🔒</div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Access Denied
            </h2>
            <p className="text-slate-400 mb-2">
              <span className="font-medium text-slate-200">
                {user.email}
              </span>{" "}
              is not authorized as an admin.
            </p>
            <p className="text-slate-500 text-sm mb-6">
              Contact the site administrator to request access.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleSignOut}
                className="secondary-btn px-4 py-2"
              >
                Sign out
              </button>
              <Link href="/" className="primary-btn px-4 py-2">
                Back to Board
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: Admin dashboard ──
  return (
    <div className="page-shell px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="page-container max-w-6xl">
        <div className="page-header mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="page-title">Admin Panel</h1>
            <p className="page-subtitle">
              Signed in as{" "}
              <span className="font-medium text-slate-200">{user.email}</span>
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSignOut}
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

        <SettingsSection
          showProfileButton={showProfileButton}
          setShowProfileButton={setShowProfileButton}
          onSave={saveSettings}
          message={message}
        />

        <GraduateSection
          graduates={graduates}
          companies={companies}
          loading={loading}
          onSave={handleSaveGraduate}
          onDelete={handleDeleteGraduate}
        />

        <CompanySection
          companies={companies}
          loading={loading}
          onAddCompany={handleAddCompany}
          onUpdateLogo={handleUpdateLogo}
          message={message}
        />
      </div>
    </div>
  );
}
