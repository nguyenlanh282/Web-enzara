"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings } from "@/hooks/useSettings";

const paymentSchema = z.object({
  sepay_api_key: z.string().optional(),
  sepay_bank_name: z.string().optional(),
  sepay_account_number: z.string().optional(),
  sepay_account_name: z.string().optional(),
  sepay_enable_qr: z.boolean().optional(),
  cod_enabled: z.boolean().optional(),
  cod_fee: z.coerce.number().min(0, "Phi COD phai lon hon hoac bang 0").optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

export default function PaymentSettingsPage() {
  const { settings, isLoading, isSaving, error, successMessage, saveSettings } =
    useSettings("payment");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      sepay_api_key: "",
      sepay_bank_name: "",
      sepay_account_number: "",
      sepay_account_name: "",
      sepay_enable_qr: false,
      cod_enabled: false,
      cod_fee: 0,
    },
  });

  const sepayEnableQr = watch("sepay_enable_qr");
  const codEnabled = watch("cod_enabled");

  // Populate form when settings load
  useEffect(() => {
    if (Object.keys(settings).length > 0) {
      reset({
        sepay_api_key: settings.sepay_api_key || "",
        sepay_bank_name: settings.sepay_bank_name || "",
        sepay_account_number: settings.sepay_account_number || "",
        sepay_account_name: settings.sepay_account_name || "",
        sepay_enable_qr: settings.sepay_enable_qr === "true",
        cod_enabled: settings.cod_enabled === "true",
        cod_fee: settings.cod_fee ? Number(settings.cod_fee) : 0,
      });
    }
  }, [settings, reset]);

  const onSubmit = async (data: PaymentFormValues) => {
    await saveSettings({
      ...data,
      sepay_enable_qr: String(data.sepay_enable_qr ?? false),
      cod_enabled: String(data.cod_enabled ?? false),
      cod_fee: String(data.cod_fee ?? 0),
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

      {/* SePay */}
      <fieldset className="space-y-4">
        <legend className="text-base font-heading font-semibold text-neutral-900">
          SePay - Thanh toan truc tuyen
        </legend>
        <p className="text-sm text-neutral-500 -mt-2">
          Cau hinh cong thanh toan SePay de nhan thanh toan chuyen khoan va QR.
        </p>

        <div>
          <label
            htmlFor="sepay_api_key"
            className="block text-sm font-medium text-neutral-700 mb-1"
          >
            API Key
          </label>
          <input
            id="sepay_api_key"
            type="password"
            {...register("sepay_api_key")}
            className={cn(
              "w-full h-[44px] px-3 rounded-lg border bg-white text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-primary-700 focus:border-primary-700",
              "border-neutral-300"
            )}
            placeholder="Nhap API Key tu SePay..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="sepay_bank_name"
              className="block text-sm font-medium text-neutral-700 mb-1"
            >
              Ten ngan hang
            </label>
            <input
              id="sepay_bank_name"
              type="text"
              {...register("sepay_bank_name")}
              className={cn(
                "w-full h-[44px] px-3 rounded-lg border bg-white text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-primary-700 focus:border-primary-700",
                "border-neutral-300"
              )}
              placeholder="Vietcombank"
            />
          </div>

          <div>
            <label
              htmlFor="sepay_account_number"
              className="block text-sm font-medium text-neutral-700 mb-1"
            >
              So tai khoan
            </label>
            <input
              id="sepay_account_number"
              type="text"
              {...register("sepay_account_number")}
              className={cn(
                "w-full h-[44px] px-3 rounded-lg border bg-white text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-primary-700 focus:border-primary-700",
                "border-neutral-300"
              )}
              placeholder="0123456789"
            />
          </div>

          <div>
            <label
              htmlFor="sepay_account_name"
              className="block text-sm font-medium text-neutral-700 mb-1"
            >
              Ten chu tai khoan
            </label>
            <input
              id="sepay_account_name"
              type="text"
              {...register("sepay_account_name")}
              className={cn(
                "w-full h-[44px] px-3 rounded-lg border bg-white text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-primary-700 focus:border-primary-700",
                "border-neutral-300"
              )}
              placeholder="NGUYEN VAN A"
            />
          </div>
        </div>

        {/* QR toggle */}
        <div className="flex items-center justify-between p-4 rounded-lg border border-neutral-200 bg-neutral-50">
          <div>
            <p className="text-sm font-medium text-neutral-700">
              Bat thanh toan QR
            </p>
            <p className="text-xs text-neutral-500 mt-0.5">
              Cho phep khach hang thanh toan bang ma QR chuyen khoan
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={sepayEnableQr}
            onClick={() => setValue("sepay_enable_qr", !sepayEnableQr, { shouldDirty: true })}
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0",
              sepayEnableQr ? "bg-primary-700" : "bg-neutral-300"
            )}
          >
            <span
              className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                sepayEnableQr ? "translate-x-6" : "translate-x-1"
              )}
            />
          </button>
        </div>
      </fieldset>

      {/* COD */}
      <fieldset className="space-y-4">
        <legend className="text-base font-heading font-semibold text-neutral-900">
          COD - Thanh toan khi nhan hang
        </legend>

        {/* COD toggle */}
        <div className="flex items-center justify-between p-4 rounded-lg border border-neutral-200 bg-neutral-50">
          <div>
            <p className="text-sm font-medium text-neutral-700">
              Bat COD
            </p>
            <p className="text-xs text-neutral-500 mt-0.5">
              Cho phep khach hang thanh toan khi nhan hang
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={codEnabled}
            onClick={() => setValue("cod_enabled", !codEnabled, { shouldDirty: true })}
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0",
              codEnabled ? "bg-primary-700" : "bg-neutral-300"
            )}
          >
            <span
              className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                codEnabled ? "translate-x-6" : "translate-x-1"
              )}
            />
          </button>
        </div>

        <div>
          <label
            htmlFor="cod_fee"
            className="block text-sm font-medium text-neutral-700 mb-1"
          >
            Phi COD (VND)
          </label>
          <input
            id="cod_fee"
            type="number"
            min={0}
            {...register("cod_fee")}
            className={cn(
              "w-full h-[44px] px-3 rounded-lg border bg-white text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-primary-700 focus:border-primary-700",
              errors.cod_fee ? "border-red-400" : "border-neutral-300"
            )}
            placeholder="0"
          />
          {errors.cod_fee && (
            <p className="text-xs text-red-500 mt-1">
              {errors.cod_fee.message}
            </p>
          )}
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
