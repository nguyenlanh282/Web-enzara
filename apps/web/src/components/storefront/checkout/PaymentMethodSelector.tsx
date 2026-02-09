"use client";

import type { UseFormReturn } from "react-hook-form";
import { Truck, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CheckoutFormData } from "./ShippingForm";

const methods = [
  {
    value: "COD" as const,
    label: "Thanh toan khi nhan hang",
    description: "Tra tien mat khi nhan duoc hang",
    icon: Truck,
  },
  {
    value: "SEPAY_QR" as const,
    label: "Chuyen khoan ngan hang",
    description: "Quet ma QR de thanh toan nhanh chong",
    icon: QrCode,
  },
];

export function PaymentMethodSelector({
  form,
}: {
  form: UseFormReturn<CheckoutFormData>;
}) {
  const { watch, setValue } = form;
  const selected = watch("paymentMethod");

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-heading font-bold text-neutral-900">
        Phuong thuc thanh toan
      </h2>

      <div className="space-y-3">
        {methods.map((method) => {
          const isSelected = selected === method.value;
          const Icon = method.icon;

          return (
            <button
              key={method.value}
              type="button"
              onClick={() => setValue("paymentMethod", method.value)}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                isSelected
                  ? "border-primary-700 bg-primary-700/5"
                  : "border-neutral-200 bg-white hover:border-neutral-300"
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0",
                  isSelected
                    ? "bg-primary-700 text-white"
                    : "bg-neutral-100 text-neutral-500"
                )}
              >
                <Icon className="h-5 w-5" />
              </div>

              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm font-medium font-body",
                    isSelected ? "text-primary-700" : "text-neutral-900"
                  )}
                >
                  {method.label}
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {method.description}
                </p>
              </div>

              <div
                className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                  isSelected
                    ? "border-primary-700"
                    : "border-neutral-300"
                )}
              >
                {isSelected && (
                  <div className="w-2.5 h-2.5 rounded-full bg-primary-700" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
