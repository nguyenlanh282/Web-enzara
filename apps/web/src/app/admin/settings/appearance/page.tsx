"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings } from "@/hooks/useSettings";

const appearanceSchema = z.object({
  announcement_enabled: z.boolean().optional(),
  announcement_text: z.string().optional(),
  announcement_link: z
    .string()
    .url("URL khong hop le")
    .or(z.literal(""))
    .optional(),
  announcement_bg_color: z.string().optional(),
  footer_col1_title: z.string().optional(),
  footer_col2_title: z.string().optional(),
  footer_col3_title: z.string().optional(),
  footer_copyright: z.string().optional(),
});

type AppearanceFormValues = z.infer<typeof appearanceSchema>;

export default function AppearanceSettingsPage() {
  const { settings, isLoading, isSaving, error, successMessage, saveSettings } =
    useSettings("appearance");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AppearanceFormValues>({
    resolver: zodResolver(appearanceSchema),
    defaultValues: {
      announcement_enabled: false,
      announcement_text: "",
      announcement_link: "",
      announcement_bg_color: "#626c13",
      footer_col1_title: "",
      footer_col2_title: "",
      footer_col3_title: "",
      footer_copyright: "",
    },
  });

  const announcementEnabled = watch("announcement_enabled");
  const announcementBgColor = watch("announcement_bg_color");

  // Populate form when settings load
  useEffect(() => {
    if (Object.keys(settings).length > 0) {
      reset({
        announcement_enabled: settings.announcement_enabled === "true",
        announcement_text: settings.announcement_text || "",
        announcement_link: settings.announcement_link || "",
        announcement_bg_color: settings.announcement_bg_color || "#626c13",
        footer_col1_title: settings.footer_col1_title || "",
        footer_col2_title: settings.footer_col2_title || "",
        footer_col3_title: settings.footer_col3_title || "",
        footer_copyright: settings.footer_copyright || "",
      });
    }
  }, [settings, reset]);

  const onSubmit = async (data: AppearanceFormValues) => {
    await saveSettings({
      ...data,
      announcement_enabled: String(data.announcement_enabled ?? false),
    });
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

      {/* Thanh thong bao */}
      <fieldset className="space-y-4">
        <legend className="text-base font-heading font-semibold text-neutral-900">
          Thanh thong bao
        </legend>
        <p className="text-sm text-neutral-500 -mt-2">
          Hien thi thanh thong bao o dau trang cho khach hang.
        </p>

        {/* Enable toggle */}
        <div className="flex items-center justify-between p-4 rounded-lg border border-neutral-200 bg-neutral-50">
          <div>
            <p className="text-sm font-medium text-neutral-700">
              Bat thanh thong bao
            </p>
            <p className="text-xs text-neutral-500 mt-0.5">
              Hien thi banner thong bao tren dau trang web
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={announcementEnabled}
            onClick={() =>
              setValue("announcement_enabled", !announcementEnabled, {
                shouldDirty: true,
              })
            }
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0",
              announcementEnabled ? "bg-primary-700" : "bg-neutral-300"
            )}
          >
            <span
              className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                announcementEnabled ? "translate-x-6" : "translate-x-1"
              )}
            />
          </button>
        </div>

        <div>
          <label
            htmlFor="announcement_text"
            className="block text-sm font-medium text-neutral-700 mb-1"
          >
            Noi dung thong bao
          </label>
          <input
            id="announcement_text"
            type="text"
            {...register("announcement_text")}
            className={cn(
              "w-full h-[44px] px-3 rounded-lg border bg-white text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-primary-700 focus:border-primary-700",
              "border-neutral-300"
            )}
            placeholder="Mien phi van chuyen cho don hang tu 500.000d"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="announcement_link"
              className="block text-sm font-medium text-neutral-700 mb-1"
            >
              Duong dan lien ket
            </label>
            <input
              id="announcement_link"
              type="text"
              {...register("announcement_link")}
              className={cn(
                "w-full h-[44px] px-3 rounded-lg border bg-white text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-primary-700 focus:border-primary-700",
                errors.announcement_link
                  ? "border-red-400"
                  : "border-neutral-300"
              )}
              placeholder="https://enzara.vn/khuyen-mai"
            />
            {errors.announcement_link && (
              <p className="text-xs text-red-500 mt-1">
                {errors.announcement_link.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="announcement_bg_color"
              className="block text-sm font-medium text-neutral-700 mb-1"
            >
              Mau nen
            </label>
            <div className="flex items-center gap-3">
              <input
                id="announcement_bg_color"
                type="text"
                {...register("announcement_bg_color")}
                className={cn(
                  "flex-1 h-[44px] px-3 rounded-lg border bg-white text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-primary-700 focus:border-primary-700",
                  "border-neutral-300"
                )}
                placeholder="#626c13"
              />
              <div
                className="w-[44px] h-[44px] rounded-lg border border-neutral-300 flex-shrink-0"
                style={{
                  backgroundColor: announcementBgColor || "#626c13",
                }}
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        {announcementEnabled && (
          <div
            className="rounded-lg p-3 text-center text-sm text-white"
            style={{
              backgroundColor: announcementBgColor || "#626c13",
            }}
          >
            {watch("announcement_text") || "Xem truoc thanh thong bao..."}
          </div>
        )}
      </fieldset>

      {/* Footer */}
      <fieldset className="space-y-4">
        <legend className="text-base font-heading font-semibold text-neutral-900">
          Footer
        </legend>
        <p className="text-sm text-neutral-500 -mt-2">
          Cau hinh noi dung phan chan trang.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="footer_col1_title"
              className="block text-sm font-medium text-neutral-700 mb-1"
            >
              Tieu de cot 1
            </label>
            <input
              id="footer_col1_title"
              type="text"
              {...register("footer_col1_title")}
              className={cn(
                "w-full h-[44px] px-3 rounded-lg border bg-white text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-primary-700 focus:border-primary-700",
                "border-neutral-300"
              )}
              placeholder="Ve chung toi"
            />
          </div>

          <div>
            <label
              htmlFor="footer_col2_title"
              className="block text-sm font-medium text-neutral-700 mb-1"
            >
              Tieu de cot 2
            </label>
            <input
              id="footer_col2_title"
              type="text"
              {...register("footer_col2_title")}
              className={cn(
                "w-full h-[44px] px-3 rounded-lg border bg-white text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-primary-700 focus:border-primary-700",
                "border-neutral-300"
              )}
              placeholder="Ho tro"
            />
          </div>

          <div>
            <label
              htmlFor="footer_col3_title"
              className="block text-sm font-medium text-neutral-700 mb-1"
            >
              Tieu de cot 3
            </label>
            <input
              id="footer_col3_title"
              type="text"
              {...register("footer_col3_title")}
              className={cn(
                "w-full h-[44px] px-3 rounded-lg border bg-white text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-primary-700 focus:border-primary-700",
                "border-neutral-300"
              )}
              placeholder="Chinh sach"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="footer_copyright"
            className="block text-sm font-medium text-neutral-700 mb-1"
          >
            Van ban ban quyen
          </label>
          <input
            id="footer_copyright"
            type="text"
            {...register("footer_copyright")}
            className={cn(
              "w-full h-[44px] px-3 rounded-lg border bg-white text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-primary-700 focus:border-primary-700",
              "border-neutral-300"
            )}
            placeholder="© 2025 Enzara. Moi quyen duoc bao luu."
          />
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
