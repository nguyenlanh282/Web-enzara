"use client";

import { Mail } from "lucide-react";
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
    <section className="py-16 bg-primary-700">
      <div className="mx-auto max-w-4xl px-4 text-center">
        <Mail className="h-12 w-12 text-white mx-auto mb-4" />
        <h2 className="text-3xl font-heading font-bold text-white mb-3">
          {t("title")}
        </h2>
        <p className="text-primary-100 mb-8 max-w-xl mx-auto">
          {t("subtitle")}
        </p>

        {isSubmitted ? (
          <div className="bg-white/10 text-white py-4 px-6 rounded-lg inline-block">
            <p className="font-medium">{t("success.title")}</p>
            <p className="text-sm text-primary-100 mt-1">
              {t("success.message")}
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("placeholder")}
              required
              className="flex-1 px-4 py-3 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-white text-primary-700 font-semibold rounded-lg hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? t("submitting") : t("submitButton")}
            </button>
          </form>
        )}
        {error && (
          <p className="text-red-200 text-sm mt-3">{error}</p>
        )}
      </div>
    </section>
  );
}
