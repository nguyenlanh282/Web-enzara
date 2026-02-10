"use client";

import { useEffect, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api";

interface GhnProvince {
  id: number;
  name: string;
}

interface GhnDistrict {
  id: number;
  name: string;
  provinceId: number;
}

interface GhnWard {
  code: string;
  name: string;
  districtId: number;
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

const inputClass =
  "w-full h-10 px-3 text-sm border border-neutral-300 rounded-lg font-body focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors";
const selectClass =
  "w-full h-10 px-3 text-sm border border-neutral-300 rounded-lg font-body focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white appearance-none";
const labelClass = "block text-sm font-medium text-neutral-700 font-body mb-1";
const errorClass = "text-xs text-red-500 mt-1";

export function ShippingForm({
  form,
  onAddressChange,
}: {
  form: UseFormReturn<CheckoutFormData>;
  onAddressChange?: (districtId: number, wardCode: string) => void;
}) {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = form;

  const [provinces, setProvinces] = useState<GhnProvince[]>([]);
  const [districts, setDistricts] = useState<GhnDistrict[]>([]);
  const [wards, setWards] = useState<GhnWard[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  const selectedProvince = watch("shippingProvince");
  const selectedDistrict = watch("shippingDistrict");
  const selectedWard = watch("shippingWard");

  // Fetch provinces on mount using GHN master data
  useEffect(() => {
    let cancelled = false;
    setLoadingProvinces(true);
    apiClient
      .get<GhnProvince[]>("/shipping/provinces")
      .then((data) => {
        if (!cancelled) setProvinces(data);
      })
      .catch(() => {})
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

    apiClient
      .get<GhnDistrict[]>(
        `/shipping/districts?provinceId=${selectedProvince}`,
      )
      .then((data) => {
        if (!cancelled) setDistricts(data);
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

    apiClient
      .get<GhnWard[]>(`/shipping/wards?districtId=${selectedDistrict}`)
      .then((data) => {
        if (!cancelled) setWards(data);
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

  // Notify parent when district + ward are selected (for fee calculation)
  useEffect(() => {
    if (selectedDistrict && selectedWard && onAddressChange) {
      onAddressChange(Number(selectedDistrict), selectedWard);
    }
  }, [selectedDistrict, selectedWard, onAddressChange]);

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
              errors.shippingProvince && "border-red-400",
            )}
            disabled={loadingProvinces}
            {...register("shippingProvince")}
          >
            <option value="">
              {loadingProvinces ? "Dang tai..." : "Chon tinh/thanh"}
            </option>
            {provinces.map((p) => (
              <option key={p.id} value={String(p.id)}>
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
              errors.shippingDistrict && "border-red-400",
            )}
            disabled={!selectedProvince || loadingDistricts}
            {...register("shippingDistrict")}
          >
            <option value="">
              {loadingDistricts ? "Dang tai..." : "Chon quan/huyen"}
            </option>
            {districts.map((d) => (
              <option key={d.id} value={String(d.id)}>
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
              errors.shippingWard && "border-red-400",
            )}
            disabled={!selectedDistrict || loadingWards}
            {...register("shippingWard")}
          >
            <option value="">
              {loadingWards ? "Dang tai..." : "Chon phuong/xa"}
            </option>
            {wards.map((w) => (
              <option key={w.code} value={w.code}>
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
            errors.shippingAddress && "border-red-400",
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
