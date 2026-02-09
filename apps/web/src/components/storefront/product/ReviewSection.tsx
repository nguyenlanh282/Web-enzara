"use client";

import { useEffect, useState } from "react";
import { Star, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReviewSectionProps {
  productId: string;
  productSlug: string;
}

interface Review {
  id: string;
  rating: number;
  content?: string;
  images: string[];
  adminReply?: string;
  createdAt: string;
  user: { id: string; fullName: string; avatar?: string };
}

interface RatingSummary {
  average: number;
  total: number;
  stars: Record<number, number>;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function renderStars(rating: number, size: "sm" | "md" | "lg" = "md") {
  const sizeClass = size === "sm" ? "w-4 h-4" : size === "lg" ? "w-6 h-6" : "w-5 h-5";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            sizeClass,
            star <= rating ? "fill-yellow-400 text-yellow-400" : "text-neutral-300"
          )}
        />
      ))}
    </div>
  );
}

function getInitials(name: string): string {
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

export function ReviewSection({ productId, productSlug }: ReviewSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<RatingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [canReviewMessage, setCanReviewMessage] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedRating, setSelectedRating] = useState(5);
  const [reviewContent, setReviewContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    fetchSummary();
    fetchReviews();
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, page]);

  async function checkAuth() {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/products/${productId}/reviews/can-review`, {
        credentials: "include",
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(true);
        setCanReview(data.canReview);
        setCanReviewMessage(data.message || "");
      }
    } catch (err) {
      setIsAuthenticated(false);
    }
  }

  function getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { useAuthStore } = require("@/stores/authStore");
      return useAuthStore.getState().accessToken;
    } catch {
      return null;
    }
  }

  async function fetchSummary() {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/products/${productId}/reviews/summary`
      );
      if (response.ok) {
        const data = await response.json();
        setSummary(data);
      }
    } catch (err) {
      console.error("Failed to fetch summary", err);
    }
  }

  async function fetchReviews() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/products/${productId}/reviews?page=${page}&limit=10`
      );
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
        setTotalPages(data.totalPages || 1);
      } else {
        setError("Khong the tai danh gia");
      }
    } catch (err) {
      setError("Khong the tai danh gia");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitReview() {
    if (!reviewContent.trim() && selectedRating === 0) return;
    setSubmitting(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/products/${productId}/reviews`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAccessToken()}`,
          },
          credentials: "include",
          body: JSON.stringify({
            rating: selectedRating,
            content: reviewContent,
          }),
        }
      );
      if (response.ok) {
        setSubmitSuccess(true);
        setShowForm(false);
        setReviewContent("");
        setSelectedRating(5);
        setCanReview(false);
        setTimeout(() => setSubmitSuccess(false), 5000);
      } else {
        const errorData = await response.json();
        alert(errorData.message || "Khong the gui danh gia");
      }
    } catch (err) {
      alert("Khong the gui danh gia");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-12 space-y-6">
      <h2 className="font-heading text-2xl font-bold text-neutral-900">Danh gia san pham</h2>

      {/* Rating Summary */}
      {summary && (
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="text-5xl font-heading font-bold text-primary-700">
                {summary.average.toFixed(1)}
              </div>
              {renderStars(Math.round(summary.average), "lg")}
              <p className="font-body text-sm text-neutral-600">{summary.total} danh gia</p>
            </div>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = summary.stars[star] || 0;
                const percentage = summary.total > 0 ? (count / summary.total) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="font-body text-sm text-neutral-600 w-12">{star} sao</span>
                    <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="font-body text-sm text-neutral-600 w-12 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Review Form Button */}
      {isAuthenticated && canReview && !showForm && !submitSuccess && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full md:w-auto px-6 py-3 bg-primary-700 text-white rounded-xl font-body font-medium hover:bg-primary-800 transition-colors"
        >
          Viet danh gia
        </button>
      )}

      {/* Can't Review Message */}
      {isAuthenticated && !canReview && canReviewMessage && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="font-body text-sm text-yellow-800">{canReviewMessage}</p>
        </div>
      )}

      {/* Submit Success Message */}
      {submitSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="font-body text-sm text-green-800">Danh gia cua ban dang cho duyet</p>
        </div>
      )}

      {/* Review Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
          <h3 className="font-heading text-lg font-bold text-neutral-900">Danh gia cua ban</h3>
          <div className="space-y-2">
            <label className="font-body text-sm font-medium text-neutral-700">Chon sao</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setSelectedRating(star)}
                  className="focus:outline-none"
                >
                  <Star
                    className={cn(
                      "w-8 h-8 transition-colors",
                      star <= selectedRating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-neutral-300 hover:text-yellow-400"
                    )}
                  />
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="font-body text-sm font-medium text-neutral-700">Noi dung</label>
            <textarea
              value={reviewContent}
              onChange={(e) => setReviewContent(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
              rows={4}
              placeholder="Chia se trai nghiem cua ban ve san pham..."
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSubmitReview}
              disabled={submitting}
              className="px-6 py-2 bg-primary-700 text-white rounded-xl font-body font-medium hover:bg-primary-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Dang gui..." : "Gui danh gia"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-6 py-2 bg-white border border-neutral-200 text-neutral-600 rounded-xl font-body font-medium hover:bg-neutral-50 transition-colors"
            >
              Huy
            </button>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary-700 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center gap-2 py-12 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <span className="font-body">{error}</span>
          </div>
        ) : reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
            <AlertCircle className="w-12 h-12 mb-2" />
            <p className="font-body">Chua co danh gia nao</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="font-heading font-bold text-primary-700">
                    {getInitials(review.user.fullName)}
                  </span>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-body font-medium text-neutral-900">{review.user.fullName}</p>
                      <p className="font-body text-sm text-neutral-500">{formatDate(review.createdAt)}</p>
                    </div>
                    {renderStars(review.rating, "sm")}
                  </div>
                  {review.content && (
                    <p className="font-body text-neutral-700">{review.content}</p>
                  )}
                  {review.images.length > 0 && (
                    <div className="flex gap-2">
                      {review.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt="Review"
                          className="w-20 h-20 object-cover rounded-lg border border-neutral-200"
                        />
                      ))}
                    </div>
                  )}
                  {review.adminReply && (
                    <div className="bg-neutral-50 rounded-lg p-4 mt-3">
                      <p className="font-body text-sm font-medium text-neutral-900 mb-1">Phan hoi tu Enzara</p>
                      <p className="font-body text-sm text-neutral-700">{review.adminReply}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        {/* Load More */}
        {!loading && !error && totalPages > page && (
          <div className="flex justify-center">
            <button
              onClick={() => setPage((p) => p + 1)}
              className="px-6 py-2 bg-white border border-neutral-200 text-neutral-600 rounded-xl font-body font-medium hover:bg-neutral-50 transition-colors"
            >
              Xem them
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
