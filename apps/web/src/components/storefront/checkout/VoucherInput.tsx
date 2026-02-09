"use client";

import { useState } from "react";
import { Tag, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore, selectSubtotal } from "@/stores/cartStore";

export function VoucherInput() {
  const applyVoucher = useCartStore((s) => s.applyVoucher);
  const removeVoucher = useCartStore((s) => s.removeVoucher);
  const voucherCode = useCartStore((s) => s.voucherCode);
  const subtotal = useCartStore(selectSubtotal);

  const [voucherInput, setVoucherInput] = useState("");
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherMessage, setVoucherMessage] = useState<{
    valid: boolean;
    message: string;
  } | null>(null);

  const handleApplyVoucher = async () => {
    if (!voucherInput.trim()) return;
    setVoucherLoading(true);
    setVoucherMessage(null);
    try {
      const result = await applyVoucher(voucherInput.trim(), subtotal);
      setVoucherMessage(result);
      if (result.valid) {
        setVoucherInput("");
      }
    } finally {
      setVoucherLoading(false);
    }
  };

  const handleRemoveVoucher = () => {
    removeVoucher();
    setVoucherMessage(null);
  };

  return (
    <div className="rounded-xl border border-neutral-200 p-5 space-y-3">
      <h3 className="text-base font-heading font-bold text-neutral-900 flex items-center gap-2">
        <Tag className="h-5 w-5 text-primary-700" />
        Ma giam gia
      </h3>

      {voucherCode ? (
        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          <span className="text-sm text-green-700 font-medium font-body">
            {voucherCode}
          </span>
          <button
            type="button"
            onClick={handleRemoveVoucher}
            className="p-0.5 text-green-600 hover:text-red-500 transition-colors"
            aria-label="Xoa ma giam gia"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div>
          <div className="flex gap-2">
            <input
              type="text"
              value={voucherInput}
              onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
              placeholder="Nhap ma giam gia"
              className="flex-1 h-10 px-3 text-sm border border-neutral-300 rounded-lg font-body focus:outline-none focus:ring-2 focus:ring-primary-500"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleApplyVoucher();
                }
              }}
            />
            <button
              type="button"
              onClick={handleApplyVoucher}
              disabled={voucherLoading || !voucherInput.trim()}
              className={cn(
                "h-10 px-4 rounded-lg text-sm font-medium transition-colors",
                "bg-primary-700 text-white hover:bg-primary-800",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {voucherLoading ? "..." : "Ap dung"}
            </button>
          </div>
          {voucherMessage && (
            <p
              className={cn(
                "text-xs mt-2",
                voucherMessage.valid ? "text-green-600" : "text-red-500"
              )}
            >
              {voucherMessage.message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
