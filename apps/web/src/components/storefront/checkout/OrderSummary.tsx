"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  useCartStore,
  selectSubtotal,
  selectTotal,
} from "@/stores/cartStore";
import type { CartItem } from "@/stores/cartStore";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN").format(price) + "\u0111";
}

const FREE_SHIPPING_THRESHOLD = 500000;
const SHIPPING_FEE = 30000;

export function OrderSummary({
  loyaltyDiscount = 0,
}: {
  loyaltyDiscount?: number;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore(selectSubtotal);
  const total = useCartStore(selectTotal);
  const voucherCode = useCartStore((s) => s.voucherCode);
  const voucherDiscount = useCartStore((s) => s.voucherDiscount);

  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const grandTotal = Math.max(0, total + shippingFee - loyaltyDiscount);

  if (!mounted) {
    return (
      <div className="sticky top-24 bg-neutral-50 rounded-xl p-5">
        <h2 className="text-lg font-heading font-bold text-neutral-900 mb-4">
          Don hang cua ban
        </h2>
        <div className="animate-pulse space-y-3">
          <div className="h-16 bg-neutral-200 rounded" />
          <div className="h-16 bg-neutral-200 rounded" />
          <div className="h-4 bg-neutral-200 rounded w-2/3" />
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-24 bg-neutral-50 rounded-xl p-5">
      <h2 className="text-lg font-heading font-bold text-neutral-900 mb-4">
        Don hang cua ban
      </h2>

      {/* Items */}
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {items.map((item: CartItem) => {
          const key = `${item.productId}-${item.variantId ?? "default"}`;
          return (
            <div key={key} className="flex items-center gap-3">
              <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
                <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-5 h-5 bg-primary-700 text-white text-[10px] font-bold rounded-full">
                  {item.quantity}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-neutral-900 font-medium font-body line-clamp-1">
                  {item.name}
                </p>
                {item.variantName && (
                  <p className="text-xs text-neutral-500">{item.variantName}</p>
                )}
              </div>
              <p className="text-sm font-medium text-neutral-900 flex-shrink-0">
                {formatPrice(item.price * item.quantity)}
              </p>
            </div>
          );
        })}
      </div>

      {/* Divider */}
      <div className="border-t border-neutral-200 my-4" />

      {/* Subtotal */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-neutral-600 font-body">Tam tinh</span>
          <span className="text-neutral-900 font-medium">
            {formatPrice(subtotal)}
          </span>
        </div>

        {/* Voucher discount */}
        {voucherCode && voucherDiscount > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-neutral-600 font-body">
              Giam gia ({voucherCode})
            </span>
            <span className="text-green-600 font-medium">
              -{formatPrice(voucherDiscount)}
            </span>
          </div>
        )}

        {/* Loyalty discount */}
        {loyaltyDiscount > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-neutral-600 font-body">Giam gia diem</span>
            <span className="text-green-600 font-medium">
              -{formatPrice(loyaltyDiscount)}
            </span>
          </div>
        )}

        {/* Shipping */}
        <div className="flex items-center justify-between">
          <span className="text-neutral-600 font-body">Phi van chuyen</span>
          <span className="text-neutral-900 font-medium">
            {shippingFee === 0 ? (
              <span className="text-green-600">Mien phi</span>
            ) : (
              formatPrice(shippingFee)
            )}
          </span>
        </div>

        {shippingFee > 0 && (
          <p className="text-xs text-neutral-400">
            Mien phi van chuyen cho don hang tu{" "}
            {formatPrice(FREE_SHIPPING_THRESHOLD)}
          </p>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-neutral-200 my-4" />

      {/* Total */}
      <div className="flex items-center justify-between">
        <span className="text-base font-heading font-bold text-neutral-900">
          Tong cong
        </span>
        <span className="text-lg font-heading font-bold text-primary-700">
          {formatPrice(grandTotal)}
        </span>
      </div>
    </div>
  );
}
