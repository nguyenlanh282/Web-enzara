"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiClient, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Loader2, AlertCircle, Save, ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string | null;
  sortOrder: number;
  isActive: boolean;
  metaTitle?: string;
  metaDescription?: string;
  productCount?: number;
}

const categorySchema = z.object({
  name: z.string().min(1, "Tên danh mục là bắt buộc"),
  slug: z.string().min(1, "Slug là bắt buộc"),
  description: z.string().optional(),
  image: z.string().url("URL hình ảnh không hợp lệ").optional().or(z.literal("")),
  parentId: z.string().optional().nullable(),
  sortOrder: z.number().min(0, "Thứ tự phải lớn hơn hoặc bằng 0"),
  isActive: z.boolean(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

function generateSlug(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [category, setCategory] = useState<Category | null>(null);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
  });

  const nameValue = watch("name");

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    if (nameValue && !category) {
      setValue("slug", generateSlug(nameValue));
    }
  }, [nameValue, setValue, category]);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const [categoryRes, categoriesRes] = await Promise.all([
        apiClient.get<{ category: Category }>(`/admin/categories/${id}`),
        apiClient.get<{ categories: Category[] }>("/admin/categories"),
      ]);

      const fetchedCategory = categoryRes.category;
      setCategory(fetchedCategory);
      setAllCategories(categoriesRes.categories || []);

      reset({
        name: fetchedCategory.name,
        slug: fetchedCategory.slug,
        description: fetchedCategory.description || "",
        image: fetchedCategory.image || "",
        parentId: fetchedCategory.parentId || "",
        sortOrder: fetchedCategory.sortOrder,
        isActive: fetchedCategory.isActive,
        metaTitle: fetchedCategory.metaTitle || "",
        metaDescription: fetchedCategory.metaDescription || "",
      });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Không thể tải thông tin danh mục");
      }
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(data: CategoryFormData) {
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        ...data,
        parentId: data.parentId || null,
        image: data.image || undefined,
      };
      await apiClient.put(`/admin/categories/${id}`, payload);
      router.push("/admin/categories");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Không thể cập nhật danh mục");
      }
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (category?.productCount && category.productCount > 0) {
      alert("Không thể xóa danh mục có sản phẩm. Vui lòng xóa hoặc chuyển sản phẩm trước.");
      return;
    }
    if (!confirm(`Bạn có chắc muốn xóa danh mục "${category?.name}"?`)) {
      return;
    }
    setDeleting(true);
    try {
      await apiClient.delete(`/admin/categories/${id}`);
      router.push("/admin/categories");
    } catch (err) {
      if (err instanceof ApiError) {
        alert(`Lỗi: ${err.message}`);
      } else {
        alert("Không thể xóa danh mục");
      }
      setDeleting(false);
    }
  }

  const availableParents = allCategories.filter((cat) => cat.id !== id);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-primary-700 animate-spin" />
      </div>
    );
  }

  if (error && !category) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertCircle className="w-12 h-12 text-red-600" />
        <p className="font-body text-red-600">{error}</p>
        <Link
          href="/admin/categories"
          className="px-4 py-2 bg-primary-700 text-white rounded-xl font-body font-medium hover:bg-primary-800 transition-colors"
        >
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/categories"
          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-heading text-3xl font-bold text-neutral-900">
            Chỉnh sửa danh mục
          </h1>
          <p className="font-body text-neutral-600 mt-1">
            Cập nhật thông tin danh mục
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-2 text-red-800">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="font-body">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
          <div>
            <label className="block font-body font-medium text-neutral-900 mb-2">
              Tên danh mục <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              {...register("name")}
              className="w-full px-4 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 font-body">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block font-body font-medium text-neutral-900 mb-2">
              Slug <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              {...register("slug")}
              className="w-full px-4 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
            />
            {errors.slug && (
              <p className="mt-1 text-sm text-red-600 font-body">{errors.slug.message}</p>
            )}
          </div>

          <div>
            <label className="block font-body font-medium text-neutral-900 mb-2">
              Mô tả
            </label>
            <textarea
              {...register("description")}
              rows={4}
              className="w-full px-4 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
            />
          </div>

          <div>
            <label className="block font-body font-medium text-neutral-900 mb-2">
              URL hình ảnh
            </label>
            <input
              type="url"
              {...register("image")}
              className="w-full px-4 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
            />
            {errors.image && (
              <p className="mt-1 text-sm text-red-600 font-body">{errors.image.message}</p>
            )}
            {watch("image") && (
              <img
                src={watch("image")}
                alt="Preview"
                className="mt-2 w-40 h-40 object-cover rounded-lg border border-neutral-200"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-body font-medium text-neutral-900 mb-2">
                Danh mục cha
              </label>
              <select
                {...register("parentId")}
                className="w-full px-4 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
              >
                <option value="">Không có</option>
                {availableParents.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-body font-medium text-neutral-900 mb-2">
                Thứ tự
              </label>
              <input
                type="number"
                {...register("sortOrder", { valueAsNumber: true })}
                className="w-full px-4 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register("isActive")}
                className="w-4 h-4 text-primary-700 border-neutral-300 rounded focus:ring-primary-700"
              />
              <span className="font-body text-neutral-900">Kích hoạt danh mục</span>
            </label>
          </div>

          <div>
            <label className="block font-body font-medium text-neutral-900 mb-2">
              Meta Title
            </label>
            <input
              type="text"
              {...register("metaTitle")}
              className="w-full px-4 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
            />
          </div>

          <div>
            <label className="block font-body font-medium text-neutral-900 mb-2">
              Meta Description
            </label>
            <textarea
              {...register("metaDescription")}
              rows={3}
              className="w-full px-4 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-xl font-body font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Đang xóa...
              </>
            ) : (
              <>
                <Trash2 className="w-5 h-5" />
                Xóa danh mục
              </>
            )}
          </button>

          <div className="flex items-center gap-4">
            <Link
              href="/admin/categories"
              className="px-6 py-2 border border-neutral-200 rounded-xl font-body font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              Hủy
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2 bg-primary-700 text-white rounded-xl font-body font-medium hover:bg-primary-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Cập nhật danh mục
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
