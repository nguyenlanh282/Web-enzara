"use client";

import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: {
    name: string;
    slug: string;
    basePrice: number;
    salePrice?: number;
    images: Array<{ url: string; altText?: string }>;
    category?: { name: string; slug: string };
    avgRating?: number;
    isFeatured?: boolean;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price) + "đ";
  };

  const discountPercent = product.salePrice
    ? Math.round(((product.basePrice - product.salePrice) / product.basePrice) * 100)
    : 0;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block bg-white rounded-xl overflow-hidden border border-neutral-200 hover:border-primary-700 transition-all hover:shadow-lg"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-neutral-100">
        {product.images[0]?.url && (
          <Image
            src={product.images[0].url}
            alt={product.images[0].altText || product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        )}

        {discountPercent > 0 && (
          <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
            -{discountPercent}%
          </div>
        )}

        {product.isFeatured && (
          <div className="absolute top-2 right-2 bg-secondary-600 text-white text-xs font-bold px-2 py-1 rounded">
            Nổi bật
          </div>
        )}
      </div>

      <div className="p-4">
        {product.category && (
          <p className="text-xs text-neutral-500 mb-1">{product.category.name}</p>
        )}

        <h3 className="font-medium text-neutral-900 mb-2 line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </h3>

        <div className="flex items-center gap-2 mb-3">
          {product.salePrice ? (
            <>
              <span className="text-primary-700 font-bold text-lg">
                {formatPrice(product.salePrice)}
              </span>
              <span className="text-sm text-neutral-400 line-through">
                {formatPrice(product.basePrice)}
              </span>
            </>
          ) : (
            <span className="text-primary-700 font-bold text-lg">
              {formatPrice(product.basePrice)}
            </span>
          )}
        </div>

        {product.avgRating && product.avgRating > 0 && (
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-4 w-4",
                  i < Math.floor(product.avgRating!)
                    ? "fill-accent-500 text-accent-500"
                    : "text-neutral-300"
                )}
              />
            ))}
            <span className="text-xs text-neutral-500 ml-1">
              ({product.avgRating.toFixed(1)})
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
