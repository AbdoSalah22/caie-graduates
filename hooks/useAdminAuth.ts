"use client";

import { useState, useEffect } from "react";
import {
  User,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { isAdminEmail } from "@/lib/auth";

/**
 * Shared auth logic for the admin area: tracks the signed-in user,
 * checks admin authorization, and provides sign-in/sign-out actions.
 */
export function useAdminAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [signInLoading, setSignInLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      setIsAdmin(
        currentUser ? isAdminEmail(currentUser.email || "") : false,
      );
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    try {
      setSignInLoading(true);
      setAuthError("");
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: unknown) {
      const errMessage =
        err instanceof Error ? err.message : "Failed to sign in";
      setAuthError(errMessage);
      setTimeout(() => setAuthError(""), 5000);
    } finally {
      setSignInLoading(false);
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  return { user, authLoading, isAdmin, signInLoading, authError, signIn, signOutUser };
}
