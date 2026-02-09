"use client";

import Image from "next/image";
import { Minus, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CartItem as CartItemType } from "@/stores/cartStore";

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (qty: number) => void;
  onRemove: () => void;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}

export function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-neutral-100 last:border-0">
      {/* Thumbnail */}
      <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-100">
        <Image
          src={item.image}
          alt={item.name}
          fill
          className="object-cover"
          sizes="48px"
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-neutral-900 line-clamp-1 font-body">
          {item.name}
        </h4>

        {item.variantName && (
          <p className="text-xs text-neutral-500 mt-0.5">{item.variantName}</p>
        )}

        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm font-semibold text-primary-700">
            {formatPrice(item.price)}
          </span>
          {item.originalPrice && item.originalPrice !== item.price && (
            <span className="text-xs text-neutral-400 line-through">
              {formatPrice(item.originalPrice)}
            </span>
          )}
        </div>

        {/* Quantity controls */}
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => onUpdateQuantity(item.quantity - 1)}
            disabled={item.quantity <= 1}
            className={cn(
              "w-7 h-7 rounded border border-neutral-300 flex items-center justify-center",
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
            onClick={() => onUpdateQuantity(item.quantity + 1)}
            disabled={item.quantity >= item.maxQuantity}
            className={cn(
              "w-7 h-7 rounded border border-neutral-300 flex items-center justify-center",
              "text-neutral-600 hover:bg-neutral-50 transition-colors",
              "disabled:opacity-40 disabled:cursor-not-allowed"
            )}
            aria-label="Tang so luong"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Remove button */}
      <button
        onClick={onRemove}
        className="p-1 text-neutral-400 hover:text-red-500 transition-colors flex-shrink-0"
        aria-label="Xoa san pham"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
