"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  mobileImage?: string;
  link?: string;
  buttonText?: string;
}

interface HeroSliderProps {
  banners: Banner[];
}

export function HeroSlider({ banners }: HeroSliderProps) {
  const t = useTranslations("home");
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) emblaApi.scrollTo(index);
    },
    [emblaApi]
  );

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };

    emblaApi.on("select", onSelect);
    onSelect();

    const interval = setInterval(() => {
      if (emblaApi.canScrollNext()) {
        emblaApi.scrollNext();
      } else {
        emblaApi.scrollTo(0);
      }
    }, 5000);

    return () => {
      emblaApi.off("select", onSelect);
      clearInterval(interval);
    };
  }, [emblaApi]);

  if (banners.length === 0) {
    return null;
  }

  return (
    <section className="relative group">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {banners.map((banner) => {
            const content = (
              <div className="relative aspect-[4/3] md:aspect-[21/9] w-full bg-neutral-100">
                <Image
                  src={banner.image}
                  alt={banner.title}
                  fill
                  className="object-cover hidden md:block"
                  priority
                />
                {banner.mobileImage && (
                  <Image
                    src={banner.mobileImage}
                    alt={banner.title}
                    fill
                    className="object-cover md:hidden"
                    priority
                  />
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />

                {/* Text content */}
                <div className="absolute inset-0 flex items-center">
                  <div className="max-w-screen-xl mx-auto px-6 sm:px-8 lg:px-12 w-full">
                    <div className="max-w-lg">
                      <h2 className="text-2xl sm:text-3xl lg:text-5xl font-heading font-bold text-white leading-tight mb-3 drop-shadow-lg">
                        {banner.title}
                      </h2>
                      {banner.subtitle && (
                        <p className="text-sm sm:text-base lg:text-lg text-white/90 mb-6 line-clamp-2 drop-shadow">
                          {banner.subtitle}
                        </p>
                      )}
                      {banner.link && (
                        <span className="inline-flex items-center gap-2 bg-white text-neutral-900 font-heading font-semibold px-6 py-3 rounded-full text-sm hover:bg-primary-50 transition-colors cursor-pointer shadow-lg">
                          {banner.buttonText || t("exploreNow")}
                          <ChevronRight className="h-4 w-4" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );

            return (
              <div key={banner.id} className="flex-[0_0_100%]">
                {banner.link ? (
                  <Link href={banner.link}>{content}</Link>
                ) : (
                  content
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={scrollPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/40"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={scrollNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/40"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {banners.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                selectedIndex === index
                  ? "bg-white w-8"
                  : "bg-white/40 w-2 hover:bg-white/60"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
