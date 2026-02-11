"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();

  function switchLocale(newLocale: Locale) {
    router.replace(pathname, { locale: newLocale });
  }

  return (
    <div className="flex items-center bg-neutral-100 rounded-full p-0.5">
      <button
        onClick={() => switchLocale("vi")}
        className={cn(
          "px-2.5 py-1 rounded-full text-xs font-semibold transition-all",
          locale === "vi"
            ? "bg-primary-700 text-white shadow-sm"
            : "text-neutral-500 hover:text-neutral-700"
        )}
        aria-label="Tiếng Việt"
      >
        VI
      </button>
      <button
        onClick={() => switchLocale("en")}
        className={cn(
          "px-2.5 py-1 rounded-full text-xs font-semibold transition-all",
          locale === "en"
            ? "bg-primary-700 text-white shadow-sm"
            : "text-neutral-500 hover:text-neutral-700"
        )}
        aria-label="English"
      >
        EN
      </button>
    </div>
  );
}
