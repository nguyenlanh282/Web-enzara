"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiClient, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Loader2, AlertCircle, Save, ArrowLeft, Trash2, Image as ImageIcon } from "lucide-react";
import Link from "next/link";

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

export default function EditBrandPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [brand, setBrand] = useState<Brand | null>(null);
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
  } = useForm<BrandFormData>({
    resolver: zodResolver(brandSchema),
  });

  const nameValue = watch("name");

  useEffect(() => {
    fetchBrand();
  }, [id]);

  useEffect(() => {
    if (nameValue && !brand) {
      setValue("slug", generateSlug(nameValue));
    }
  }, [nameValue, setValue, brand]);

  async function fetchBrand() {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<{ brand: Brand }>(`/admin/brands/${id}`);
      const fetchedBrand = response.brand;
      setBrand(fetchedBrand);

      reset({
        name: fetchedBrand.name,
        slug: fetchedBrand.slug,
        logo: fetchedBrand.logo || "",
        isActive: fetchedBrand.isActive,
      });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Không thể tải thông tin thương hiệu");
      }
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(data: BrandFormData) {
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        ...data,
        logo: data.logo || undefined,
      };
      await apiClient.put(`/admin/brands/${id}`, payload);
      router.push("/admin/brands");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Không thể cập nhật thương hiệu");
      }
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (brand?.productCount && brand.productCount > 0) {
      alert("Không thể xóa thương hiệu có sản phẩm. Vui lòng xóa hoặc chuyển sản phẩm trước.");
      return;
    }
    if (!confirm(`Bạn có chắc muốn xóa thương hiệu "${brand?.name}"?`)) {
      return;
    }
    setDeleting(true);
    try {
      await apiClient.delete(`/admin/brands/${id}`);
      router.push("/admin/brands");
    } catch (err) {
      if (err instanceof ApiError) {
        alert(`Lỗi: ${err.message}`);
      } else {
        alert("Không thể xóa thương hiệu");
      }
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-primary-700 animate-spin" />
      </div>
    );
  }

  if (error && !brand) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertCircle className="w-12 h-12 text-red-600" />
        <p className="font-body text-red-600">{error}</p>
        <Link
          href="/admin/brands"
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
          href="/admin/brands"
          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-heading text-3xl font-bold text-neutral-900">
            Chỉnh sửa thương hiệu
          </h1>
          <p className="font-body text-neutral-600 mt-1">
            Cập nhật thông tin thương hiệu
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
            {watch("logo") ? (
              <img
                src={watch("logo")}
                alt="Preview"
                className="mt-2 h-24 object-contain rounded-lg border border-neutral-200 p-2"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="mt-2 h-24 w-32 bg-neutral-100 rounded-lg border border-neutral-200 flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-neutral-400" />
              </div>
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

          {brand?.productCount && brand.productCount > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="font-body text-blue-800">
                Thương hiệu này có <strong>{brand.productCount}</strong> sản phẩm
              </p>
            </div>
          )}
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
                Xóa thương hiệu
              </>
            )}
          </button>

          <div className="flex items-center gap-4">
            <Link
              href="/admin/brands"
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
                  Cập nhật thương hiệu
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
