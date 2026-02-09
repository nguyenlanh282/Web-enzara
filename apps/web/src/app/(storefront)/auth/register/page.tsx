"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { ApiError } from "@/lib/api";

const registerSchema = z
  .object({
    fullName: z.string().min(1, "Vui long nhap ho ten"),
    email: z
      .string()
      .min(1, "Vui long nhap email")
      .email("Email khong hop le"),
    phone: z.string().optional(),
    password: z.string().min(6, "Mat khau toi thieu 6 ky tu"),
    confirmPassword: z.string().min(1, "Vui long xac nhan mat khau"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mat khau xac nhan khong khop",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setError(null);
    try {
      await registerUser(data.email, data.password, data.fullName, data.phone);
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
        Tao tai khoan
      </h2>
      <p className="text-neutral-500 text-sm font-body mb-8">
        Dang ky de mua sam san pham sinh thai
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 text-sm text-red-600 font-body">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label
            htmlFor="fullName"
            className="block text-sm font-medium text-neutral-700 mb-1.5 font-body"
          >
            Ho va ten
          </label>
          <input
            id="fullName"
            type="text"
            autoComplete="name"
            placeholder="Nguyen Van A"
            className="w-full h-12 rounded-xl border border-neutral-200 px-4 text-sm font-body
              focus:outline-none focus:ring-2 focus:ring-primary-700/20 focus:border-primary-700
              placeholder:text-neutral-400 transition-colors"
            {...register("fullName")}
          />
          {errors.fullName && (
            <p className="mt-1.5 text-sm text-red-600 font-body">
              {errors.fullName.message}
            </p>
          )}
        </div>

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
            htmlFor="phone"
            className="block text-sm font-medium text-neutral-700 mb-1.5 font-body"
          >
            So dien thoai{" "}
            <span className="text-neutral-400 font-normal">(khong bat buoc)</span>
          </label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="0912 345 678"
            className="w-full h-12 rounded-xl border border-neutral-200 px-4 text-sm font-body
              focus:outline-none focus:ring-2 focus:ring-primary-700/20 focus:border-primary-700
              placeholder:text-neutral-400 transition-colors"
            {...register("phone")}
          />
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
            autoComplete="new-password"
            placeholder="Toi thieu 6 ky tu"
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

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-neutral-700 mb-1.5 font-body"
          >
            Xac nhan mat khau
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Nhap lai mat khau"
            className="w-full h-12 rounded-xl border border-neutral-200 px-4 text-sm font-body
              focus:outline-none focus:ring-2 focus:ring-primary-700/20 focus:border-primary-700
              placeholder:text-neutral-400 transition-colors"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="mt-1.5 text-sm text-red-600 font-body">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 rounded-xl bg-primary-700 text-white font-medium text-sm font-body
            hover:bg-primary-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
            shadow-sm hover:shadow-md"
        >
          {isLoading ? "Dang tao tai khoan..." : "Dang ky"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-neutral-500 font-body">
        Da co tai khoan?{" "}
        <Link
          href="/auth/login"
          className="text-primary-700 hover:text-primary-800 font-medium transition-colors"
        >
          Dang nhap
        </Link>
      </p>
    </div>
  );
}
