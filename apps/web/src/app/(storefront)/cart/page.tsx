"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2, Tag, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useCartStore,
  selectSubtotal,
  selectTotalItems,
} from "@/stores/cartStore";
import { CartSummary } from "@/components/storefront/cart/CartSummary";
import { CartSuggestions } from "@/components/storefront/cart/CartSuggestions";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}

function CartPage() {
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const applyVoucher = useCartStore((s) => s.applyVoucher);
  const removeVoucher = useCartStore((s) => s.removeVoucher);
  const voucherCode = useCartStore((s) => s.voucherCode);
  const subtotal = useCartStore(selectSubtotal);
  const totalItems = useCartStore(selectTotalItems);

  const [voucherInput, setVoucherInput] = useState("");
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherMessage, setVoucherMessage] = useState<{
    valid: boolean;
    message: string;
  } | null>(null);

  const isEmpty = items.length === 0;

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

  if (isEmpty) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="flex flex-col items-center justify-center gap-6 text-neutral-400">
          <ShoppingBag className="h-24 w-24 stroke-1" />
          <h1 className="text-2xl font-heading font-bold text-neutral-900">
            Gio hang cua ban dang trong
          </h1>
          <p className="text-neutral-500 font-body text-center max-w-md">
            Hay them san pham vao gio hang de bat dau mua sam cac san pham lam
            sach sinh hoc than thien voi moi truong.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center justify-center h-12 px-8 rounded-xl bg-primary-700 text-white font-medium hover:bg-primary-800 transition-colors"
          >
            Tiep tuc mua sam
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-heading font-bold text-neutral-900 mb-6">
        Gio hang ({totalItems} san pham)
      </h1>

      {/* Shipping note */}
      <div className="mb-6 bg-primary-50 rounded-xl p-4">
        <p className="text-sm font-body text-primary-800">
          Phi van chuyen se duoc tinh khi ban chon dia chi giao hang o buoc thanh toan.
        </p>
      </div>

      <div className="lg:grid lg:grid-cols-3 lg:gap-8">
        {/* Cart items column */}
        <div className="lg:col-span-2">
          {/* Desktop table header */}
          <div className="hidden md:grid md:grid-cols-12 gap-4 pb-3 border-b border-neutral-200 text-sm text-neutral-500 font-body">
            <div className="col-span-5">San pham</div>
            <div className="col-span-2 text-center">Don gia</div>
            <div className="col-span-2 text-center">So luong</div>
            <div className="col-span-2 text-right">Thanh tien</div>
            <div className="col-span-1" />
          </div>

          {/* Items */}
          <div className="divide-y divide-neutral-100">
            {items.map((item) => {
              const rowTotal = item.price * item.quantity;
              const key = `${item.productId}-${item.variantId ?? "default"}`;

              return (
                <div key={key}>
                  {/* Desktop row */}
                  <div className="hidden md:grid md:grid-cols-12 gap-4 items-center py-4">
                    {/* Product */}
                    <div className="col-span-5 flex items-center gap-4">
                      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-medium text-neutral-900 line-clamp-2 font-body">
                          {item.name}
                        </h3>
                        {item.variantName && (
                          <p className="text-xs text-neutral-500 mt-0.5">
                            {item.variantName}
                          </p>
                        )}
                        {item.sku && (
                          <p className="text-xs text-neutral-400 mt-0.5">
                            SKU: {item.sku}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Unit price */}
                    <div className="col-span-2 text-center">
                      <span className="text-sm font-semibold text-primary-700">
                        {formatPrice(item.price)}
                      </span>
                      {item.originalPrice &&
                        item.originalPrice !== item.price && (
                          <span className="block text-xs text-neutral-400 line-through">
                            {formatPrice(item.originalPrice)}
                          </span>
                        )}
                    </div>

                    {/* Quantity */}
                    <div className="col-span-2 flex items-center justify-center gap-1">
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.productId,
                            item.variantId,
                            item.quantity - 1
                          )
                        }
                        disabled={item.quantity <= 1}
                        className={cn(
                          "w-8 h-8 rounded border border-neutral-300 flex items-center justify-center",
                          "text-neutral-600 hover:bg-neutral-50 transition-colors",
                          "disabled:opacity-40 disabled:cursor-not-allowed"
                        )}
                        aria-label="Giam so luong"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val) && val >= 1) {
                            updateQuantity(
                              item.productId,
                              item.variantId,
                              val
                            );
                          }
                        }}
                        min={1}
                        max={item.maxQuantity}
                        className="w-12 h-8 text-center text-sm border border-neutral-300 rounded font-body focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.productId,
                            item.variantId,
                            item.quantity + 1
                          )
                        }
                        disabled={item.quantity >= item.maxQuantity}
                        className={cn(
                          "w-8 h-8 rounded border border-neutral-300 flex items-center justify-center",
                          "text-neutral-600 hover:bg-neutral-50 transition-colors",
                          "disabled:opacity-40 disabled:cursor-not-allowed"
                        )}
                        aria-label="Tang so luong"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Row total */}
                    <div className="col-span-2 text-right">
                      <span className="text-sm font-bold text-neutral-900">
                        {formatPrice(rowTotal)}
                      </span>
                    </div>

                    {/* Remove */}
                    <div className="col-span-1 text-right">
                      <button
                        onClick={() =>
                          removeItem(item.productId, item.variantId)
                        }
                        className="p-1.5 text-neutral-400 hover:text-red-500 transition-colors"
                        aria-label="Xoa san pham"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Mobile card */}
                  <div className="md:hidden py-4">
                    <div className="flex gap-3">
                      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-sm font-medium text-neutral-900 line-clamp-2 font-body">
                              {item.name}
                            </h3>
                            {item.variantName && (
                              <p className="text-xs text-neutral-500 mt-0.5">
                                {item.variantName}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() =>
                              removeItem(item.productId, item.variantId)
                            }
                            className="p-1 text-neutral-400 hover:text-red-500 transition-colors flex-shrink-0"
                            aria-label="Xoa san pham"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-semibold text-primary-700">
                            {formatPrice(item.price)}
                          </span>
                          {item.originalPrice &&
                            item.originalPrice !== item.price && (
                              <span className="text-xs text-neutral-400 line-through">
                                {formatPrice(item.originalPrice)}
                              </span>
                            )}
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.productId,
                                  item.variantId,
                                  item.quantity - 1
                                )
                              }
                              disabled={item.quantity <= 1}
                              className={cn(
                                "w-8 h-8 rounded border border-neutral-300 flex items-center justify-center",
                                "text-neutral-600 hover:bg-neutral-50 transition-colors",
                                "disabled:opacity-40 disabled:cursor-not-allowed"
                              )}
                              aria-label="Giam so luong"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-8 text-center text-sm font-medium font-body">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.productId,
                                  item.variantId,
                                  item.quantity + 1
                                )
                              }
                              disabled={item.quantity >= item.maxQuantity}
                              className={cn(
                                "w-8 h-8 rounded border border-neutral-300 flex items-center justify-center",
                                "text-neutral-600 hover:bg-neutral-50 transition-colors",
                                "disabled:opacity-40 disabled:cursor-not-allowed"
                              )}
                              aria-label="Tang so luong"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <span className="text-sm font-bold text-neutral-900">
                            {formatPrice(rowTotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Continue shopping link */}
          <div className="mt-6 pt-4 border-t border-neutral-200">
            <Link
              href="/products"
              className="text-sm text-primary-700 hover:text-primary-800 font-medium underline underline-offset-4"
            >
              Tiep tuc mua sam
            </Link>
          </div>
        </div>

        {/* Summary sidebar */}
        <div className="mt-8 lg:mt-0">
          {/* Cart Suggestions */}
          <CartSuggestions
            productIds={items.map((item) => item.productId)}
            subtotal={subtotal}
          />

          {/* Voucher section */}
          <div className="bg-neutral-50 rounded-xl p-5 mb-4">
            <h3 className="text-sm font-heading font-bold text-neutral-900 flex items-center gap-2 mb-3">
              <Tag className="h-4 w-4" />
              Ma giam gia
            </h3>

            {voucherCode ? (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <span className="text-sm text-green-700 font-medium font-body">
                  {voucherCode}
                </span>
                <button
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
                      if (e.key === "Enter") handleApplyVoucher();
                    }}
                  />
                  <button
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
                      voucherMessage.valid
                        ? "text-green-600"
                        : "text-red-500"
                    )}
                  >
                    {voucherMessage.message}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Order summary */}
          <CartSummary />

          {/* Checkout button */}
          <Link
            href="/checkout"
            className="mt-4 flex items-center justify-center w-full h-12 rounded-xl bg-primary-700 text-white font-medium hover:bg-primary-800 transition-colors"
          >
            Tien hanh thanh toan
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CartPageRoute() {
  return <CartPage />;
}
