export default function StorefrontLoading() {
  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      <div className="h-8 w-64 bg-neutral-200 rounded-lg mb-6" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-neutral-200 p-4">
            <div className="aspect-square bg-neutral-200 rounded-lg mb-3" />
            <div className="h-4 w-3/4 bg-neutral-200 rounded mb-2" />
            <div className="h-4 w-1/2 bg-neutral-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
