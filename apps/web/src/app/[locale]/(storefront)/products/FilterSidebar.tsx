"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useTransition } from "react";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Brand {
  id: string;
  name: string;
  slug: string;
}

interface FilterSidebarProps {
  categories: Category[];
  brands: Brand[];
  currentParams: Record<string, string>;
}

export default function FilterSidebar({ categories, brands, currentParams }: FilterSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [minPrice, setMinPrice] = useState(currentParams.minPrice || "");
  const [maxPrice, setMaxPrice] = useState(currentParams.maxPrice || "");
  const [selectedBrands, setSelectedBrands] = useState<string[]>(
    currentParams.brands ? currentParams.brands.split(",") : []
  );
  const [showCategories, setShowCategories] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [showBrands, setShowBrands] = useState(true);

  const updateFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(currentParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    params.delete("page");

    const queryString = params.toString();
    const url = queryString ? `${pathname}?${queryString}` : pathname;

    startTransition(() => {
      router.push(url);
    });
  };

  const handlePriceFilter = () => {
    updateFilters({
      minPrice: minPrice || null,
      maxPrice: maxPrice || null,
    });
  };

  const handleBrandToggle = (brandSlug: string) => {
    const newSelected = selectedBrands.includes(brandSlug)
      ? selectedBrands.filter(b => b !== brandSlug)
      : [...selectedBrands, brandSlug];

    setSelectedBrands(newSelected);
    updateFilters({
      brands: newSelected.length > 0 ? newSelected.join(",") : null,
    });
  };

  const handleClearFilters = () => {
    setMinPrice("");
    setMaxPrice("");
    setSelectedBrands([]);
    router.push(pathname);
  };

  const hasActiveFilters = minPrice || maxPrice || selectedBrands.length > 0 || currentParams.category;

  return (
    <aside className="bg-white rounded-xl border border-neutral-200 p-4 h-fit sticky top-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading font-bold text-lg text-neutral-900">Bo loc</h2>
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="text-sm text-primary-700 hover:text-primary-800 font-body"
          >
            Xoa bo loc
          </button>
        )}
      </div>

      <div className="space-y-6">
        <div className="border-b border-neutral-200 pb-4">
          <button
            onClick={() => setShowCategories(!showCategories)}
            className="flex items-center justify-between w-full text-left"
          >
            <h3 className="font-body font-semibold text-neutral-900">Danh muc</h3>
            <svg
              className={`w-5 h-5 transition-transform ${showCategories ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showCategories && (
            <ul className="mt-3 space-y-2">
              <li>
                <button
                  onClick={() => updateFilters({ category: null })}
                  className={`text-sm font-body w-full text-left hover:text-primary-700 ${
                    !currentParams.category ? "text-primary-700 font-semibold" : "text-neutral-600"
                  }`}
                >
                  Tat ca
                </button>
              </li>
              {categories.map((category) => (
                <li key={category.id}>
                  <button
                    onClick={() => updateFilters({ category: category.slug })}
                    className={`text-sm font-body w-full text-left hover:text-primary-700 ${
                      currentParams.category === category.slug ? "text-primary-700 font-semibold" : "text-neutral-600"
                    }`}
                  >
                    {category.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-b border-neutral-200 pb-4">
          <button
            onClick={() => setShowPrice(!showPrice)}
            className="flex items-center justify-between w-full text-left"
          >
            <h3 className="font-body font-semibold text-neutral-900">Khoang gia</h3>
            <svg
              className={`w-5 h-5 transition-transform ${showPrice ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showPrice && (
            <div className="mt-3 space-y-3">
              <div>
                <label className="text-xs text-neutral-500 font-body block mb-1">Tu (đ)</label>
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="text-xs text-neutral-500 font-body block mb-1">Den (đ)</label>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="999999999"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <button
                onClick={handlePriceFilter}
                disabled={isPending}
                className="w-full py-2 bg-primary-700 text-white rounded-lg text-sm font-body font-medium hover:bg-primary-800 transition-colors disabled:opacity-50"
              >
                Loc
              </button>
            </div>
          )}
        </div>

        <div>
          <button
            onClick={() => setShowBrands(!showBrands)}
            className="flex items-center justify-between w-full text-left"
          >
            <h3 className="font-body font-semibold text-neutral-900">Thuong hieu</h3>
            <svg
              className={`w-5 h-5 transition-transform ${showBrands ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showBrands && (
            <ul className="mt-3 space-y-2">
              {brands.map((brand) => (
                <li key={brand.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`brand-${brand.slug}`}
                    checked={selectedBrands.includes(brand.slug)}
                    onChange={() => handleBrandToggle(brand.slug)}
                    className="w-4 h-4 text-primary-700 border-neutral-300 rounded focus:ring-primary-500"
                  />
                  <label
                    htmlFor={`brand-${brand.slug}`}
                    className="ml-2 text-sm text-neutral-600 font-body cursor-pointer"
                  >
                    {brand.name}
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </aside>
  );
}
