"use client";

import Link from "next/link";
import { useAdminAuth } from "@/hooks/useAdminAuth";

/**
 * Wraps admin pages with the shared auth screens (loading, sign-in,
 * access denied) and renders children only for authorized admins.
 */
export default function AdminGate({ children }: { children: React.ReactNode }) {
  const {
    user,
    authLoading,
    isAdmin,
    signInLoading,
    authError,
    signIn,
    signOutUser,
  } = useAdminAuth();

  // ── Auth loading ──
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

  // ── Not signed in ──
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
              onClick={signIn}
              disabled={signInLoading}
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-6 py-3 font-semibold text-slate-800 transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {signInLoading ? (
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

            {authError && (
              <div className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg text-sm">
                {authError}
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

  // ── Signed in but not admin ──
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
              <span className="font-medium text-slate-200">{user.email}</span>{" "}
              is not authorized as an admin.
            </p>
            <p className="text-slate-500 text-sm mb-6">
              Contact the site administrator to request access.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={signOutUser}
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

  return <>{children}</>;
}
