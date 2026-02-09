"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  MessageSquare,
  Trash2,
  Star,
  Image as ImageIcon,
} from "lucide-react";

interface Review {
  id: string;
  rating: number;
  content?: string;
  images: string[];
  isApproved: boolean;
  adminReply?: string;
  createdAt: string;
  product: { id: string; name: string; slug: string };
  user: { id: string; fullName: string; email: string; avatar?: string };
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function renderStars(rating: number) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "w-4 h-4",
            star <= rating ? "fill-yellow-400 text-yellow-400" : "text-neutral-300"
          )}
        />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const limit = 20;

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter]);

  async function fetchReviews() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      });
      if (statusFilter === "pending") {
        params.append("isApproved", "false");
      } else if (statusFilter === "approved") {
        params.append("isApproved", "true");
      }
      const response = await apiClient.get<{
        reviews: Review[];
        total: number;
        page: number;
        totalPages: number;
      }>(`/admin/reviews?${params}`);
      setReviews(response.reviews || []);
      setTotalPages(response.totalPages || 1);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Khong the tai danh sach danh gia");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: string) {
    try {
      await apiClient.put(`/admin/reviews/${id}/approve`);
      fetchReviews();
    } catch (err) {
      if (err instanceof ApiError) {
        alert(err.message);
      }
    }
  }

  async function handleReject(id: string) {
    try {
      await apiClient.put(`/admin/reviews/${id}/reject`);
      fetchReviews();
    } catch (err) {
      if (err instanceof ApiError) {
        alert(err.message);
      }
    }
  }

  async function handleReply(id: string) {
    if (!replyText.trim()) return;
    try {
      await apiClient.put(`/admin/reviews/${id}/reply`, { adminReply: replyText });
      setReplyingTo(null);
      setReplyText("");
      fetchReviews();
    } catch (err) {
      if (err instanceof ApiError) {
        alert(err.message);
      }
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Ban co chac chan muon xoa danh gia nay?")) return;
    try {
      await apiClient.delete(`/admin/reviews/${id}`);
      fetchReviews();
    } catch (err) {
      if (err instanceof ApiError) {
        alert(err.message);
      }
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-neutral-900">
          Quan ly danh gia
        </h1>
        <p className="font-body text-neutral-600 mt-1">
          Quan ly va duyet danh gia tu khach hang
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            setStatusFilter("");
            setCurrentPage(1);
          }}
          className={cn(
            "px-4 py-2 rounded-xl font-body font-medium transition-colors",
            statusFilter === ""
              ? "bg-primary-700 text-white"
              : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50"
          )}
        >
          Tat ca
        </button>
        <button
          onClick={() => {
            setStatusFilter("pending");
            setCurrentPage(1);
          }}
          className={cn(
            "px-4 py-2 rounded-xl font-body font-medium transition-colors",
            statusFilter === "pending"
              ? "bg-primary-700 text-white"
              : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50"
          )}
        >
          Cho duyet
        </button>
        <button
          onClick={() => {
            setStatusFilter("approved");
            setCurrentPage(1);
          }}
          className={cn(
            "px-4 py-2 rounded-xl font-body font-medium transition-colors",
            statusFilter === "approved"
              ? "bg-primary-700 text-white"
              : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50"
          )}
        >
          Da duyet
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
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
            <p className="font-body">Khong co danh gia nao</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-body font-semibold text-neutral-900">
                      San pham
                    </th>
                    <th className="px-4 py-3 text-left font-body font-semibold text-neutral-900">
                      Khach hang
                    </th>
                    <th className="px-4 py-3 text-left font-body font-semibold text-neutral-900">
                      Danh gia
                    </th>
                    <th className="px-4 py-3 text-left font-body font-semibold text-neutral-900">
                      Noi dung
                    </th>
                    <th className="px-4 py-3 text-left font-body font-semibold text-neutral-900">
                      Trang thai
                    </th>
                    <th className="px-4 py-3 text-left font-body font-semibold text-neutral-900">
                      Ngay tao
                    </th>
                    <th className="px-4 py-3 text-right font-body font-semibold text-neutral-900">
                      Thao tac
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {reviews.map((review) => (
                    <>
                      <tr key={review.id} className="hover:bg-neutral-50">
                        <td className="px-4 py-3">
                          <Link
                            href={`/products/${review.product.slug}`}
                            target="_blank"
                            className="font-body font-medium text-primary-700 hover:underline"
                          >
                            {review.product.name}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-body font-medium text-neutral-900">
                              {review.user.fullName}
                            </div>
                            <div className="font-body text-sm text-neutral-500">
                              {review.user.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">{renderStars(review.rating)}</td>
                        <td className="px-4 py-3">
                          <div className="max-w-md">
                            <p className="font-body text-sm text-neutral-600 line-clamp-2">
                              {review.content || "-"}
                            </p>
                            {review.images.length > 0 && (
                              <div className="flex items-center gap-1 mt-1 text-neutral-500">
                                <ImageIcon className="w-3 h-3" />
                                <span className="text-xs font-body">
                                  {review.images.length} anh
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-body font-medium",
                              review.isApproved
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            )}
                          >
                            {review.isApproved ? "Da duyet" : "Cho duyet"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-body text-sm text-neutral-600">
                            {formatDate(review.createdAt)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            {!review.isApproved && (
                              <button
                                onClick={() => handleApprove(review.id)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Duyet"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            {review.isApproved && (
                              <button
                                onClick={() => handleReject(review.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Bo duyet"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setReplyingTo(review.id);
                                setReplyText(review.adminReply || "");
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Tra loi"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(review.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Xoa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {replyingTo === review.id && (
                        <tr>
                          <td colSpan={7} className="px-4 py-3 bg-neutral-50">
                            <div className="space-y-2">
                              <label className="font-body text-sm font-medium text-neutral-700">
                                Tra loi tu admin
                              </label>
                              <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                className="w-full px-3 py-2 border border-neutral-200 rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary-700"
                                rows={3}
                                placeholder="Nhap phan hoi cua ban..."
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleReply(review.id)}
                                  className="px-4 py-2 bg-primary-700 text-white rounded-xl font-body text-sm hover:bg-primary-800 transition-colors"
                                >
                                  Luu
                                </button>
                                <button
                                  onClick={() => {
                                    setReplyingTo(null);
                                    setReplyText("");
                                  }}
                                  className="px-4 py-2 bg-white border border-neutral-200 text-neutral-600 rounded-xl font-body text-sm hover:bg-neutral-50 transition-colors"
                                >
                                  Huy
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200">
                <div className="font-body text-sm text-neutral-600">
                  Trang {currentPage} / {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.max(1, p - 1))
                    }
                    disabled={currentPage === 1}
                    className="p-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="p-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
