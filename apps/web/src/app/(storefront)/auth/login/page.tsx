"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { ApiError } from "@/lib/api";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Vui long nhap email")
    .email("Email khong hop le"),
  password: z
    .string()
    .min(6, "Mat khau toi thieu 6 ky tu"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setError(null);
    try {
      await login(data.email, data.password);
      router.push("/");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Da co loi xay ra. Vui long thu lai.");
      }
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-heading font-bold text-neutral-900 mb-2">
        Dang nhap
      </h2>
      <p className="text-neutral-500 text-sm font-body mb-8">
        Nhap thong tin tai khoan de tiep tuc
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 text-sm text-red-600 font-body">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-neutral-700 mb-1.5 font-body"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className="w-full h-12 rounded-xl border border-neutral-200 px-4 text-sm font-body
              focus:outline-none focus:ring-2 focus:ring-primary-700/20 focus:border-primary-700
              placeholder:text-neutral-400 transition-colors"
            {...register("email")}
          />
          {errors.email && (
            <p className="mt-1.5 text-sm text-red-600 font-body">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-neutral-700 mb-1.5 font-body"
          >
            Mat khau
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="Nhap mat khau"
            className="w-full h-12 rounded-xl border border-neutral-200 px-4 text-sm font-body
              focus:outline-none focus:ring-2 focus:ring-primary-700/20 focus:border-primary-700
              placeholder:text-neutral-400 transition-colors"
            {...register("password")}
          />
          {errors.password && (
            <p className="mt-1.5 text-sm text-red-600 font-body">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="flex justify-end">
          <Link
            href="/auth/forgot-password"
            className="text-sm text-primary-700 hover:text-primary-800 font-medium font-body transition-colors"
          >
            Quen mat khau?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 rounded-xl bg-primary-700 text-white font-medium text-sm font-body
            hover:bg-primary-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
            shadow-sm hover:shadow-md"
        >
          {isLoading ? "Dang dang nhap..." : "Dang nhap"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-neutral-500 font-body">
        Chua co tai khoan?{" "}
        <Link
          href="/auth/register"
          className="text-primary-700 hover:text-primary-800 font-medium transition-colors"
        >
          Dang ky
        </Link>
      </p>
    </div>
  );
}
