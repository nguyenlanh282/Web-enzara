export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-neutral-200 rounded-lg" />
        <div className="h-10 w-32 bg-neutral-200 rounded-lg" />
      </div>

      {/* Card skeleton */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <div className="space-y-4">
          <div className="h-4 w-3/4 bg-neutral-200 rounded" />
          <div className="h-4 w-1/2 bg-neutral-200 rounded" />
          <div className="h-4 w-2/3 bg-neutral-200 rounded" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-4 w-12 bg-neutral-200 rounded" />
              <div className="h-4 flex-1 bg-neutral-200 rounded" />
              <div className="h-4 w-24 bg-neutral-200 rounded" />
              <div className="h-4 w-20 bg-neutral-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
