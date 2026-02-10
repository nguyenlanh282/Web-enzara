"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed this session
    if (sessionStorage.getItem("pwa-install-dismissed")) {
      setDismissed(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferredPrompt || dismissed) return null;

  const handleInstall = async () => {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("pwa-install-dismissed", "1");
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-white rounded-xl shadow-lg border border-neutral-200 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary-700 flex items-center justify-center">
            <span className="text-white font-heading font-bold text-sm">E</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-heading font-bold text-neutral-900">
              Cai dat Enzara
            </p>
            <p className="text-xs text-neutral-500 font-body mt-0.5">
              Them vao man hinh chinh de truy cap nhanh hon
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-neutral-400 hover:text-neutral-600 transition-colors"
            aria-label="Dong"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <button
          onClick={handleInstall}
          className="mt-3 w-full py-2 bg-primary-600 text-white text-sm font-body font-medium rounded-lg hover:bg-primary-700 transition-colors"
        >
          Cai dat
        </button>
      </div>
    </div>
  );
}
