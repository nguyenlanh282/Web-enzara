"use client";

import { Mail, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { apiClient } from "@/lib/api";

export function Newsletter() {
  const t = useTranslations("newsletter");
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setError("");

    try {
      await apiClient.post("/newsletter/subscribe", { email });
      setIsSubmitted(true);
      setEmail("");
    } catch (err) {
      console.error("Newsletter subscription error:", err);
      setError(t("error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900 rounded-3xl p-8 sm:p-12 lg:p-16">
      {/* Decorative circles */}
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-primary-600/30 blur-3xl" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-primary-500/20 blur-3xl" />

      <div className="relative max-w-2xl mx-auto text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm mb-6">
          <Mail className="h-7 w-7 text-white" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-heading font-bold text-white mb-3">
          {t("title")}
        </h2>
        <p className="text-primary-200 mb-8 max-w-md mx-auto text-sm sm:text-base">
          {t("subtitle")}
        </p>

        {isSubmitted ? (
          <div className="bg-white/10 backdrop-blur-sm text-white py-5 px-8 rounded-2xl inline-block">
            <p className="font-heading font-semibold text-lg">{t("success.title")}</p>
            <p className="text-sm text-primary-200 mt-1">
              {t("success.message")}
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("placeholder")}
              required
              className="flex-1 px-5 py-3.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-transparent transition-all"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white text-primary-800 font-heading font-semibold rounded-xl hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? t("submitting") : t("submitButton")}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}
        {error && (
          <p className="text-red-300 text-sm mt-3">{error}</p>
        )}
      </div>
    </div>
  );
}
