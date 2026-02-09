"use client";

import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface FloatingCartProps {
  count?: number;
}

export function FloatingCart({ count = 0 }: FloatingCartProps) {
  return (
    <Link
      href="/cart"
      className="lg:hidden fixed bottom-6 right-6 z-30 p-4 bg-primary-700 text-white rounded-full shadow-lg hover:bg-primary-800 transition-colors"
      aria-label="Giỏ hàng"
    >
      <ShoppingCart className="h-6 w-6" />
      {count > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
