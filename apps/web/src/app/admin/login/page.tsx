"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/stores/authStore";
import { ApiError } from "@/lib/api";

const adminLoginSchema = z.object({
  email: z
    .string()
    .min(1, "Vui lòng nhập email")
    .email("Email không hợp lệ"),
  password: z
    .string()
    .min(6, "Mật khẩu tối thiểu 6 ký tự"),
});

type AdminLoginForm = z.infer<typeof adminLoginSchema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, isLoading, user } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminLoginForm>({
    resolver: zodResolver(adminLoginSchema),
  });

  const onSubmit = async (data: AdminLoginForm) => {
    setError(null);
    try {
      await login(data.email, data.password);

      // Check role after login
      const currentUser = useAuthStore.getState().user;
      if (currentUser?.role !== "ADMIN" && currentUser?.role !== "STAFF") {
        await useAuthStore.getState().logout();
        setError("Bạn không có quyền truy cập trang quản trị.");
        return;
      }

      router.push("/admin/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Đã có lỗi xảy ra. Vui lòng thử lại.");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-primary-700">
            Enzara Admin
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Đăng nhập vào trang quản trị
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-8">
          <h2 className="text-2xl font-heading font-bold text-neutral-900 text-center mb-6">
            Đăng nhập
          </h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-neutral-700 mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="admin@enzara.vn"
                className="w-full h-[44px] rounded-lg border border-neutral-200 px-3 text-sm
                  focus:outline-none focus:ring-2 focus:ring-primary-700/20 focus:border-primary-700
                  placeholder:text-neutral-400"
                {...register("email")}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-neutral-700 mb-1.5"
              >
                Mật khẩu
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="Nhập mật khẩu"
                className="w-full h-[44px] rounded-lg border border-neutral-200 px-3 text-sm
                  focus:outline-none focus:ring-2 focus:ring-primary-700/20 focus:border-primary-700
                  placeholder:text-neutral-400"
                {...register("password")}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-lg bg-primary-700 text-white font-medium text-sm
                hover:bg-primary-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
