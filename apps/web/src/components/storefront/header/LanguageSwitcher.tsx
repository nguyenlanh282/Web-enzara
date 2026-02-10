"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { locales, type Locale } from "@/i18n/config";
import { Globe } from "lucide-react";

const localeLabels: Record<Locale, string> = {
  vi: "VI",
  en: "EN",
};

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();

  function switchLocale(newLocale: Locale) {
    router.replace(pathname, { locale: newLocale });
  }

  const otherLocale = locale === "vi" ? "en" : "vi";

  return (
    <button
      onClick={() => switchLocale(otherLocale)}
      className="flex items-center gap-1.5 p-2 hover:bg-neutral-100 rounded-lg transition-colors text-sm font-medium text-neutral-700"
      aria-label={`Switch to ${localeLabels[otherLocale]}`}
    >
      <Globe className="h-4 w-4" />
      <span className="hidden sm:inline">{localeLabels[otherLocale]}</span>
    </button>
  );
}
