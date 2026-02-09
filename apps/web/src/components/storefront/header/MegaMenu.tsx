"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
  children?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

interface MegaMenuProps {
  categories: Category[];
}

export function MegaMenu({ categories }: MegaMenuProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  return (
    <nav className="hidden lg:block bg-white border-b">
      <div className="mx-auto max-w-7xl px-4">
        <ul className="flex items-center gap-8 py-3">
          {categories.map((category) => (
            <li
              key={category.id}
              className="relative"
              onMouseEnter={() => setActiveCategory(category.id)}
              onMouseLeave={() => setActiveCategory(null)}
            >
              <Link
                href={`/categories/${category.slug}`}
                className={cn(
                  "font-medium transition-colors",
                  activeCategory === category.id
                    ? "text-primary-700"
                    : "text-neutral-700 hover:text-primary-700"
                )}
              >
                {category.name}
              </Link>

              {category.children && category.children.length > 0 && (
                <div
                  className={cn(
                    "absolute left-0 top-full pt-2 w-[600px] transition-opacity",
                    activeCategory === category.id
                      ? "opacity-100 pointer-events-auto"
                      : "opacity-0 pointer-events-none"
                  )}
                >
                  <div className="bg-white shadow-lg rounded-xl p-6 border">
                    <div className="flex gap-6">
                      <div className="flex-1 grid grid-cols-2 gap-4">
                        {category.children.map((child) => (
                          <Link
                            key={child.id}
                            href={`/categories/${child.slug}`}
                            className="text-neutral-700 hover:text-primary-700 transition-colors py-1"
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>

                      {category.image && (
                        <div className="w-48 h-48 relative rounded-lg overflow-hidden">
                          <Image
                            src={category.image}
                            alt={category.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
