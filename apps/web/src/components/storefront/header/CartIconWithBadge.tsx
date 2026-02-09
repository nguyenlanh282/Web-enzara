"use client";

import { useState, useEffect, useCallback } from "react";
import { ShoppingCart } from "lucide-react";
import { useCartStore, selectTotalItems } from "@/stores/cartStore";
import { CartDrawer } from "@/components/storefront/cart/CartDrawer";

export function CartIconWithBadge() {
  const totalItems = useCartStore(selectTotalItems);
  const [mounted, setMounted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const count = mounted ? totalItems : 0;

  const handleClick = useCallback(() => {
    setDrawerOpen(true);
  }, []);

  return (
    <>
      <button
        onClick={handleClick}
        className="relative p-2 hover:bg-neutral-100 rounded-lg transition-colors"
        aria-label="Gio hang"
      >
        <ShoppingCart className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 bg-primary-700 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      <CartDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </>
  );
}
