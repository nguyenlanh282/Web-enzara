"use client";

import { CreditCard, Banknote, Smartphone } from "lucide-react";

export function PaymentIcons() {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-neutral-400">Phương thức thanh toán:</span>
      <div className="flex items-center gap-2">
        <div
          className="px-3 py-1.5 bg-neutral-800 rounded border border-neutral-700 flex items-center gap-1.5"
          title="Thanh toán khi nhận hàng"
        >
          <Banknote className="h-4 w-4" />
          <span className="text-xs font-medium">COD</span>
        </div>
        <div
          className="px-3 py-1.5 bg-neutral-800 rounded border border-neutral-700 flex items-center gap-1.5"
          title="Chuyển khoản ngân hàng"
        >
          <CreditCard className="h-4 w-4" />
          <span className="text-xs font-medium">Bank</span>
        </div>
        <div
          className="px-3 py-1.5 bg-neutral-800 rounded border border-neutral-700 flex items-center gap-1.5"
          title="VietQR"
        >
          <Smartphone className="h-4 w-4" />
          <span className="text-xs font-medium">VietQR</span>
        </div>
      </div>
    </div>
  );
}
