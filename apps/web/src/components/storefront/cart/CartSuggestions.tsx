"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api";
import { useCartStore } from "@/stores/cartStore";

const FREE_SHIPPING_THRESHOLD = 500000;

function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}

interface SuggestedProduct {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  salePrice?: number;
  images: Array<{ url: string; altText?: string }>;
  avgRating?: number;
  soldCount?: number;
  hasVariants?: boolean;
}

interface CartSuggestionsProps {
  productIds: string[];
  subtotal: number;
}

export function CartSuggestions({ productIds, subtotal }: CartSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<SuggestedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    if (subtotal >= FREE_SHIPPING_THRESHOLD || productIds.length === 0) {
      setSuggestions([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const ids = productIds.join(",");
    apiClient
      .get<SuggestedProduct[]>(
        `/products/suggestions/for-cart?productIds=${ids}&limit=4`,
      )
      .then((data) => {
        if (!cancelled) {
          setSuggestions(data || []);
        }
      })
      .catch(() => {
        if (!cancelled) setSuggestions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [productIds.join(","), subtotal >= FREE_SHIPPING_THRESHOLD]);

  if (subtotal >= FREE_SHIPPING_THRESHOLD) return null;
  if (!loading && suggestions.length === 0) return null;

  const remaining = FREE_SHIPPING_THRESHOLD - subtotal;

  const handleAddToCart = (product: SuggestedProduct) => {
    const price = product.salePrice ?? product.basePrice;
    addItem({
      productId: product.id,
      name: product.name,
      image: product.images[0]?.url || "",
      price: Number(price),
      originalPrice: product.salePrice ? Number(product.basePrice) : undefined,
      maxQuantity: 99,
    });
  };

  return (
    <div className="mb-6">
      {/* Free shipping message */}
      <div className="bg-primary-50 rounded-xl p-4 mb-4">
        <p className="text-sm font-body text-primary-800">
          Mua them{" "}
          <span className="font-bold text-primary-700">
            {formatPrice(remaining)}
          </span>{" "}
          de duoc mien phi van chuyen!
        </p>

        {/* Progress bar */}
        <div className="mt-2 h-2 bg-primary-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-700 rounded-full transition-all duration-500"
            style={{
              width: `${Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100)}%`,
            }}
          />
        </div>
      </div>

      {/* Suggested products */}
      {suggestions.length > 0 && (
        <div>
          <h3 className="text-sm font-heading font-bold text-neutral-900 mb-3">
            Goi y cho ban
          </h3>
          <div className="overflow-x-auto flex gap-4 snap-x snap-mandatory pb-2">
            {suggestions.map((product) => {
              const price = product.salePrice ?? product.basePrice;

              return (
                <div
                  key={product.id}
                  className="snap-start flex-shrink-0 w-44 bg-white rounded-xl border border-neutral-200 overflow-hidden"
                >
                  <Link href={`/products/${product.slug}`}>
                    <div className="relative aspect-square overflow-hidden bg-neutral-100">
                      {product.images[0]?.url && (
                        <Image
                          src={product.images[0].url}
                          alt={product.images[0].altText || product.name}
                          fill
                          className="object-cover"
                          sizes="176px"
                        />
                      )}
                    </div>
                  </Link>
                  <div className="p-3 space-y-2">
                    <Link href={`/products/${product.slug}`}>
                      <h4 className="text-xs font-body text-neutral-900 line-clamp-2 min-h-[2rem]">
                        {product.name}
                      </h4>
                    </Link>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-bold text-primary-700">
                        {formatPrice(Number(price))}
                      </span>
                      {product.salePrice && (
                        <span className="text-xs text-neutral-400 line-through">
                          {formatPrice(Number(product.basePrice))}
                        </span>
                      )}
                    </div>
                    {product.hasVariants ? (
                      <Link
                        href={`/products/${product.slug}`}
                        className={cn(
                          "block w-full text-center text-xs font-medium py-1.5 rounded-lg transition-colors",
                          "bg-primary-700 text-white hover:bg-primary-800",
                        )}
                      >
                        Xem chi tiet
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleAddToCart(product)}
                        className={cn(
                          "w-full text-xs font-medium py-1.5 rounded-lg transition-colors",
                          "bg-primary-700 text-white hover:bg-primary-800",
                        )}
                      >
                        Them
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
