"use client";

import { useEffect } from "react";
import { BASE_PATH } from "@/lib/constants";

export default function Home() {
  useEffect(() => {
    window.location.replace(`${BASE_PATH}/preview/`);
  }, []);

  return (
    <div className="page-shell flex min-h-screen items-center justify-center">
      <div className="surface-card-soft px-8 py-10 text-center">
        <p className="text-slate-300">Redirecting to the preview board...</p>
      </div>
    </div>
  );
}