"use client";

import { useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { ProductCard } from "../product/ProductCard";

interface ProductCarouselProps {
  title: string;
  products: Array<{
    name: string;
    slug: string;
    basePrice: number;
    salePrice?: number;
    images: Array<{ url: string; altText?: string }>;
    category?: { name: string; slug: string };
    avgRating?: number;
    isFeatured?: boolean;
  }>;
  viewAllHref?: string;
}

export function ProductCarousel({
  title,
  products,
  viewAllHref,
}: ProductCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    slidesToScroll: 1,
    breakpoints: {
      "(min-width: 768px)": { slidesToScroll: 2 },
      "(min-width: 1024px)": { slidesToScroll: 4 },
    },
  });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-heading font-bold text-neutral-900">
          {title}
        </h2>

        <div className="flex items-center gap-4">
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="text-primary-700 hover:text-primary-800 font-medium transition-colors"
            >
              Xem tất cả
            </Link>
          )}

          <div className="flex gap-2">
            <button
              onClick={scrollPrev}
              className="p-2 rounded-lg border border-neutral-300 hover:border-primary-700 hover:text-primary-700 transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={scrollNext}
              className="p-2 rounded-lg border border-neutral-300 hover:border-primary-700 hover:text-primary-700 transition-colors"
              aria-label="Next"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">
          {products.map((product) => (
            <div
              key={product.slug}
              className="flex-[0_0_calc(50%-0.5rem)] md:flex-[0_0_calc(33.333%-0.667rem)] lg:flex-[0_0_calc(25%-0.75rem)]"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
