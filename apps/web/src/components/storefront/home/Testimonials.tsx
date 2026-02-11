import { Star, Quote } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

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

export async function Testimonials({ reviews }: { reviews: Review[] }) {
  const t = await getTranslations("home.testimonials");
  if (!reviews || reviews.length === 0) return null;

  return (
    <section className="bg-neutral-50 py-16">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl lg:text-3xl font-heading font-bold text-neutral-900">
            {t("title")}
          </h2>
          <div className="mt-4 flex items-center gap-2 justify-center">
            <span className="h-1 w-12 rounded-full bg-primary-500" />
            <span className="h-1 w-3 rounded-full bg-primary-300" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="relative bg-white rounded-2xl p-6 flex flex-col hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-shadow duration-300"
            >
              {/* Quote icon */}
              <Quote className="h-8 w-8 text-primary-100 mb-4" />

              {/* Star rating */}
              <div className="flex items-center gap-0.5 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < review.rating
                        ? "fill-amber-400 text-amber-400"
                        : "fill-neutral-100 text-neutral-100"
                    }`}
                  />
                ))}
              </div>

              {/* Review content */}
              <p className="font-body text-neutral-600 text-sm leading-relaxed line-clamp-4 flex-1 mb-5">
                &ldquo;{review.content}&rdquo;
              </p>

              {/* Customer info */}
              <div className="flex items-center gap-3 pt-4 border-t border-neutral-100 mt-auto">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                  {review.user.avatar ? (
                    <img
                      src={review.user.avatar}
                      alt={review.user.fullName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-bold text-primary-700">
                      {review.user.fullName?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-heading font-semibold text-neutral-900 text-sm truncate">
                    {review.user.fullName}
                  </p>
                  <Link
                    href={`/products/${review.product.slug}`}
                    className="font-body text-xs text-primary-600 hover:text-primary-700 truncate block"
                  >
                    {review.product.name}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
