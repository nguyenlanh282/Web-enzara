"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
  description?: string;
}

interface CategoryGridProps {
  categories: Category[];
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  const t = useTranslations("home");
  if (categories.length === 0) {
    return null;
  }

  const displayed = categories.slice(0, 6);
  const featured = displayed[0];
  const rest = displayed.slice(1);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* Featured category - spans 2 cols on larger screens */}
      {featured && (
        <Link
          href={`/categories/${featured.slug}`}
          className="group relative col-span-2 row-span-2 aspect-square md:aspect-auto rounded-2xl overflow-hidden cursor-pointer"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-10" />
          {featured.image ? (
            <Image
              src={featured.image}
              alt={featured.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-primary-800" />
          )}
          <div className="absolute bottom-0 left-0 right-0 z-20 p-5 sm:p-6">
            <h3 className="text-white font-heading font-bold text-xl sm:text-2xl mb-1">
              {featured.name}
            </h3>
            <span className="inline-flex items-center gap-1 text-white/80 text-sm group-hover:text-white transition-colors">
              {t("viewProducts")}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
        </Link>
      )}

      {/* Other categories */}
      {rest.map((category) => (
        <Link
          key={category.id}
          href={`/categories/${category.slug}`}
          className="group relative aspect-[4/5] rounded-2xl overflow-hidden cursor-pointer"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent z-10" />
          {category.image ? (
            <Image
              src={category.image}
              alt={category.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-primary-700" />
          )}
          <div className="absolute bottom-0 left-0 right-0 z-20 p-4">
            <h3 className="text-white font-heading font-bold text-sm sm:text-base">
              {category.name}
            </h3>
          </div>
        </Link>
      ))}
    </div>
  );
}
