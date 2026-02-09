"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiClient, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Loader2, AlertCircle, Save, Trash2, ChevronRight, ChevronDown, Plus, Edit } from "lucide-react";

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
  children?: Category[];
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

function buildCategoryTree(categories: Category[]): Category[] {
  const map = new Map<string, Category>();
  const roots: Category[] = [];

  categories.forEach((cat) => {
    map.set(cat.id, { ...cat, children: [] });
  });

  categories.forEach((cat) => {
    const node = map.get(cat.id)!;
    if (cat.parentId) {
      const parent = map.get(cat.parentId);
      if (parent) {
        parent.children!.push(node);
      } else {
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  return roots.sort((a, b) => a.sortOrder - b.sortOrder);
}

function CategoryTreeNode({
  category,
  level,
  onEdit,
  onDelete,
  deleteLoading,
}: {
  category: Category;
  level: number;
  onEdit: (category: Category) => void;
  onDelete: (id: string, name: string, hasProducts: boolean) => void;
  deleteLoading: string | null;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = category.children && category.children.length > 0;

  return (
    <div>
      <div
        className="flex items-center gap-2 py-2 px-3 hover:bg-neutral-50 rounded-lg"
        style={{ paddingLeft: `${level * 1.5 + 0.75}rem` }}
      >
        {hasChildren ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 hover:bg-neutral-100 rounded"
          >
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-neutral-600" />
            ) : (
              <ChevronRight className="w-4 h-4 text-neutral-600" />
            )}
          </button>
        ) : (
          <div className="w-6" />
        )}

        <div className="flex-1 flex items-center gap-3">
          <span className="font-body font-medium text-neutral-900">{category.name}</span>
          <span className="text-xs font-body text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
            {category.slug}
          </span>
          <span
            className={cn(
              "text-xs font-body px-2 py-0.5 rounded",
              category.isActive
                ? "bg-green-100 text-green-800"
                : "bg-neutral-100 text-neutral-800"
            )}
          >
            {category.isActive ? "Hoạt động" : "Ẩn"}
          </span>
          {(category.productCount ?? 0) > 0 && (
            <span className="text-xs font-body text-neutral-500">
              {category.productCount} sản phẩm
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(category)}
            className="p-2 text-neutral-600 hover:text-primary-700 hover:bg-neutral-100 rounded-lg transition-colors"
            title="Chỉnh sửa"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(category.id, category.name, (category.productCount ?? 0) > 0)}
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
      </div>

      {expanded && hasChildren && (
        <div>
          {category.children!.map((child) => (
            <CategoryTreeNode
              key={child.id}
              category={child}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              deleteLoading={deleteLoading}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryTree, setCategoryTree] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      isActive: true,
      sortOrder: 0,
      parentId: null,
    },
  });

  const nameValue = watch("name");

  useEffect(() => {
    if (nameValue && !editingCategory) {
      setValue("slug", generateSlug(nameValue));
    }
  }, [nameValue, setValue, editingCategory]);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<{ categories: Category[] }>("/admin/categories");
      setCategories(response.categories || []);
      setCategoryTree(buildCategoryTree(response.categories || []));
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Không thể tải danh sách danh mục");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(category: Category) {
    setEditingCategory(category);
    reset({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      image: category.image || "",
      parentId: category.parentId || "",
      sortOrder: category.sortOrder,
      isActive: category.isActive,
      metaTitle: category.metaTitle || "",
      metaDescription: category.metaDescription || "",
    });
  }

  function handleCancelEdit() {
    setEditingCategory(null);
    reset({
      name: "",
      slug: "",
      description: "",
      image: "",
      parentId: "",
      sortOrder: 0,
      isActive: true,
      metaTitle: "",
      metaDescription: "",
    });
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

      if (editingCategory) {
        await apiClient.put(`/admin/categories/${editingCategory.id}`, payload);
      } else {
        await apiClient.post("/admin/categories", payload);
      }

      await fetchCategories();
      handleCancelEdit();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(editingCategory ? "Không thể cập nhật danh mục" : "Không thể tạo danh mục");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string, name: string, hasProducts: boolean) {
    if (hasProducts) {
      alert("Không thể xóa danh mục có sản phẩm. Vui lòng xóa hoặc chuyển sản phẩm trước.");
      return;
    }
    if (!confirm(`Bạn có chắc muốn xóa danh mục "${name}"?`)) {
      return;
    }
    setDeleteLoading(id);
    try {
      await apiClient.delete(`/admin/categories/${id}`);
      await fetchCategories();
      if (editingCategory?.id === id) {
        handleCancelEdit();
      }
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

  const availableParents = categories.filter((cat) => cat.id !== editingCategory?.id);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-neutral-900">
          Quản lý danh mục
        </h1>
        <p className="font-body text-neutral-600 mt-1">
          Quản lý cây danh mục sản phẩm
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-2 text-red-800">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="font-body">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-neutral-200">
          <div className="p-4 border-b border-neutral-200">
            <h2 className="font-heading text-xl font-bold text-neutral-900">
              Cây danh mục
            </h2>
          </div>

          <div className="p-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-primary-700 animate-spin" />
              </div>
            ) : categoryTree.length === 0 ? (
              <div className="text-center py-12 text-neutral-500 font-body">
                Chưa có danh mục nào
              </div>
            ) : (
              <div className="space-y-1">
                {categoryTree.map((category) => (
                  <CategoryTreeNode
                    key={category.id}
                    category={category}
                    level={0}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    deleteLoading={deleteLoading}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200">
          <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
            <h2 className="font-heading text-xl font-bold text-neutral-900">
              {editingCategory ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
            </h2>
            {editingCategory && (
              <button
                onClick={handleCancelEdit}
                className="text-sm font-body text-neutral-600 hover:text-neutral-900"
              >
                Hủy chỉnh sửa
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
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
                rows={3}
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
                  className="mt-2 w-32 h-32 object-cover rounded-lg border border-neutral-200"
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
                  {availableParents.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
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
                rows={2}
                className="w-full px-4 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-2 bg-primary-700 text-white rounded-xl font-body font-medium hover:bg-primary-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {editingCategory ? "Đang cập nhật..." : "Đang tạo..."}
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    {editingCategory ? "Cập nhật danh mục" : "Tạo danh mục"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
