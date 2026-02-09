"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import AdminLayoutComponent from "@/components/admin/layout/AdminLayout";

const PUBLIC_ADMIN_PATHS = ["/admin/login"];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, accessToken, refreshToken } = useAuthStore();
  const [checking, setChecking] = useState(true);

  const isPublicPage = PUBLIC_ADMIN_PATHS.includes(pathname);

  useEffect(() => {
    if (isPublicPage) {
      setChecking(false);
      return;
    }

    async function checkAuth() {
      if (!accessToken) {
        const newToken = await refreshToken();
        if (!newToken) {
          router.replace("/admin/login");
          return;
        }
      }

      const currentUser = useAuthStore.getState().user;
      if (currentUser && currentUser.role !== "ADMIN" && currentUser.role !== "STAFF") {
        router.replace("/admin/login");
        return;
      }

      setChecking(false);
    }

    checkAuth();
  }, [accessToken, refreshToken, router, isPublicPage]);

  // Public pages (login) render without auth guard or admin shell
  if (isPublicPage) {
    return <>{children}</>;
  }

  // Still checking auth
  if (checking || !user || (user.role !== "ADMIN" && user.role !== "STAFF")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-neutral-500">Loading...</div>
      </div>
    );
  }

  return <AdminLayoutComponent>{children}</AdminLayoutComponent>;
}
