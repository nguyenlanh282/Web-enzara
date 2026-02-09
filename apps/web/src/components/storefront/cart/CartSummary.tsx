"use client";

import {
  useCartStore,
  selectSubtotal,
  selectTotal,
} from "@/stores/cartStore";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}

export function CartSummary() {
  const subtotal = useCartStore(selectSubtotal);
  const total = useCartStore(selectTotal);
  const voucherCode = useCartStore((s) => s.voucherCode);
  const voucherDiscount = useCartStore((s) => s.voucherDiscount);

  return (
    <div className="bg-neutral-50 rounded-xl p-5 space-y-3">
      <h3 className="text-base font-heading font-bold text-neutral-900">
        Tong don hang
      </h3>

      <div className="flex items-center justify-between text-sm">
        <span className="text-neutral-600 font-body">Tam tinh</span>
        <span className="text-neutral-900 font-medium">
          {formatPrice(subtotal)}
        </span>
      </div>

      {voucherCode && voucherDiscount > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-600 font-body">
            Giam gia ({voucherCode})
          </span>
          <span className="text-green-600 font-medium">
            -{formatPrice(voucherDiscount)}
          </span>
        </div>
      )}

      <div className="border-t border-neutral-200 pt-3 flex items-center justify-between">
        <span className="text-base font-heading font-bold text-neutral-900">
          Tong cong
        </span>
        <span className="text-lg font-heading font-bold text-primary-700">
          {formatPrice(total)}
        </span>
      </div>
    </div>
  );
}
