export default function ProductDetailLoading() {
  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Breadcrumb skeleton */}
      <nav className="py-4">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 bg-neutral-200 rounded animate-pulse" />
          <div className="h-4 w-4 bg-neutral-100 rounded animate-pulse" />
          <div className="h-4 w-20 bg-neutral-200 rounded animate-pulse" />
          <div className="h-4 w-4 bg-neutral-100 rounded animate-pulse" />
          <div className="h-4 w-32 bg-neutral-200 rounded animate-pulse" />
        </div>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
        {/* Product image gallery skeleton */}
        <div className="space-y-3">
          <div className="aspect-square bg-neutral-200 rounded-xl animate-pulse" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="w-20 h-20 bg-neutral-200 rounded-lg animate-pulse"
              />
            ))}
          </div>
        </div>

        {/* Product info skeleton */}
        <div className="space-y-6">
          {/* Brand */}
          <div className="h-4 w-20 bg-neutral-200 rounded animate-pulse" />

          {/* Title */}
          <div className="space-y-2">
            <div className="h-8 w-full bg-neutral-200 rounded animate-pulse" />
            <div className="h-8 w-2/3 bg-neutral-200 rounded animate-pulse" />
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <div className="h-8 w-32 bg-neutral-200 rounded animate-pulse" />
            <div className="h-5 w-24 bg-neutral-100 rounded animate-pulse" />
          </div>

          {/* Short description */}
          <div className="space-y-2">
            <div className="h-4 w-full bg-neutral-100 rounded animate-pulse" />
            <div className="h-4 w-5/6 bg-neutral-100 rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-neutral-100 rounded animate-pulse" />
          </div>

          {/* Variant selector skeleton */}
          <div className="space-y-3">
            <div className="h-4 w-16 bg-neutral-200 rounded animate-pulse" />
            <div className="flex gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-10 w-24 bg-neutral-200 rounded-lg animate-pulse"
                />
              ))}
            </div>
          </div>

          {/* Stock status */}
          <div className="h-4 w-28 bg-neutral-100 rounded animate-pulse" />

          {/* Add to cart button */}
          <div className="h-12 w-full bg-neutral-200 rounded-xl animate-pulse" />

          {/* Meta info */}
          <div className="border-t pt-4 space-y-2">
            <div className="h-4 w-32 bg-neutral-100 rounded animate-pulse" />
            <div className="h-4 w-40 bg-neutral-100 rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="mt-12 space-y-4">
        <div className="flex gap-4 border-b border-neutral-200 pb-3">
          <div className="h-6 w-24 bg-neutral-200 rounded animate-pulse" />
          <div className="h-6 w-28 bg-neutral-100 rounded animate-pulse" />
          <div className="h-6 w-20 bg-neutral-100 rounded animate-pulse" />
        </div>
        <div className="space-y-3 py-4">
          <div className="h-4 w-full bg-neutral-100 rounded animate-pulse" />
          <div className="h-4 w-full bg-neutral-100 rounded animate-pulse" />
          <div className="h-4 w-3/4 bg-neutral-100 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
