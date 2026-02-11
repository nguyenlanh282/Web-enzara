"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Star, ShoppingBag } from "lucide-react";
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
  const t = useTranslations("products");
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price) + "đ";
  };

  const discountPercent = product.salePrice
    ? Math.round(((product.basePrice - product.salePrice) / product.basePrice) * 100)
    : 0;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block bg-white rounded-2xl overflow-hidden border border-neutral-100 hover:border-primary-200 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] cursor-pointer"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-neutral-50">
        {product.images[0]?.url && (
          <Image
            src={product.images[0].url}
            alt={product.images[0].altText || product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {discountPercent > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              -{discountPercent}%
            </span>
          )}
          {product.isFeatured && (
            <span className="bg-secondary-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {t("featured")}
            </span>
          )}
        </div>

        {/* Quick action overlay */}
        <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <div className="flex items-center justify-center gap-2 bg-primary-700 text-white rounded-xl py-2.5 text-sm font-medium shadow-lg">
            <ShoppingBag className="h-4 w-4" />
            {t("viewDetails")}
          </div>
        </div>
      </div>

      <div className="p-4">
        {product.category && (
          <p className="text-xs text-primary-600 font-medium mb-1.5 uppercase tracking-wide">
            {product.category.name}
          </p>
        )}

        <h3 className="font-body font-medium text-neutral-900 mb-3 line-clamp-2 min-h-[2.5rem] text-sm leading-snug group-hover:text-primary-700 transition-colors">
          {product.name}
        </h3>

        <div className="flex items-end justify-between">
          <div className="flex items-baseline gap-2">
            {product.salePrice ? (
              <>
                <span className="text-primary-700 font-heading font-bold text-lg">
                  {formatPrice(product.salePrice)}
                </span>
                <span className="text-xs text-neutral-400 line-through">
                  {formatPrice(product.basePrice)}
                </span>
              </>
            ) : (
              <span className="text-primary-700 font-heading font-bold text-lg">
                {formatPrice(product.basePrice)}
              </span>
            )}
          </div>

          {product.avgRating && product.avgRating > 0 && (
            <div className="flex items-center gap-0.5">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="text-xs text-neutral-500 font-medium">
                {product.avgRating.toFixed(1)}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
