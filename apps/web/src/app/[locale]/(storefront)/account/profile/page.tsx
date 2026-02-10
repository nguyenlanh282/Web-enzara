"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiClient, ApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

const profileSchema = z.object({
  fullName: z.string().min(2, "Ten phai co it nhat 2 ky tu"),
  phone: z
    .string()
    .regex(/^(0[3-9])\d{8}$/, "So dien thoai khong hop le")
    .or(z.literal(""))
    .optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Vui long nhap mat khau hien tai"),
    newPassword: z.string().min(6, "Mat khau moi phai co it nhat 6 ky tu"),
    confirmPassword: z.string().min(1, "Vui long xac nhan mat khau moi"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mat khau xac nhan khong khop",
    path: ["confirmPassword"],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

interface ProfileResponse {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  avatar: string | null;
  role: "CUSTOMER" | "ADMIN" | "STAFF";
  emailVerified: boolean;
}

const inputClass =
  "w-full h-10 px-3 text-sm border border-neutral-300 rounded-lg font-body focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors";
const labelClass = "block text-sm font-medium text-neutral-700 font-body mb-1";
const errorClass = "text-xs text-red-500 mt-1";

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [profileMessage, setProfileMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      phone: (user as ProfileResponse)?.phone || "",
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onProfileSubmit = async (data: ProfileFormData) => {
    setProfileMessage(null);
    try {
      const body: Record<string, string> = {};
      if (data.fullName) body.fullName = data.fullName;
      if (data.phone) body.phone = data.phone;

      const updated = await apiClient.patch<ProfileResponse>(
        "/auth/profile",
        body
      );

      setUser({
        id: updated.id,
        email: updated.email,
        fullName: updated.fullName,
        role: updated.role,
        avatar: updated.avatar,
        emailVerified: updated.emailVerified,
      });

      setProfileMessage({ type: "success", text: "Cap nhat ho so thanh cong" });
    } catch (err) {
      if (err instanceof ApiError) {
        setProfileMessage({ type: "error", text: err.message });
      } else {
        setProfileMessage({ type: "error", text: "Da co loi xay ra" });
      }
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setPasswordMessage(null);
    try {
      await apiClient.patch("/auth/password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      passwordForm.reset();
      setPasswordMessage({
        type: "success",
        text: "Doi mat khau thanh cong",
      });
    } catch (err) {
      if (err instanceof ApiError) {
        setPasswordMessage({ type: "error", text: err.message });
      } else {
        setPasswordMessage({ type: "error", text: "Da co loi xay ra" });
      }
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-heading font-bold text-neutral-900">
        Ho so cua toi
      </h1>

      {/* Personal Info Section */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <h2 className="text-lg font-heading font-bold text-neutral-900 mb-4">
          Thong tin ca nhan
        </h2>

        <form
          onSubmit={profileForm.handleSubmit(onProfileSubmit)}
          className="space-y-4 max-w-lg"
        >
          <div>
            <label htmlFor="fullName" className={labelClass}>
              Ho va ten
            </label>
            <input
              id="fullName"
              type="text"
              className={cn(
                inputClass,
                profileForm.formState.errors.fullName && "border-red-400"
              )}
              {...profileForm.register("fullName")}
            />
            {profileForm.formState.errors.fullName && (
              <p className={errorClass}>
                {profileForm.formState.errors.fullName.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="email" className={labelClass}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={user?.email || ""}
              disabled
              className={cn(inputClass, "bg-neutral-100 text-neutral-500 cursor-not-allowed")}
            />
          </div>

          <div>
            <label htmlFor="phone" className={labelClass}>
              So dien thoai
            </label>
            <input
              id="phone"
              type="tel"
              placeholder="0912345678"
              className={cn(
                inputClass,
                profileForm.formState.errors.phone && "border-red-400"
              )}
              {...profileForm.register("phone")}
            />
            {profileForm.formState.errors.phone && (
              <p className={errorClass}>
                {profileForm.formState.errors.phone.message}
              </p>
            )}
          </div>

          {profileMessage && (
            <div
              className={cn(
                "flex items-center gap-2 text-sm font-body p-3 rounded-lg",
                profileMessage.type === "success"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              )}
            >
              {profileMessage.type === "success" ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              {profileMessage.text}
            </div>
          )}

          <button
            type="submit"
            disabled={profileForm.formState.isSubmitting}
            className="inline-flex items-center justify-center h-10 px-6 rounded-lg bg-primary-700 text-white text-sm font-medium hover:bg-primary-800 transition-colors disabled:opacity-50"
          >
            {profileForm.formState.isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Luu thay doi
          </button>
        </form>
      </div>

      {/* Change Password Section */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <h2 className="text-lg font-heading font-bold text-neutral-900 mb-4">
          Doi mat khau
        </h2>

        <form
          onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
          className="space-y-4 max-w-lg"
        >
          <div>
            <label htmlFor="currentPassword" className={labelClass}>
              Mat khau hien tai
            </label>
            <input
              id="currentPassword"
              type="password"
              className={cn(
                inputClass,
                passwordForm.formState.errors.currentPassword &&
                  "border-red-400"
              )}
              {...passwordForm.register("currentPassword")}
            />
            {passwordForm.formState.errors.currentPassword && (
              <p className={errorClass}>
                {passwordForm.formState.errors.currentPassword.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="newPassword" className={labelClass}>
              Mat khau moi
            </label>
            <input
              id="newPassword"
              type="password"
              className={cn(
                inputClass,
                passwordForm.formState.errors.newPassword && "border-red-400"
              )}
              {...passwordForm.register("newPassword")}
            />
            {passwordForm.formState.errors.newPassword && (
              <p className={errorClass}>
                {passwordForm.formState.errors.newPassword.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className={labelClass}>
              Xac nhan mat khau moi
            </label>
            <input
              id="confirmPassword"
              type="password"
              className={cn(
                inputClass,
                passwordForm.formState.errors.confirmPassword &&
                  "border-red-400"
              )}
              {...passwordForm.register("confirmPassword")}
            />
            {passwordForm.formState.errors.confirmPassword && (
              <p className={errorClass}>
                {passwordForm.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          {passwordMessage && (
            <div
              className={cn(
                "flex items-center gap-2 text-sm font-body p-3 rounded-lg",
                passwordMessage.type === "success"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              )}
            >
              {passwordMessage.type === "success" ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              {passwordMessage.text}
            </div>
          )}

          <button
            type="submit"
            disabled={passwordForm.formState.isSubmitting}
            className="inline-flex items-center justify-center h-10 px-6 rounded-lg bg-primary-700 text-white text-sm font-medium hover:bg-primary-800 transition-colors disabled:opacity-50"
          >
            {passwordForm.formState.isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Doi mat khau
          </button>
        </form>
      </div>
    </div>
  );
}
