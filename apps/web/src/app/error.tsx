"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="text-center max-w-lg">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-50">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>

        <h1 className="mt-6 text-2xl font-heading font-bold text-neutral-900">
          Da xay ra loi
        </h1>
        <p className="mt-3 text-neutral-500 font-body">
          Chung toi khong the tai trang nay. Vui long thu lai hoac quay ve
          trang chu.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-700 text-white rounded-xl font-body font-medium hover:bg-primary-800 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Thu lai
          </button>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 border border-neutral-300 text-neutral-700 rounded-xl font-body font-medium hover:border-primary-700 hover:text-primary-700 transition-colors"
          >
            <Home className="h-4 w-4" />
            Ve trang chu
          </a>
        </div>
      </div>
    </div>
  );
}
