"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { useCartStore, selectSubtotal } from "@/stores/cartStore";
import { CartItem } from "./CartItem";

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const subtotal = useCartStore(selectSubtotal);

  const isEmpty = items.length === 0;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        {/* Sheet panel sliding from right */}
        <Dialog.Content
          className={cn(
            "fixed right-0 top-0 z-50 h-full w-full max-w-sm",
            "bg-white shadow-xl flex flex-col",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
            "duration-300"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-4">
            <Dialog.Title className="text-lg font-heading font-bold text-neutral-900">
              Gio hang
            </Dialog.Title>
            <Dialog.Close className="p-1 text-neutral-500 hover:text-neutral-700 transition-colors rounded-lg hover:bg-neutral-100">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              <span className="sr-only">Dong</span>
            </Dialog.Close>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-4">
            {isEmpty ? (
              <div className="flex flex-col items-center justify-center h-full text-neutral-400 gap-4">
                <ShoppingBag className="h-16 w-16 stroke-1" />
                <p className="text-base font-body">
                  Gio hang cua ban dang trong
                </p>
                <Dialog.Close asChild>
                  <Link
                    href="/products"
                    className="text-sm text-primary-700 hover:text-primary-800 font-medium underline underline-offset-4"
                  >
                    Tiep tuc mua sam
                  </Link>
                </Dialog.Close>
              </div>
            ) : (
              <div className="py-2">
                {items.map((item) => (
                  <CartItem
                    key={`${item.productId}-${item.variantId ?? "default"}`}
                    item={item}
                    onUpdateQuantity={(qty) =>
                      updateQuantity(item.productId, item.variantId, qty)
                    }
                    onRemove={() => removeItem(item.productId, item.variantId)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {!isEmpty && (
            <div className="border-t px-4 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600 font-body">
                  Tam tinh
                </span>
                <span className="text-base font-heading font-bold text-neutral-900">
                  {formatPrice(subtotal)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Dialog.Close asChild>
                  <Link
                    href="/cart"
                    className="flex items-center justify-center h-11 rounded-xl border border-primary-700 text-primary-700 text-sm font-medium hover:bg-primary-700/5 transition-colors"
                  >
                    Xem gio hang
                  </Link>
                </Dialog.Close>
                <Dialog.Close asChild>
                  <Link
                    href="/checkout"
                    className="flex items-center justify-center h-11 rounded-xl bg-primary-700 text-white text-sm font-medium hover:bg-primary-800 transition-colors"
                  >
                    Thanh toan
                  </Link>
                </Dialog.Close>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
