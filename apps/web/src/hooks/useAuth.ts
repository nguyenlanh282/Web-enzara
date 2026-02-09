"use client";

import { useAuthStore } from "@/stores/authStore";

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const register = useAuthStore((s) => s.register);

  return {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === "ADMIN" || user?.role === "STAFF",
    isLoading,
    login,
    logout,
    register,
  };
}
