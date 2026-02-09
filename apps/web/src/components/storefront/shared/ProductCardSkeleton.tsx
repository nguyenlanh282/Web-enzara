export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-neutral-200">
      {/* Image area - matches aspect-[3/4] from ProductCard */}
      <div className="aspect-[3/4] bg-neutral-200 animate-pulse" />

      <div className="p-4 space-y-3">
        {/* Category line */}
        <div className="h-3 w-16 bg-neutral-200 rounded animate-pulse" />

        {/* Title - two lines matching min-h-[2.5rem] */}
        <div className="space-y-1.5">
          <div className="h-4 w-full bg-neutral-200 rounded animate-pulse" />
          <div className="h-4 w-2/3 bg-neutral-200 rounded animate-pulse" />
        </div>

        {/* Price line */}
        <div className="flex items-center gap-2">
          <div className="h-5 w-24 bg-neutral-200 rounded animate-pulse" />
          <div className="h-4 w-16 bg-neutral-100 rounded animate-pulse" />
        </div>

        {/* Rating line */}
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-4 w-4 bg-neutral-200 rounded animate-pulse"
            />
          ))}
          <div className="h-3 w-8 bg-neutral-100 rounded animate-pulse ml-1" />
        </div>
      </div>
    </div>
  );
}
