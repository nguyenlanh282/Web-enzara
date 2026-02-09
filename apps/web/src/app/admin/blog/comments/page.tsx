"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Loader2, AlertCircle, Check, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

interface Comment {
  id: string;
  content: string;
  authorName: string;
  authorEmail: string;
  isApproved: boolean;
  createdAt: string;
  postId: string;
  post?: {
    id: string;
    title: string;
    slug: string;
  };
}

export default function BlogCommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "approved">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const limit = 20;

  useEffect(() => {
    fetchComments();
  }, [currentPage, activeTab]);

  async function fetchComments() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      });

      if (activeTab === "pending") {
        params.append("isApproved", "false");
      } else if (activeTab === "approved") {
        params.append("isApproved", "true");
      }

      const response = await apiClient.get<{
        comments: Comment[];
        total: number;
        page: number;
        totalPages: number;
      }>(`/admin/comments?${params}`);
      setComments(response.comments || []);
      setTotalPages(response.totalPages || 1);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Không thể tải danh sách bình luận");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: string) {
    setActionLoading(id);
    try {
      await apiClient.put(`/admin/comments/${id}/approve`, {});
      await fetchComments();
    } catch (err) {
      if (err instanceof ApiError) {
        alert(`Lỗi: ${err.message}`);
      } else {
        alert("Không thể duyệt bình luận");
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bạn có chắc muốn xóa bình luận này?")) {
      return;
    }
    setActionLoading(id);
    try {
      await apiClient.delete(`/admin/comments/${id}`);
      await fetchComments();
    } catch (err) {
      if (err instanceof ApiError) {
        alert(`Lỗi: ${err.message}`);
      } else {
        alert("Không thể xóa bình luận");
      }
    } finally {
      setActionLoading(null);
    }
  }

  function truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-neutral-900">
          Quản lý bình luận
        </h1>
        <p className="font-body text-neutral-600 mt-1">
          Duyệt và quản lý bình luận từ người dùng
        </p>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 p-4">
        <div className="flex items-center gap-2 border-b border-neutral-200">
          <button
            onClick={() => {
              setActiveTab("all");
              setCurrentPage(1);
            }}
            className={cn(
              "px-4 py-2 font-body font-medium transition-colors border-b-2 -mb-px",
              activeTab === "all"
                ? "border-primary-700 text-primary-700"
                : "border-transparent text-neutral-600 hover:text-neutral-900"
            )}
          >
            Tất cả
          </button>
          <button
            onClick={() => {
              setActiveTab("pending");
              setCurrentPage(1);
            }}
            className={cn(
              "px-4 py-2 font-body font-medium transition-colors border-b-2 -mb-px",
              activeTab === "pending"
                ? "border-primary-700 text-primary-700"
                : "border-transparent text-neutral-600 hover:text-neutral-900"
            )}
          >
            Chờ duyệt
          </button>
          <button
            onClick={() => {
              setActiveTab("approved");
              setCurrentPage(1);
            }}
            className={cn(
              "px-4 py-2 font-body font-medium transition-colors border-b-2 -mb-px",
              activeTab === "approved"
                ? "border-primary-700 text-primary-700"
                : "border-transparent text-neutral-600 hover:text-neutral-900"
            )}
          >
            Đã duyệt
          </button>
        </div>
      </div>

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
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
            <AlertCircle className="w-12 h-12 mb-2" />
            <p className="font-body">Không có bình luận nào</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-body font-semibold text-neutral-900">
                      Nội dung
                    </th>
                    <th className="px-4 py-3 text-left font-body font-semibold text-neutral-900">
                      Bài viết
                    </th>
                    <th className="px-4 py-3 text-left font-body font-semibold text-neutral-900">
                      Người gửi
                    </th>
                    <th className="px-4 py-3 text-left font-body font-semibold text-neutral-900">
                      Trạng thái
                    </th>
                    <th className="px-4 py-3 text-left font-body font-semibold text-neutral-900">
                      Ngày gửi
                    </th>
                    <th className="px-4 py-3 text-right font-body font-semibold text-neutral-900">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {comments.map((comment) => (
                    <tr key={comment.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3">
                        <p className="font-body text-neutral-700">
                          {truncate(comment.content, 100)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        {comment.post ? (
                          <Link
                            href={`/admin/blog/${comment.post.id}`}
                            className="font-body text-primary-700 hover:text-primary-800"
                          >
                            {comment.post.title}
                          </Link>
                        ) : (
                          <span className="font-body text-neutral-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-body font-medium text-neutral-900">
                            {comment.authorName}
                          </div>
                          <div className="font-body text-sm text-neutral-500">
                            {comment.authorEmail}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-body font-medium",
                            comment.isApproved
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          )}
                        >
                          {comment.isApproved ? "Đã duyệt" : "Chờ duyệt"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-body text-neutral-700">
                          {new Date(comment.createdAt).toLocaleDateString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {!comment.isApproved && (
                            <button
                              onClick={() => handleApprove(comment.id)}
                              disabled={actionLoading === comment.id}
                              className="p-2 text-neutral-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Duyệt"
                            >
                              {actionLoading === comment.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(comment.id)}
                            disabled={actionLoading === comment.id}
                            className="p-2 text-neutral-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Xóa"
                          >
                            {actionLoading === comment.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200">
                <div className="font-body text-sm text-neutral-600">
                  Trang {currentPage} / {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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
