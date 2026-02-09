"use client";

import { create } from "zustand";
import { apiClient, ApiError } from "@/lib/api";

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: "CUSTOMER" | "ADMIN" | "STAFF";
  avatar: string | null;
  emailVerified: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    fullName: string,
    phone?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<string | null>;
  setUser: (user: User | null) => void;
}

type AuthStore = AuthState & AuthActions;

interface LoginResponse {
  accessToken: string;
}

interface RegisterResponse {
  accessToken: string;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  accessToken: null,
  isLoading: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const data = await apiClient.post<LoginResponse>("/auth/login", {
        email,
        password,
      });
      set({ accessToken: data.accessToken });

      // Fetch user profile
      const user = await apiClient.get<User>("/auth/me");
      set({ user });

      // Set auth indicator cookie for middleware (UI guard only)
      document.cookie = "enzara-auth=1; path=/; max-age=604800; SameSite=Strict";
    } catch (error) {
      set({ accessToken: null, user: null });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (
    email: string,
    password: string,
    fullName: string,
    phone?: string
  ) => {
    set({ isLoading: true });
    try {
      const body: Record<string, string> = { email, password, fullName };
      if (phone) body.phone = phone;

      const data = await apiClient.post<RegisterResponse>(
        "/auth/register",
        body
      );
      set({ accessToken: data.accessToken });

      // Fetch user profile
      const user = await apiClient.get<User>("/auth/me");
      set({ user });

      // Set auth indicator cookie for middleware (UI guard only)
      document.cookie = "enzara-auth=1; path=/; max-age=604800; SameSite=Strict";
    } catch (error) {
      set({ accessToken: null, user: null });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch {
      // Ignore logout errors
    } finally {
      // Clear auth indicator cookie
      document.cookie = "enzara-auth=; path=/; max-age=0; SameSite=Strict";
      set({ user: null, accessToken: null });
    }
  },

  refreshToken: async () => {
    try {
      const data = await apiClient.post<LoginResponse>("/auth/refresh");
      set({ accessToken: data.accessToken });

      // Refresh auth indicator cookie
      if (typeof document !== "undefined") {
        document.cookie = "enzara-auth=1; path=/; max-age=604800; SameSite=Strict";
      }

      // Fetch user profile if not loaded
      if (!get().user) {
        const user = await apiClient.get<User>("/auth/me");
        set({ user });
      }

      return data.accessToken;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        set({ user: null, accessToken: null });
      }
      return null;
    }
  },

  setUser: (user: User | null) => {
    set({ user });
  },
}));
