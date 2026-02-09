import { ProductCardSkeleton } from "@/components/storefront/shared/ProductCardSkeleton";

export default function SearchLoading() {
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

      {/* Search title skeleton */}
      <div className="mt-6 space-y-2">
        <div className="h-8 w-72 bg-neutral-200 rounded animate-pulse" />
        <div className="h-4 w-40 bg-neutral-100 rounded animate-pulse" />
      </div>

      {/* Product grid skeleton */}
      <div className="mt-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
