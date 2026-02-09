"use client";

import { useState } from "react";
import { Share2, Link, MessageCircle } from "lucide-react";

interface SocialShareProps {
  url: string;
  title: string;
}

export function SocialShare({ url, title }: SocialShareProps) {
  const [copied, setCopied] = useState(false);

  const shareOnFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      "_blank",
      "noopener,noreferrer,width=600,height=400"
    );
  };

  const shareOnZalo = () => {
    window.open(
      `https://zalo.me/share?url=${encodeURIComponent(url)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-neutral-500 font-body">Chia se:</span>

      <button
        onClick={shareOnFacebook}
        aria-label="Chia se tren Facebook"
        title="Facebook"
        className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-neutral-200 text-neutral-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
      >
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      </button>

      <button
        onClick={shareOnZalo}
        aria-label="Chia se tren Zalo"
        title="Zalo"
        className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-neutral-200 text-neutral-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
      >
        <MessageCircle className="h-4 w-4" />
      </button>

      <button
        onClick={copyLink}
        aria-label="Sao chep lien ket"
        title={copied ? "Da sao chep" : "Sao chep lien ket"}
        className={`inline-flex items-center justify-center h-9 rounded-full border transition-colors px-3 gap-1.5 text-sm font-body ${
          copied
            ? "bg-primary-50 text-primary-700 border-primary-200"
            : "border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:border-neutral-300"
        }`}
      >
        <Link className="h-4 w-4" />
        {copied && <span>Da sao chep</span>}
      </button>
    </div>
  );
}
