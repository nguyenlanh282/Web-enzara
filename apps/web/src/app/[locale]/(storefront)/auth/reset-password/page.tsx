"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiClient, ApiError } from "@/lib/api";

const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(6, "Mat khau toi thieu 6 ky tu"),
    confirmPassword: z.string().min(1, "Vui long xac nhan mat khau"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mat khau xac nhan khong khop",
    path: ["confirmPassword"],
  });

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) {
      setError("Token khong hop le. Vui long yeu cau dat lai mat khau moi.");
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      await apiClient.post("/auth/reset-password", {
        token,
        newPassword: data.newPassword,
      });
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

  if (!token) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-heading font-bold text-neutral-900 mb-4">
          Link khong hop le
        </h2>
        <p className="text-neutral-600 text-sm mb-6">
          Link dat lai mat khau khong hop le hoac da het han.
        </p>
        <Link
          href="/auth/forgot-password"
          className="text-primary-700 font-medium text-sm hover:underline"
        >
          Yeu cau dat lai mat khau moi
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-heading font-bold text-neutral-900 mb-4">
          Dat lai mat khau thanh cong
        </h2>
        <p className="text-neutral-600 text-sm mb-6">
          Mat khau cua ban da duoc cap nhat. Ban co the dang nhap voi mat khau moi.
        </p>
        <Link
          href="/auth/login"
          className="inline-block px-6 py-3 rounded-lg bg-primary-700 text-white font-medium text-sm hover:bg-primary-800 transition-colors"
        >
          Dang nhap
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-heading font-bold text-neutral-900 text-center mb-2">
        Dat lai mat khau
      </h2>
      <p className="text-neutral-500 text-sm text-center mb-6">
        Nhap mat khau moi cho tai khoan cua ban.
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label
            htmlFor="newPassword"
            className="block text-sm font-medium text-neutral-700 mb-1.5"
          >
            Mat khau moi
          </label>
          <input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Nhap mat khau moi"
            className="w-full h-[44px] rounded-lg border border-neutral-200 px-3 text-sm
              focus:outline-none focus:ring-2 focus:ring-primary-700/20 focus:border-primary-700
              placeholder:text-neutral-400"
            {...register("newPassword")}
          />
          {errors.newPassword && (
            <p className="mt-1 text-sm text-red-500">
              {errors.newPassword.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-neutral-700 mb-1.5"
          >
            Xac nhan mat khau
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Nhap lai mat khau moi"
            className="w-full h-[44px] rounded-lg border border-neutral-200 px-3 text-sm
              focus:outline-none focus:ring-2 focus:ring-primary-700/20 focus:border-primary-700
              placeholder:text-neutral-400"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-500">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 rounded-lg bg-primary-700 text-white font-medium text-sm
            hover:bg-primary-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Dang xu ly..." : "Dat lai mat khau"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-500">
        <Link
          href="/auth/login"
          className="text-primary-700 font-medium hover:underline"
        >
          Quay lai dang nhap
        </Link>
      </p>
    </div>
  );
}
