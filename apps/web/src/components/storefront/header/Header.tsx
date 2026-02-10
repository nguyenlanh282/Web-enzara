"use client";

import { Menu, Phone, Search, User } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { SearchModal } from "./SearchModal";
import { MobileMenu } from "./MobileMenu";
import { CartIconWithBadge } from "./CartIconWithBadge";
import { LanguageSwitcher } from "./LanguageSwitcher";

interface HeaderProps {
  settings?: Record<string, string>;
  menus?: Array<{ id: string; label: string; href: string; children?: any[] }>;
  categories?: any[];
}

export function Header({
  settings,
  menus = [],
  categories = [],
}: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = useTranslations("navigation");

  return (
    <>
      {/* Utility Bar */}
      <div className="hidden lg:block bg-primary-700 text-white text-xs">
        <div className="mx-auto max-w-7xl px-4 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a
              href="tel:0909123456"
              className="flex items-center gap-1.5 hover:text-primary-200 transition-colors"
            >
              <Phone className="h-3 w-3" />
              0909 123 456
            </a>
            <span className="text-primary-400">|</span>
            <a
              href="mailto:info@enzara.vn"
              className="hover:text-primary-200 transition-colors"
            >
              info@enzara.vn
            </a>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/order-tracking"
              className="hover:text-primary-200 transition-colors"
            >
              {t("orderTracking")}
            </Link>
            <span className="text-primary-400">|</span>
            <Link
              href="/blog"
              className="hover:text-primary-200 transition-colors"
            >
              {t("blog")}
            </Link>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-40 bg-white border-b">
        <div className="mx-auto max-w-7xl">
          {/* Desktop Header */}
          <div className="hidden lg:flex items-center justify-between px-4 py-4">
            <Link
              href="/"
              className="text-primary-700 font-heading font-bold text-xl"
            >
              Enzara
            </Link>

            <nav className="flex items-center gap-8">
              {menus.map((menu) => (
                <Link
                  key={menu.id}
                  href={menu.href}
                  className="text-neutral-700 hover:text-primary-700 transition-colors font-medium"
                >
                  {menu.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                aria-label={t("searchAriaLabel")}
              >
                <Search className="h-5 w-5" />
              </button>

              <LanguageSwitcher />

              <Link
                href="/account"
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                aria-label={t("accountAriaLabel")}
              >
                <User className="h-5 w-5" />
              </Link>

              <CartIconWithBadge />
            </div>
          </div>

          {/* Mobile Header */}
          <div className="flex lg:hidden items-center justify-between px-4 py-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              aria-label={t("menu")}
            >
              <Menu className="h-6 w-6" />
            </button>

            <Link
              href="/"
              className="text-primary-700 font-heading font-bold text-xl absolute left-1/2 -translate-x-1/2"
            >
              Enzara
            </Link>

            <CartIconWithBadge />
          </div>
        </div>
      </header>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <MobileMenu
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        menus={menus}
        categories={categories}
      />
    </>
  );
}
