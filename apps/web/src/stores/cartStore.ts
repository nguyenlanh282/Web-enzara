"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiClient } from "@/lib/api";

export interface CartItem {
  productId: string;
  variantId?: string;
  name: string;
  variantName?: string;
  image: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  maxQuantity: number;
  sku?: string;
}

interface CartState {
  items: CartItem[];
  voucherCode: string | null;
  voucherDiscount: number;

  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (
    productId: string,
    variantId: string | undefined,
    qty: number
  ) => void;
  applyVoucher: (
    code: string,
    subtotal: number
  ) => Promise<{ valid: boolean; message: string }>;
  removeVoucher: () => void;
  clearCart: () => void;
}

function matchItem(
  item: CartItem,
  productId: string,
  variantId?: string
): boolean {
  return item.productId === productId && item.variantId === variantId;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      voucherCode: null,
      voucherDiscount: 0,

      addItem: (incoming) => {
        const { quantity: incomingQty = 1, ...rest } = incoming;
        set((state) => {
          const existingIndex = state.items.findIndex((item) =>
            matchItem(item, rest.productId, rest.variantId)
          );

          if (existingIndex >= 0) {
            const updated = [...state.items];
            const existing = updated[existingIndex];
            const newQty = Math.min(
              existing.quantity + incomingQty,
              existing.maxQuantity
            );
            updated[existingIndex] = { ...existing, quantity: newQty };
            return { items: updated };
          }

          const clampedQty = Math.min(incomingQty, rest.maxQuantity);
          return {
            items: [...state.items, { ...rest, quantity: clampedQty }],
          };
        });
      },

      removeItem: (productId, variantId) => {
        set((state) => ({
          items: state.items.filter(
            (item) => !matchItem(item, productId, variantId)
          ),
        }));
      },

      updateQuantity: (productId, variantId, qty) => {
        if (qty <= 0) {
          get().removeItem(productId, variantId);
          return;
        }

        set((state) => ({
          items: state.items.map((item) => {
            if (matchItem(item, productId, variantId)) {
              return {
                ...item,
                quantity: Math.min(qty, item.maxQuantity),
              };
            }
            return item;
          }),
        }));
      },

      applyVoucher: async (code, subtotal) => {
        try {
          const data = await apiClient.post<{
            valid: boolean;
            discount: number;
            message: string;
          }>("/vouchers/validate", { code, subtotal });

          if (data.valid) {
            set({ voucherCode: code, voucherDiscount: data.discount });
            return { valid: true, message: data.message };
          }

          return { valid: false, message: data.message };
        } catch {
          return { valid: false, message: "Khong the ap dung ma giam gia" };
        }
      },

      removeVoucher: () => {
        set({ voucherCode: null, voucherDiscount: 0 });
      },

      clearCart: () => {
        set({ items: [], voucherCode: null, voucherDiscount: 0 });
      },
    }),
    {
      name: "enzara-cart",
      partialize: (state) => ({
        items: state.items,
        voucherCode: state.voucherCode,
        voucherDiscount: state.voucherDiscount,
      }),
    }
  )
);

// ---------- Computed selectors ----------

export function selectSubtotal(state: CartState): number {
  return state.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
}

export function selectTotalItems(state: CartState): number {
  return state.items.reduce((sum, item) => sum + item.quantity, 0);
}

export function selectTotal(state: CartState): number {
  const subtotal = selectSubtotal(state);
  return Math.max(0, subtotal - state.voucherDiscount);
}
