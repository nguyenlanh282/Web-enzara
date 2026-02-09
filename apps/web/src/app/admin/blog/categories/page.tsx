"use client";

import { useEffect, useState } from "react";
import { apiClient, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Loader2, AlertCircle, Edit, Trash2, Save, Plus } from "lucide-react";

interface PostCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  postCount?: number;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function BlogCategoriesPage() {
  const [categories, setCategories] = useState<PostCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    sortOrder: 0,
    isActive: true,
  });
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (formData.name && !slugManuallyEdited) {
      setFormData((prev) => ({ ...prev, slug: generateSlug(formData.name) }));
    }
  }, [formData.name, slugManuallyEdited]);

  async function fetchCategories() {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<{ categories: PostCategory[] }>("/post-categories");
      setCategories(response.categories || []);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Không thể tải danh mục");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(category: PostCategory) {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      sortOrder: category.sortOrder,
      isActive: category.isActive,
    });
    setSlugManuallyEdited(false);
  }

  function handleCancelEdit() {
    setEditingId(null);
    setFormData({
      name: "",
      slug: "",
      description: "",
      sortOrder: 0,
      isActive: true,
    });
    setSlugManuallyEdited(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Tên danh mục là bắt buộc");
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await apiClient.put(`/admin/post-categories/${editingId}`, formData);
      } else {
        await apiClient.post("/admin/post-categories", formData);
      }
      await fetchCategories();
      handleCancelEdit();
    } catch (err) {
      if (err instanceof ApiError) {
        alert(`Lỗi: ${err.message}`);
      } else {
        alert(editingId ? "Không thể cập nhật danh mục" : "Không thể tạo danh mục");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Bạn có chắc muốn xóa danh mục "${name}"?`)) {
      return;
    }
    setDeleteLoading(id);
    try {
      await apiClient.delete(`/admin/post-categories/${id}`);
      await fetchCategories();
    } catch (err) {
      if (err instanceof ApiError) {
        alert(`Lỗi: ${err.message}`);
      } else {
        alert("Không thể xóa danh mục");
      }
    } finally {
      setDeleteLoading(null);
    }
  }

  async function toggleActive(id: string, isActive: boolean) {
    try {
      await apiClient.put(`/admin/post-categories/${id}`, { isActive: !isActive });
      await fetchCategories();
    } catch (err) {
      if (err instanceof ApiError) {
        alert(`Lỗi: ${err.message}`);
      } else {
        alert("Không thể cập nhật trạng thái");
      }
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-neutral-900">
          Danh mục blog
        </h1>
        <p className="font-body text-neutral-600 mt-1">
          Quản lý danh mục bài viết blog
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 font-body">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-primary-700 animate-spin" />
              </div>
            ) : categories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
                <AlertCircle className="w-12 h-12 mb-2" />
                <p className="font-body">Chưa có danh mục nào</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-body font-semibold text-neutral-900">
                        Tên
                      </th>
                      <th className="px-4 py-3 text-left font-body font-semibold text-neutral-900">
                        Slug
                      </th>
                      <th className="px-4 py-3 text-left font-body font-semibold text-neutral-900">
                        Bài viết
                      </th>
                      <th className="px-4 py-3 text-left font-body font-semibold text-neutral-900">
                        Thứ tự
                      </th>
                      <th className="px-4 py-3 text-left font-body font-semibold text-neutral-900">
                        Trạng thái
                      </th>
                      <th className="px-4 py-3 text-right font-body font-semibold text-neutral-900">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {categories.map((category) => (
                      <tr key={category.id} className="hover:bg-neutral-50">
                        <td className="px-4 py-3">
                          <span className="font-body font-medium text-neutral-900">
                            {category.name}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm text-neutral-600">
                            {category.slug}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-body text-neutral-700">
                            {category.postCount || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-body text-neutral-700">
                            {category.sortOrder}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleActive(category.id, category.isActive)}
                            className={cn(
                              "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-body font-medium transition-colors",
                              category.isActive
                                ? "bg-green-100 text-green-800 hover:bg-green-200"
                                : "bg-neutral-100 text-neutral-800 hover:bg-neutral-200"
                            )}
                          >
                            {category.isActive ? "Hoạt động" : "Ẩn"}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(category)}
                              className="p-2 text-neutral-600 hover:text-primary-700 hover:bg-neutral-100 rounded-lg transition-colors"
                              title="Chỉnh sửa"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(category.id, category.name)}
                              disabled={deleteLoading === category.id}
                              className="p-2 text-neutral-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Xóa"
                            >
                              {deleteLoading === category.id ? (
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
            )}
          </div>
        </div>

        <div>
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <h2 className="font-heading text-xl font-semibold text-neutral-900 mb-4">
              {editingId ? "Chỉnh sửa danh mục" : "Tạo danh mục mới"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-body text-sm font-medium text-neutral-700 mb-2">
                  Tên danh mục *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
                  placeholder="Tên danh mục"
                  required
                />
              </div>

              <div>
                <label className="block font-body text-sm font-medium text-neutral-700 mb-2">
                  Slug *
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => {
                    setSlugManuallyEdited(true);
                    setFormData({ ...formData, slug: e.target.value });
                  }}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-700"
                  placeholder="slug-danh-muc"
                  required
                />
              </div>

              <div>
                <label className="block font-body text-sm font-medium text-neutral-700 mb-2">
                  Mô tả
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
                  placeholder="Mô tả danh mục"
                />
              </div>

              <div>
                <label className="block font-body text-sm font-medium text-neutral-700 mb-2">
                  Thứ tự hiển thị
                </label>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
                  min="0"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-primary-700 border-neutral-300 rounded focus:ring-2 focus:ring-primary-700"
                />
                <label htmlFor="isActive" className="font-body text-sm text-neutral-700">
                  Kích hoạt
                </label>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-body font-medium transition-colors",
                    submitting
                      ? "bg-neutral-300 text-neutral-500 cursor-not-allowed"
                      : "bg-primary-700 text-white hover:bg-primary-800"
                  )}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      {editingId ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                      {editingId ? "Cập nhật" : "Tạo mới"}
                    </>
                  )}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2 border border-neutral-200 rounded-lg font-body font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                  >
                    Hủy
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
