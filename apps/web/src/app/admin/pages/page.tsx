"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  Pencil,
  Trash2,
  FileText,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient, ApiError } from "@/lib/api";

interface PageItem {
  _id: string;
  title: string;
  slug: string;
  isActive: boolean;
  updatedAt: string;
}

export default function AdminPagesListPage() {
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchPages = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await apiClient.get<PageItem[]>("/pages");
      setPages(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Khong the tai danh sach trang");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const handleDelete = async (page: PageItem) => {
    if (!window.confirm(`Ban co chac muon xoa trang "${page.title}"?`)) return;

    try {
      setDeleting(page._id);
      await apiClient.delete(`/pages/${page._id}`);
      setPages((prev) => prev.filter((p) => p._id !== page._id));
    } catch (err) {
      if (err instanceof ApiError) {
        alert(err.message);
      } else {
        alert("Khong the xoa trang");
      }
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-neutral-900">
            Quan ly trang
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Tao va quan ly cac trang tinh cua website
          </p>
        </div>
        <Link
          href="/admin/pages/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tao trang moi
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary-700" />
          <span className="ml-2 text-sm text-neutral-500">Dang tai...</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && pages.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-neutral-200">
          <FileText className="w-12 h-12 text-neutral-300 mb-3" />
          <p className="text-sm text-neutral-500 mb-4">
            Chua co trang nao duoc tao
          </p>
          <Link
            href="/admin/pages/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary-700 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tao trang dau tien
          </Link>
        </div>
      )}

      {/* Table */}
      {!loading && pages.length > 0 && (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="text-left px-5 py-3 font-medium text-neutral-600">
                    Tieu de
                  </th>
                  <th className="text-left px-5 py-3 font-medium text-neutral-600">
                    Slug
                  </th>
                  <th className="text-left px-5 py-3 font-medium text-neutral-600">
                    Trang thai
                  </th>
                  <th className="text-left px-5 py-3 font-medium text-neutral-600">
                    Cap nhat
                  </th>
                  <th className="text-right px-5 py-3 font-medium text-neutral-600">
                    Thao tac
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {pages.map((page) => (
                  <tr
                    key={page._id}
                    className="hover:bg-neutral-50 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <span className="font-medium text-neutral-900">
                        {page.title}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <code className="text-xs bg-neutral-100 rounded px-2 py-1 text-neutral-600">
                        /{page.slug}
                      </code>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                          page.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-neutral-100 text-neutral-500"
                        )}
                      >
                        {page.isActive ? "Hoat dong" : "An"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-neutral-500">
                      {formatDate(page.updatedAt)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/pages/${page.slug}/edit`}
                          className="inline-flex items-center justify-center rounded-lg p-2 text-neutral-500 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                          title="Chinh sua"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(page)}
                          disabled={deleting === page._id}
                          className="inline-flex items-center justify-center rounded-lg p-2 text-neutral-500 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                          title="Xoa"
                        >
                          {deleting === page._id ? (
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
        </div>
      )}
    </div>
  );
}
