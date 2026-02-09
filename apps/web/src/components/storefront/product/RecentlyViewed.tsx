"use client";

import Image from "next/image";
import Link from "next/link";
import { useRecentlyViewedStore } from "@/stores/recentlyViewedStore";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN").format(price) + "\u0111";
}

interface RecentlyViewedProps {
  currentProductId: string;
}

export function RecentlyViewed({ currentProductId }: RecentlyViewedProps) {
  const items = useRecentlyViewedStore((s) => s.items);

  const filtered = items.filter((item) => item.id !== currentProductId);

  if (filtered.length === 0) return null;

  return (
    <div className="mt-12">
      <h2 className="text-xl font-heading font-bold text-neutral-900 mb-6">
        San pham da xem gan day
      </h2>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-neutral-300">
        {filtered.map((item) => (
          <Link
            key={item.id}
            href={`/products/${item.slug}`}
            className="flex-shrink-0 w-44 group"
          >
            <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-neutral-100">
              <Image
                src={item.image}
                alt={item.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="176px"
              />
            </div>
            <div className="mt-2 space-y-1">
              <h3 className="text-sm font-body font-medium text-neutral-900 line-clamp-2 group-hover:text-primary-700 transition-colors">
                {item.name}
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-heading font-bold text-primary-700">
                  {formatPrice(item.price)}
                </span>
                {item.originalPrice && item.originalPrice !== item.price && (
                  <span className="text-xs text-neutral-400 line-through">
                    {formatPrice(item.originalPrice)}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
