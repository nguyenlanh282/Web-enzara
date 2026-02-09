import { ProductCardSkeleton } from "@/components/storefront/shared/ProductCardSkeleton";

export default function ProductsLoading() {
  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Breadcrumb skeleton */}
      <nav className="py-4">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 bg-neutral-200 rounded animate-pulse" />
          <div className="h-4 w-4 bg-neutral-100 rounded animate-pulse" />
          <div className="h-4 w-20 bg-neutral-200 rounded animate-pulse" />
        </div>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-4">
        {/* Filter sidebar skeleton */}
        <div className="hidden lg:block space-y-4">
          <div className="h-6 w-24 bg-neutral-200 rounded animate-pulse" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-5 w-full bg-neutral-100 rounded animate-pulse"
              />
            ))}
          </div>
          <div className="h-6 w-20 bg-neutral-200 rounded animate-pulse mt-6" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-5 w-full bg-neutral-100 rounded animate-pulse"
              />
            ))}
          </div>
        </div>

        {/* Product grid skeleton */}
        <div className="lg:col-span-3">
          {/* Sort bar skeleton */}
          <div className="flex items-center justify-between">
            <div className="h-5 w-32 bg-neutral-200 rounded animate-pulse" />
            <div className="h-9 w-40 bg-neutral-200 rounded-lg animate-pulse" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
