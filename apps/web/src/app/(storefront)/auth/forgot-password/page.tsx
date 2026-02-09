"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiClient, ApiError } from "@/lib/api";

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Vui long nhap email")
    .email("Email khong hop le"),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setError(null);
    setIsLoading(true);
    try {
      await apiClient.post("/auth/forgot-password", { email: data.email });
      setSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Da co loi xay ra. Vui long thu lai.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-6 flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-50">
          <svg
            className="w-8 h-8 text-primary-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-heading font-bold text-neutral-900 mb-3">
          Kiem tra email
        </h2>
        <p className="text-neutral-500 text-sm font-body mb-8 max-w-sm mx-auto">
          Neu email ton tai trong he thong, chung toi da gui huong dan dat lai mat khau.
        </p>
        <Link
          href="/auth/login"
          className="inline-flex items-center justify-center h-12 px-8 rounded-xl bg-primary-700 text-white font-medium text-sm font-body
            hover:bg-primary-800 transition-colors shadow-sm hover:shadow-md"
        >
          Quay lai dang nhap
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-heading font-bold text-neutral-900 mb-2">
        Quen mat khau
      </h2>
      <p className="text-neutral-500 text-sm font-body mb-8">
        Nhap email de nhan huong dan dat lai mat khau.
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

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 rounded-xl bg-primary-700 text-white font-medium text-sm font-body
            hover:bg-primary-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
            shadow-sm hover:shadow-md"
        >
          {isLoading ? "Dang gui..." : "Gui yeu cau"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-neutral-500 font-body">
        <Link
          href="/auth/login"
          className="text-primary-700 hover:text-primary-800 font-medium transition-colors"
        >
          Quay lai dang nhap
        </Link>
      </p>
    </div>
  );
}
