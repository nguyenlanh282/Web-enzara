"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { apiClient, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Loader2, AlertCircle, Save, Trash2, Edit, Plus, Image as ImageIcon } from "lucide-react";

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  isActive: boolean;
  productCount?: number;
}

const brandSchema = z.object({
  name: z.string().min(1, "Tên thương hiệu là bắt buộc"),
  slug: z.string().min(1, "Slug là bắt buộc"),
  logo: z.string().url("URL logo không hợp lệ").optional().or(z.literal("")),
  isActive: z.boolean(),
});

type BrandFormData = z.infer<typeof brandSchema>;

function generateSlug(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [showForm, setShowForm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<BrandFormData>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      isActive: true,
    },
  });

  const nameValue = watch("name");

  useEffect(() => {
    if (nameValue && !editingBrand) {
      setValue("slug", generateSlug(nameValue));
    }
  }, [nameValue, setValue, editingBrand]);

  useEffect(() => {
    fetchBrands();
  }, []);

  async function fetchBrands() {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<{ brands: Brand[] }>("/admin/brands");
      setBrands(response.brands || []);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Không thể tải danh sách thương hiệu");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(brand: Brand) {
    setEditingBrand(brand);
    setShowForm(true);
    reset({
      name: brand.name,
      slug: brand.slug,
      logo: brand.logo || "",
      isActive: brand.isActive,
    });
  }

  function handleCancelEdit() {
    setEditingBrand(null);
    setShowForm(false);
    reset({
      name: "",
      slug: "",
      logo: "",
      isActive: true,
    });
  }

  async function onSubmit(data: BrandFormData) {
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        ...data,
        logo: data.logo || undefined,
      };

      if (editingBrand) {
        await apiClient.put(`/admin/brands/${editingBrand.id}`, payload);
      } else {
        await apiClient.post("/admin/brands", payload);
      }

      await fetchBrands();
      handleCancelEdit();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(editingBrand ? "Không thể cập nhật thương hiệu" : "Không thể tạo thương hiệu");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string, name: string, hasProducts: boolean) {
    if (hasProducts) {
      alert("Không thể xóa thương hiệu có sản phẩm. Vui lòng xóa hoặc chuyển sản phẩm trước.");
      return;
    }
    if (!confirm(`Bạn có chắc muốn xóa thương hiệu "${name}"?`)) {
      return;
    }
    setDeleteLoading(id);
    try {
      await apiClient.delete(`/admin/brands/${id}`);
      await fetchBrands();
      if (editingBrand?.id === id) {
        handleCancelEdit();
      }
    } catch (err) {
      if (err instanceof ApiError) {
        alert(`Lỗi: ${err.message}`);
      } else {
        alert("Không thể xóa thương hiệu");
      }
    } finally {
      setDeleteLoading(null);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-neutral-900">
            Quản lý thương hiệu
          </h1>
          <p className="font-body text-neutral-600 mt-1">
            Quản lý danh sách thương hiệu sản phẩm
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-700 text-white rounded-xl font-body font-medium hover:bg-primary-800 transition-colors"
        >
          <Plus className="w-5 h-5" />
          {showForm ? "Ẩn form" : "Thêm thương hiệu"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-2 text-red-800">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="font-body">{error}</span>
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-xl font-bold text-neutral-900">
              {editingBrand ? "Chỉnh sửa thương hiệu" : "Thêm thương hiệu mới"}
            </h2>
            {editingBrand && (
              <button
                onClick={handleCancelEdit}
                className="text-sm font-body text-neutral-600 hover:text-neutral-900"
              >
                Hủy chỉnh sửa
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-body font-medium text-neutral-900 mb-2">
                  Tên thương hiệu <span className="text-red-600">*</span>
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
            </div>

            <div>
              <label className="block font-body font-medium text-neutral-900 mb-2">
                URL Logo
              </label>
              <input
                type="url"
                {...register("logo")}
                className="w-full px-4 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
              />
              {errors.logo && (
                <p className="mt-1 text-sm text-red-600 font-body">{errors.logo.message}</p>
              )}
              {watch("logo") && (
                <img
                  src={watch("logo")}
                  alt="Preview"
                  className="mt-2 h-20 object-contain rounded-lg border border-neutral-200 p-2"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register("isActive")}
                  className="w-4 h-4 text-primary-700 border-neutral-300 rounded focus:ring-primary-700"
                />
                <span className="font-body text-neutral-900">Kích hoạt thương hiệu</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-4">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-6 py-2 border border-neutral-200 rounded-xl font-body font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-2 bg-primary-700 text-white rounded-xl font-body font-medium hover:bg-primary-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {editingBrand ? "Đang cập nhật..." : "Đang tạo..."}
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    {editingBrand ? "Cập nhật" : "Tạo thương hiệu"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-neutral-200">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary-700 animate-spin" />
          </div>
        ) : brands.length === 0 ? (
          <div className="text-center py-12 text-neutral-500 font-body">
            Chưa có thương hiệu nào
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
            {brands.map((brand) => (
              <div
                key={brand.id}
                className="border border-neutral-200 rounded-xl p-4 space-y-3 hover:border-primary-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    {brand.logo ? (
                      <img
                        src={brand.logo}
                        alt={brand.name}
                        className="h-16 w-auto object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.nextElementSibling?.classList.remove("hidden");
                        }}
                      />
                    ) : null}
                    <div
                      className={cn(
                        "flex items-center justify-center h-16 bg-neutral-100 rounded-lg",
                        brand.logo && "hidden"
                      )}
                    >
                      <ImageIcon className="w-8 h-8 text-neutral-400" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-body font-bold text-neutral-900 text-lg">
                    {brand.name}
                  </h3>
                  <p className="text-sm font-body text-neutral-500">{brand.slug}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-body font-medium",
                      brand.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-neutral-100 text-neutral-800"
                    )}
                  >
                    {brand.isActive ? "Hoạt động" : "Ẩn"}
                  </span>
                  {(brand.productCount ?? 0) > 0 && (
                    <span className="text-xs font-body text-neutral-500">
                      {brand.productCount} sản phẩm
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => handleEdit(brand)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 border border-neutral-200 rounded-lg font-body text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(brand.id, brand.name, (brand.productCount ?? 0) > 0)}
                    disabled={deleteLoading === brand.id}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 border border-red-200 rounded-lg font-body text-sm font-medium text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {deleteLoading === brand.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
