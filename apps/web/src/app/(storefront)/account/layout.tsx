"use client";

import { useState } from "react";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import { apiClient } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  ShoppingCart,
  Heart,
  MapPin,
  User,
  Gift,
  LogOut,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Don hang", href: "/account/orders", icon: ShoppingCart },
  { label: "Yeu thich", href: "/account/wishlist", icon: Heart },
  { label: "Dia chi", href: "/account/addresses", icon: MapPin },
  { label: "Ho so", href: "/account/profile", icon: User },
  { label: "Tich diem", href: "/account/loyalty", icon: Gift },
];

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const logout = useAuthStore((s) => s.logout);

  const [verificationSending, setVerificationSending] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      const currentPath = window.location.pathname;
      router.replace(`/auth/login?redirect=${encodeURIComponent(currentPath)}`);
    }
  }, [user, isLoading, router]);

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  const handleResendVerification = async () => {
    setVerificationSending(true);
    try {
      await apiClient.post("/auth/resend-verification");
      setVerificationSent(true);
    } catch {
      // Silently fail
    } finally {
      setVerificationSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Mobile: Horizontal tabs */}
      <div className="lg:hidden mb-6">
        <div className="flex overflow-x-auto gap-1 border-b border-neutral-200 -mx-4 px-4">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-body font-medium whitespace-nowrap border-b-2 transition-colors",
                  isActive
                    ? "border-primary-700 text-primary-700"
                    : "border-transparent text-neutral-500 hover:text-neutral-700"
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex gap-8">
        {/* Desktop: Sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="bg-white rounded-xl border border-neutral-200 p-6 sticky top-24">
            {/* User info */}
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-neutral-200">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.fullName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-primary-700 font-heading font-bold text-sm">
                    {user.fullName?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-heading font-bold text-sm text-neutral-900 truncate">
                  {user.fullName}
                </p>
                <p className="text-xs text-neutral-500 font-body truncate">
                  {user.email}
                </p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body font-medium transition-colors",
                      isActive
                        ? "bg-primary-50 text-primary-700"
                        : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Logout */}
            <div className="mt-6 pt-6 border-t border-neutral-200">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body font-medium text-red-600 hover:bg-red-50 transition-colors w-full"
              >
                <LogOut className="w-4 h-4" />
                Dang xuat
              </button>
            </div>
          </div>
        </aside>

        {/* Content area */}
        <main className="flex-1 min-w-0">
          {user.emailVerified === false && (
            <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-between gap-3">
              <p className="text-sm font-body text-amber-800">
                Email chua duoc xac minh.
              </p>
              {verificationSent ? (
                <span className="text-sm font-body text-green-700 whitespace-nowrap">
                  Da gui email xac minh
                </span>
              ) : (
                <button
                  onClick={handleResendVerification}
                  disabled={verificationSending}
                  className="text-sm font-body font-medium text-amber-800 underline hover:text-amber-900 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {verificationSending
                    ? "Dang gui..."
                    : "Gui email xac minh"}
                </button>
              )}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
