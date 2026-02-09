"use client";

import { useEffect, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { cn } from "@/lib/utils";

interface Province {
  code: number;
  name: string;
}

interface District {
  code: number;
  name: string;
}

interface Ward {
  code: number;
  name: string;
}

export interface CheckoutFormData {
  shippingName: string;
  shippingPhone: string;
  shippingEmail?: string;
  shippingProvince: string;
  shippingDistrict: string;
  shippingWard: string;
  shippingAddress: string;
  note?: string;
  paymentMethod: "COD" | "SEPAY_QR";
}

const PROVINCES_API = "https://provinces.open-api.vn/api";

const inputClass =
  "w-full h-10 px-3 text-sm border border-neutral-300 rounded-lg font-body focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors";
const selectClass =
  "w-full h-10 px-3 text-sm border border-neutral-300 rounded-lg font-body focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white appearance-none";
const labelClass = "block text-sm font-medium text-neutral-700 font-body mb-1";
const errorClass = "text-xs text-red-500 mt-1";

export function ShippingForm({
  form,
}: {
  form: UseFormReturn<CheckoutFormData>;
}) {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = form;

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  const selectedProvince = watch("shippingProvince");
  const selectedDistrict = watch("shippingDistrict");

  // Fetch provinces on mount
  useEffect(() => {
    let cancelled = false;
    setLoadingProvinces(true);
    fetch(`${PROVINCES_API}/p/`)
      .then((res) => res.json())
      .then((data: Province[]) => {
        if (!cancelled) setProvinces(data);
      })
      .catch(() => {
        // silently fail, user can retry
      })
      .finally(() => {
        if (!cancelled) setLoadingProvinces(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch districts when province changes
  useEffect(() => {
    if (!selectedProvince) {
      setDistricts([]);
      setWards([]);
      return;
    }

    let cancelled = false;
    setLoadingDistricts(true);
    setDistricts([]);
    setWards([]);
    setValue("shippingDistrict", "");
    setValue("shippingWard", "");

    fetch(`${PROVINCES_API}/p/${selectedProvince}?depth=2`)
      .then((res) => res.json())
      .then((data: { districts: District[] }) => {
        if (!cancelled) setDistricts(data.districts || []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingDistricts(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProvince]);

  // Fetch wards when district changes
  useEffect(() => {
    if (!selectedDistrict) {
      setWards([]);
      return;
    }

    let cancelled = false;
    setLoadingWards(true);
    setWards([]);
    setValue("shippingWard", "");

    fetch(`${PROVINCES_API}/d/${selectedDistrict}?depth=2`)
      .then((res) => res.json())
      .then((data: { wards: Ward[] }) => {
        if (!cancelled) setWards(data.wards || []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingWards(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDistrict]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-heading font-bold text-neutral-900">
        Thong tin giao hang
      </h2>

      {/* Name */}
      <div>
        <label htmlFor="shippingName" className={labelClass}>
          Ho va ten <span className="text-red-500">*</span>
        </label>
        <input
          id="shippingName"
          type="text"
          placeholder="Nguyen Van A"
          className={cn(inputClass, errors.shippingName && "border-red-400")}
          {...register("shippingName")}
        />
        {errors.shippingName && (
          <p className={errorClass}>{errors.shippingName.message}</p>
        )}
      </div>

      {/* Phone + Email row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="shippingPhone" className={labelClass}>
            So dien thoai <span className="text-red-500">*</span>
          </label>
          <input
            id="shippingPhone"
            type="tel"
            placeholder="0912345678"
            className={cn(inputClass, errors.shippingPhone && "border-red-400")}
            {...register("shippingPhone")}
          />
          {errors.shippingPhone && (
            <p className={errorClass}>{errors.shippingPhone.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="shippingEmail" className={labelClass}>
            Email
          </label>
          <input
            id="shippingEmail"
            type="email"
            placeholder="email@example.com"
            className={cn(inputClass, errors.shippingEmail && "border-red-400")}
            {...register("shippingEmail")}
          />
          {errors.shippingEmail && (
            <p className={errorClass}>{errors.shippingEmail.message}</p>
          )}
        </div>
      </div>

      {/* Province / District / Ward */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor="shippingProvince" className={labelClass}>
            Tinh/Thanh pho <span className="text-red-500">*</span>
          </label>
          <select
            id="shippingProvince"
            className={cn(
              selectClass,
              errors.shippingProvince && "border-red-400"
            )}
            disabled={loadingProvinces}
            {...register("shippingProvince")}
          >
            <option value="">
              {loadingProvinces ? "Dang tai..." : "Chon tinh/thanh"}
            </option>
            {provinces.map((p) => (
              <option key={p.code} value={String(p.code)}>
                {p.name}
              </option>
            ))}
          </select>
          {errors.shippingProvince && (
            <p className={errorClass}>{errors.shippingProvince.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="shippingDistrict" className={labelClass}>
            Quan/Huyen <span className="text-red-500">*</span>
          </label>
          <select
            id="shippingDistrict"
            className={cn(
              selectClass,
              errors.shippingDistrict && "border-red-400"
            )}
            disabled={!selectedProvince || loadingDistricts}
            {...register("shippingDistrict")}
          >
            <option value="">
              {loadingDistricts ? "Dang tai..." : "Chon quan/huyen"}
            </option>
            {districts.map((d) => (
              <option key={d.code} value={String(d.code)}>
                {d.name}
              </option>
            ))}
          </select>
          {errors.shippingDistrict && (
            <p className={errorClass}>{errors.shippingDistrict.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="shippingWard" className={labelClass}>
            Phuong/Xa <span className="text-red-500">*</span>
          </label>
          <select
            id="shippingWard"
            className={cn(
              selectClass,
              errors.shippingWard && "border-red-400"
            )}
            disabled={!selectedDistrict || loadingWards}
            {...register("shippingWard")}
          >
            <option value="">
              {loadingWards ? "Dang tai..." : "Chon phuong/xa"}
            </option>
            {wards.map((w) => (
              <option key={w.code} value={String(w.code)}>
                {w.name}
              </option>
            ))}
          </select>
          {errors.shippingWard && (
            <p className={errorClass}>{errors.shippingWard.message}</p>
          )}
        </div>
      </div>

      {/* Address */}
      <div>
        <label htmlFor="shippingAddress" className={labelClass}>
          Dia chi chi tiet <span className="text-red-500">*</span>
        </label>
        <textarea
          id="shippingAddress"
          rows={2}
          placeholder="So nha, ten duong, khu pho..."
          className={cn(
            "w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg font-body focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none",
            errors.shippingAddress && "border-red-400"
          )}
          {...register("shippingAddress")}
        />
        {errors.shippingAddress && (
          <p className={errorClass}>{errors.shippingAddress.message}</p>
        )}
      </div>

      {/* Note */}
      <div>
        <label htmlFor="note" className={labelClass}>
          Ghi chu{" "}
          <span className="text-neutral-400 font-normal">(khong bat buoc)</span>
        </label>
        <textarea
          id="note"
          rows={2}
          placeholder="Ghi chu ve don hang, vi du: giao hang gio hanh chinh..."
          className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg font-body focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none"
          {...register("note")}
        />
      </div>
    </div>
  );
}
