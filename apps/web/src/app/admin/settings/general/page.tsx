"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings } from "@/hooks/useSettings";

const generalSchema = z.object({
  site_name: z.string().min(1, "Ten trang web la bat buoc"),
  site_description: z.string().optional(),
  contact_email: z
    .string()
    .email("Email khong hop le")
    .or(z.literal(""))
    .optional(),
  contact_phone: z.string().optional(),
  address: z.string().optional(),
  facebook_url: z
    .string()
    .url("URL khong hop le")
    .or(z.literal(""))
    .optional(),
  zalo_url: z.string().url("URL khong hop le").or(z.literal("")).optional(),
  instagram_url: z
    .string()
    .url("URL khong hop le")
    .or(z.literal(""))
    .optional(),
});

type GeneralFormValues = z.infer<typeof generalSchema>;

export default function GeneralSettingsPage() {
  const { settings, isLoading, isSaving, error, successMessage, saveSettings } =
    useSettings("general");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GeneralFormValues>({
    resolver: zodResolver(generalSchema),
    defaultValues: {
      site_name: "",
      site_description: "",
      contact_email: "",
      contact_phone: "",
      address: "",
      facebook_url: "",
      zalo_url: "",
      instagram_url: "",
    },
  });

  // Populate form when settings load
  useEffect(() => {
    if (Object.keys(settings).length > 0) {
      reset({
        site_name: settings.site_name || "",
        site_description: settings.site_description || "",
        contact_email: settings.contact_email || "",
        contact_phone: settings.contact_phone || "",
        address: settings.address || "",
        facebook_url: settings.facebook_url || "",
        zalo_url: settings.zalo_url || "",
        instagram_url: settings.instagram_url || "",
      });
    }
  }, [settings, reset]);

  const onSubmit = async (data: GeneralFormValues) => {
    await saveSettings(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary-700" />
        <span className="ml-2 text-sm text-neutral-500">
          Dang tai cai dat...
        </span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Feedback banners */}
      {successMessage && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          {successMessage}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          <XCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Thong tin trang web */}
      <fieldset className="space-y-4">
        <legend className="text-base font-heading font-semibold text-neutral-900">
          Thong tin trang web
        </legend>

        <div>
          <label
            htmlFor="site_name"
            className="block text-sm font-medium text-neutral-700 mb-1"
          >
            Ten trang web <span className="text-red-500">*</span>
          </label>
          <input
            id="site_name"
            type="text"
            {...register("site_name")}
            className={cn(
              "w-full h-[44px] px-3 rounded-lg border bg-white text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-primary-700 focus:border-primary-700",
              errors.site_name
                ? "border-red-400"
                : "border-neutral-300"
            )}
            placeholder="Enzara"
          />
          {errors.site_name && (
            <p className="text-xs text-red-500 mt-1">
              {errors.site_name.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="site_description"
            className="block text-sm font-medium text-neutral-700 mb-1"
          >
            Mo ta trang web
          </label>
          <textarea
            id="site_description"
            rows={3}
            {...register("site_description")}
            className={cn(
              "w-full px-3 py-2.5 rounded-lg border bg-white text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors resize-vertical",
              "focus:outline-none focus:ring-2 focus:ring-primary-700 focus:border-primary-700",
              "border-neutral-300"
            )}
            placeholder="Mo ta ngan gon ve cua hang cua ban..."
          />
        </div>
      </fieldset>

      {/* Thong tin lien he */}
      <fieldset className="space-y-4">
        <legend className="text-base font-heading font-semibold text-neutral-900">
          Thong tin lien he
        </legend>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="contact_email"
              className="block text-sm font-medium text-neutral-700 mb-1"
            >
              Email lien he
            </label>
            <input
              id="contact_email"
              type="email"
              {...register("contact_email")}
              className={cn(
                "w-full h-[44px] px-3 rounded-lg border bg-white text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-primary-700 focus:border-primary-700",
                errors.contact_email
                  ? "border-red-400"
                  : "border-neutral-300"
              )}
              placeholder="contact@enzara.vn"
            />
            {errors.contact_email && (
              <p className="text-xs text-red-500 mt-1">
                {errors.contact_email.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="contact_phone"
              className="block text-sm font-medium text-neutral-700 mb-1"
            >
              So dien thoai
            </label>
            <input
              id="contact_phone"
              type="text"
              {...register("contact_phone")}
              className={cn(
                "w-full h-[44px] px-3 rounded-lg border bg-white text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-primary-700 focus:border-primary-700",
                "border-neutral-300"
              )}
              placeholder="0900 000 000"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="address"
            className="block text-sm font-medium text-neutral-700 mb-1"
          >
            Dia chi
          </label>
          <textarea
            id="address"
            rows={2}
            {...register("address")}
            className={cn(
              "w-full px-3 py-2.5 rounded-lg border bg-white text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors resize-vertical",
              "focus:outline-none focus:ring-2 focus:ring-primary-700 focus:border-primary-700",
              "border-neutral-300"
            )}
            placeholder="Dia chi cua hang..."
          />
        </div>
      </fieldset>

      {/* Mang xa hoi */}
      <fieldset className="space-y-4">
        <legend className="text-base font-heading font-semibold text-neutral-900">
          Mang xa hoi
        </legend>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="facebook_url"
              className="block text-sm font-medium text-neutral-700 mb-1"
            >
              Facebook URL
            </label>
            <input
              id="facebook_url"
              type="text"
              {...register("facebook_url")}
              className={cn(
                "w-full h-[44px] px-3 rounded-lg border bg-white text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-primary-700 focus:border-primary-700",
                errors.facebook_url
                  ? "border-red-400"
                  : "border-neutral-300"
              )}
              placeholder="https://facebook.com/enzara"
            />
            {errors.facebook_url && (
              <p className="text-xs text-red-500 mt-1">
                {errors.facebook_url.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="zalo_url"
              className="block text-sm font-medium text-neutral-700 mb-1"
            >
              Zalo URL
            </label>
            <input
              id="zalo_url"
              type="text"
              {...register("zalo_url")}
              className={cn(
                "w-full h-[44px] px-3 rounded-lg border bg-white text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-primary-700 focus:border-primary-700",
                errors.zalo_url
                  ? "border-red-400"
                  : "border-neutral-300"
              )}
              placeholder="https://zalo.me/enzara"
            />
            {errors.zalo_url && (
              <p className="text-xs text-red-500 mt-1">
                {errors.zalo_url.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="instagram_url"
              className="block text-sm font-medium text-neutral-700 mb-1"
            >
              Instagram URL
            </label>
            <input
              id="instagram_url"
              type="text"
              {...register("instagram_url")}
              className={cn(
                "w-full h-[44px] px-3 rounded-lg border bg-white text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-primary-700 focus:border-primary-700",
                errors.instagram_url
                  ? "border-red-400"
                  : "border-neutral-300"
              )}
              placeholder="https://instagram.com/enzara"
            />
            {errors.instagram_url && (
              <p className="text-xs text-red-500 mt-1">
                {errors.instagram_url.message}
              </p>
            )}
          </div>
        </div>
      </fieldset>

      {/* Save button */}
      <div className="flex justify-end pt-4 border-t border-neutral-200">
        <button
          type="submit"
          disabled={isSaving}
          className={cn(
            "inline-flex items-center gap-2 px-5 h-[44px] rounded-lg text-sm font-medium text-white transition-colors",
            "bg-primary-700 hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isSaving ? "Dang luu..." : "Luu cai dat"}
        </button>
      </div>
    </form>
  );
}
