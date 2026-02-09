import { Star } from "lucide-react";
import Link from "next/link";

interface Review {
  id: string;
  rating: number;
  content: string;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    avatar: string | null;
  };
  product: {
    id: string;
    name: string;
    slug: string;
  };
}

export function Testimonials({ reviews }: { reviews: Review[] }) {
  if (!reviews || reviews.length === 0) return null;

  return (
    <section className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h2 className="text-2xl font-heading font-bold text-neutral-900 mb-8 text-center">
        Khach hang noi gi ve Enzara
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="bg-white rounded-xl border border-neutral-200 p-6 flex flex-col hover:shadow-md transition-shadow"
          >
            {/* Star rating */}
            <div className="flex items-center gap-0.5 mb-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < review.rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "fill-neutral-200 text-neutral-200"
                  }`}
                />
              ))}
            </div>

            {/* Review content */}
            <p className="font-body text-neutral-700 text-sm leading-relaxed line-clamp-3 flex-1 mb-4">
              {review.content}
            </p>

            {/* Customer info */}
            <div className="border-t border-neutral-100 pt-4 mt-auto">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                  {review.user.avatar ? (
                    <img
                      src={review.user.avatar}
                      alt={review.user.fullName}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-primary-700">
                      {review.user.fullName?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-body font-semibold text-neutral-900 text-sm truncate">
                    {review.user.fullName}
                  </p>
                  <Link
                    href={`/products/${review.product.slug}`}
                    className="font-body text-xs text-primary-700 hover:underline truncate block"
                  >
                    {review.product.name}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
