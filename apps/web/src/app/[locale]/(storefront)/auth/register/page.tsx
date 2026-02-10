"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { ApiError } from "@/lib/api";
import { useTranslations } from "next-intl";

export default function RegisterPage() {
  const t = useTranslations("auth.register");
  const tValidation = useTranslations("auth.validation");
  const router = useRouter();
  const { register: registerUser, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const registerSchema = z
    .object({
      fullName: z.string().min(1, tValidation("nameRequired")),
      email: z
        .string()
        .min(1, tValidation("emailRequired"))
        .email(tValidation("emailInvalid")),
      phone: z.string().optional(),
      password: z.string().min(6, tValidation("passwordMin")),
      confirmPassword: z.string().min(1, tValidation("confirmPasswordRequired")),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: tValidation("passwordMismatch"),
      path: ["confirmPassword"],
    });

  type RegisterForm = z.infer<typeof registerSchema>;

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
        setError(t("error"));
      }
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-heading font-bold text-neutral-900 mb-2">
        {t("title")}
      </h2>
      <p className="text-neutral-500 text-sm font-body mb-8">
        {t("subtitle")}
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
            {t("fullNameLabel")}
          </label>
          <input
            id="fullName"
            type="text"
            autoComplete="name"
            placeholder={t("fullNamePlaceholder")}
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
            {t("emailLabel")}
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder={t("emailPlaceholder")}
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
            {t("phoneLabel")}{" "}
            <span className="text-neutral-400 font-normal">({t("phoneOptional")})</span>
          </label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder={t("phonePlaceholder")}
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
            {t("passwordLabel")}
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder={t("passwordPlaceholder")}
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
            {t("confirmPasswordLabel")}
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder={t("confirmPasswordPlaceholder")}
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
          {isLoading ? t("submitting") : t("submitButton")}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-neutral-500 font-body">
        {t("hasAccount")}{" "}
        <Link
          href="/auth/login"
          className="text-primary-700 hover:text-primary-800 font-medium transition-colors"
        >
          {t("loginLink")}
        </Link>
      </p>
    </div>
  );
}
