"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, CreditCard, Search, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  {
    label: "Chung",
    href: "/admin/settings/general",
    icon: Settings,
  },
  {
    label: "Thanh toan",
    href: "/admin/settings/payment",
    icon: CreditCard,
  },
  {
    label: "SEO",
    href: "/admin/settings/seo",
    icon: Search,
  },
  {
    label: "Giao dien",
    href: "/admin/settings/appearance",
    icon: Palette,
  },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-neutral-900">
          Cai dat
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Quan ly cau hinh va tuy chinh cua hang Enzara
        </p>
      </div>

      {/* Tab navigation */}
      <div className="bg-white rounded-xl border border-neutral-200">
        <nav className="flex border-b border-neutral-200 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                  isActive
                    ? "border-primary-700 text-primary-700"
                    : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </Link>
            );
          })}
        </nav>

        {/* Content area */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
