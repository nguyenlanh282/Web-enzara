"use client";

import Image from "next/image";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
}

interface CategoryGridProps {
  categories: Category[];
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="py-12">
      <h2 className="text-2xl font-heading font-bold text-neutral-900 mb-6">
        Danh mục sản phẩm
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/categories/${category.slug}`}
            className="group relative aspect-square rounded-xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/20 z-10" />

            {category.image ? (
              <Image
                src={category.image}
                alt={category.name}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-300"
              />
            ) : (
              <div className="absolute inset-0 bg-primary-700" />
            )}

            <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
              <h3 className="text-white font-heading font-bold text-lg md:text-xl text-center">
                {category.name}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
