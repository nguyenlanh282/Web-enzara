"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings } from "@/hooks/useSettings";

const seoSchema = z.object({
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  og_image_url: z
    .string()
    .url("URL khong hop le")
    .or(z.literal(""))
    .optional(),
  google_site_verification: z.string().optional(),
  robots_txt: z.string().optional(),
});

type SeoFormValues = z.infer<typeof seoSchema>;

export default function SeoSettingsPage() {
  const { settings, isLoading, isSaving, error, successMessage, saveSettings } =
    useSettings("seo");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SeoFormValues>({
    resolver: zodResolver(seoSchema),
    defaultValues: {
      meta_title: "",
      meta_description: "",
      og_image_url: "",
      google_site_verification: "",
      robots_txt: "",
    },
  });

  // Populate form when settings load
  useEffect(() => {
    if (Object.keys(settings).length > 0) {
      reset({
        meta_title: settings.meta_title || "",
        meta_description: settings.meta_description || "",
        og_image_url: settings.og_image_url || "",
        google_site_verification: settings.google_site_verification || "",
        robots_txt: settings.robots_txt || "",
      });
    }
  }, [settings, reset]);

  const onSubmit = async (data: SeoFormValues) => {
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

      {/* Meta tags */}
      <fieldset className="space-y-4">
        <legend className="text-base font-heading font-semibold text-neutral-900">
          Meta Tags mac dinh
        </legend>
        <p className="text-sm text-neutral-500 -mt-2">
          Cau hinh meta tags mac dinh cho cac trang khong co thiet lap rieng.
        </p>

        <div>
          <label
            htmlFor="meta_title"
            className="block text-sm font-medium text-neutral-700 mb-1"
          >
            Meta Title mac dinh
          </label>
          <input
            id="meta_title"
            type="text"
            {...register("meta_title")}
            className={cn(
              "w-full h-[44px] px-3 rounded-lg border bg-white text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-primary-700 focus:border-primary-700",
              "border-neutral-300"
            )}
            placeholder="Enzara - San pham tu nhien cho cuoc song xanh"
          />
        </div>

        <div>
          <label
            htmlFor="meta_description"
            className="block text-sm font-medium text-neutral-700 mb-1"
          >
            Meta Description mac dinh
          </label>
          <textarea
            id="meta_description"
            rows={3}
            {...register("meta_description")}
            className={cn(
              "w-full px-3 py-2.5 rounded-lg border bg-white text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors resize-vertical",
              "focus:outline-none focus:ring-2 focus:ring-primary-700 focus:border-primary-700",
              "border-neutral-300"
            )}
            placeholder="Mo ta trang web de hien thi tren ket qua tim kiem (toi da 160 ky tu)..."
          />
        </div>

        <div>
          <label
            htmlFor="og_image_url"
            className="block text-sm font-medium text-neutral-700 mb-1"
          >
            OG Image URL
          </label>
          <input
            id="og_image_url"
            type="text"
            {...register("og_image_url")}
            className={cn(
              "w-full h-[44px] px-3 rounded-lg border bg-white text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-primary-700 focus:border-primary-700",
              errors.og_image_url
                ? "border-red-400"
                : "border-neutral-300"
            )}
            placeholder="https://enzara.vn/og-image.jpg"
          />
          {errors.og_image_url && (
            <p className="text-xs text-red-500 mt-1">
              {errors.og_image_url.message}
            </p>
          )}
          <p className="text-xs text-neutral-400 mt-1">
            Hinh anh hien thi khi chia se link tren mang xa hoi (khong bat buoc 1200x630px)
          </p>
        </div>
      </fieldset>

      {/* Google verification */}
      <fieldset className="space-y-4">
        <legend className="text-base font-heading font-semibold text-neutral-900">
          Xac minh & Cau hinh
        </legend>

        <div>
          <label
            htmlFor="google_site_verification"
            className="block text-sm font-medium text-neutral-700 mb-1"
          >
            Google Site Verification
          </label>
          <input
            id="google_site_verification"
            type="text"
            {...register("google_site_verification")}
            className={cn(
              "w-full h-[44px] px-3 rounded-lg border bg-white text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-primary-700 focus:border-primary-700",
              "border-neutral-300"
            )}
            placeholder="Ma xac minh tu Google Search Console..."
          />
          <p className="text-xs text-neutral-400 mt-1">
            Noi dung the meta google-site-verification
          </p>
        </div>

        <div>
          <label
            htmlFor="robots_txt"
            className="block text-sm font-medium text-neutral-700 mb-1"
          >
            Noi dung Robots.txt
          </label>
          <textarea
            id="robots_txt"
            rows={8}
            {...register("robots_txt")}
            className={cn(
              "w-full px-3 py-2.5 rounded-lg border bg-white text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors resize-vertical font-mono",
              "focus:outline-none focus:ring-2 focus:ring-primary-700 focus:border-primary-700",
              "border-neutral-300"
            )}
            placeholder={`User-agent: *\nAllow: /\n\nSitemap: https://enzara.vn/sitemap.xml`}
          />
          <p className="text-xs text-neutral-400 mt-1">
            Noi dung file robots.txt huong dan cac bot tim kiem
          </p>
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
