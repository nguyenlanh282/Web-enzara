"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  Trash2,
  Pencil,
  X,
  Loader2,
  AlertCircle,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient, ApiError } from "@/lib/api";

interface Banner {
  _id: string;
  title: string;
  imageUrl: string;
  mobileImageUrl?: string;
  link?: string;
  position: string;
  sortOrder: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

const bannerSchema = z.object({
  title: z.string().min(1, "Tieu de khong duoc de trong"),
  imageUrl: z.string().url("URL hinh anh khong hop le"),
  mobileImageUrl: z.string().url("URL khong hop le").or(z.literal("")).optional(),
  link: z.string().optional(),
  position: z.enum(["hero", "sidebar", "popup"], {
    required_error: "Vui long chon vi tri",
  }),
  sortOrder: z.coerce.number().min(0, "Thu tu phai >= 0"),
  isActive: z.boolean(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type BannerFormData = z.infer<typeof bannerSchema>;

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BannerFormData>({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      title: "",
      imageUrl: "",
      mobileImageUrl: "",
      link: "",
      position: "hero",
      sortOrder: 0,
      isActive: true,
      startDate: "",
      endDate: "",
    },
  });

  const isActive = watch("isActive");
  const imageUrl = watch("imageUrl");

  const fetchBanners = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await apiClient.get<Banner[]>("/banners/admin");
      setBanners(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Khong the tai danh sach banner");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const openCreateForm = () => {
    setEditingBanner(null);
    reset({
      title: "",
      imageUrl: "",
      mobileImageUrl: "",
      link: "",
      position: "hero",
      sortOrder: 0,
      isActive: true,
      startDate: "",
      endDate: "",
    });
    setFormError("");
    setShowForm(true);
  };

  const openEditForm = (banner: Banner) => {
    setEditingBanner(banner);
    reset({
      title: banner.title,
      imageUrl: banner.imageUrl,
      mobileImageUrl: banner.mobileImageUrl || "",
      link: banner.link || "",
      position: banner.position as "hero" | "sidebar" | "popup",
      sortOrder: banner.sortOrder,
      isActive: banner.isActive,
      startDate: banner.startDate
        ? new Date(banner.startDate).toISOString().slice(0, 16)
        : "",
      endDate: banner.endDate
        ? new Date(banner.endDate).toISOString().slice(0, 16)
        : "",
    });
    setFormError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingBanner(null);
    setFormError("");
  };

  const onSubmit = async (data: BannerFormData) => {
    try {
      setSubmitting(true);
      setFormError("");

      const payload = {
        ...data,
        mobileImageUrl: data.mobileImageUrl || undefined,
        link: data.link || undefined,
        startDate: data.startDate || undefined,
        endDate: data.endDate || undefined,
      };

      if (editingBanner) {
        const updated = await apiClient.put<Banner>(
          `/banners/${editingBanner._id}`,
          payload
        );
        setBanners((prev) =>
          prev.map((b) => (b._id === editingBanner._id ? updated : b))
        );
      } else {
        const created = await apiClient.post<Banner>("/banners", payload);
        setBanners((prev) => [...prev, created]);
      }

      closeForm();
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message);
      } else {
        setFormError("Khong the luu banner. Vui long thu lai.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (banner: Banner) => {
    if (!window.confirm(`Ban co chac muon xoa banner "${banner.title}"?`))
      return;

    try {
      setDeleting(banner._id);
      await apiClient.delete(`/banners/${banner._id}`);
      setBanners((prev) => prev.filter((b) => b._id !== banner._id));
    } catch (err) {
      if (err instanceof ApiError) {
        alert(err.message);
      } else {
        alert("Khong the xoa banner");
      }
    } finally {
      setDeleting(null);
    }
  };

  const positionLabel = (pos: string) => {
    const map: Record<string, string> = {
      hero: "Hero",
      sidebar: "Sidebar",
      popup: "Popup",
    };
    return map[pos] || pos;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-neutral-900">
            Quan ly banner
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Quan ly hinh anh banner tren website
          </p>
        </div>
        <button
          onClick={openCreateForm}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Them banner
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Form Section */}
      {showForm && (
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-heading font-semibold text-neutral-900">
              {editingBanner ? "Chinh sua banner" : "Them banner moi"}
            </h2>
            <button
              onClick={closeForm}
              className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {formError && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 mb-4">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Tieu de <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register("title")}
                  placeholder="Tieu de banner"
                  className={cn(
                    "w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors",
                    "focus:border-primary-700 focus:ring-1 focus:ring-primary-700",
                    errors.title ? "border-red-300 bg-red-50" : "border-neutral-300"
                  )}
                />
                {errors.title && (
                  <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>
                )}
              </div>

              {/* Position */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Vi tri <span className="text-red-500">*</span>
                </label>
                <select
                  {...register("position")}
                  className={cn(
                    "w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors bg-white",
                    "focus:border-primary-700 focus:ring-1 focus:ring-primary-700",
                    errors.position ? "border-red-300 bg-red-50" : "border-neutral-300"
                  )}
                >
                  <option value="hero">Hero</option>
                  <option value="sidebar">Sidebar</option>
                  <option value="popup">Popup</option>
                </select>
                {errors.position && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.position.message}
                  </p>
                )}
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  URL hinh anh <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register("imageUrl")}
                  placeholder="https://example.com/banner.jpg"
                  className={cn(
                    "w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors",
                    "focus:border-primary-700 focus:ring-1 focus:ring-primary-700",
                    errors.imageUrl ? "border-red-300 bg-red-50" : "border-neutral-300"
                  )}
                />
                {errors.imageUrl && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.imageUrl.message}
                  </p>
                )}
              </div>

              {/* Mobile Image URL */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  URL hinh mobile
                </label>
                <input
                  type="text"
                  {...register("mobileImageUrl")}
                  placeholder="https://example.com/banner-mobile.jpg"
                  className={cn(
                    "w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors",
                    "focus:border-primary-700 focus:ring-1 focus:ring-primary-700",
                    errors.mobileImageUrl
                      ? "border-red-300 bg-red-50"
                      : "border-neutral-300"
                  )}
                />
                {errors.mobileImageUrl && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.mobileImageUrl.message}
                  </p>
                )}
              </div>

              {/* Link */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Lien ket
                </label>
                <input
                  type="text"
                  {...register("link")}
                  placeholder="/san-pham hoac https://..."
                  className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary-700 focus:ring-1 focus:ring-primary-700"
                />
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Thu tu sap xep
                </label>
                <input
                  type="number"
                  {...register("sortOrder")}
                  min={0}
                  className={cn(
                    "w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors",
                    "focus:border-primary-700 focus:ring-1 focus:ring-primary-700",
                    errors.sortOrder
                      ? "border-red-300 bg-red-50"
                      : "border-neutral-300"
                  )}
                />
                {errors.sortOrder && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.sortOrder.message}
                  </p>
                )}
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Ngay bat dau
                </label>
                <input
                  type="datetime-local"
                  {...register("startDate")}
                  className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary-700 focus:ring-1 focus:ring-primary-700"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Ngay ket thuc
                </label>
                <input
                  type="datetime-local"
                  {...register("endDate")}
                  className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary-700 focus:ring-1 focus:ring-primary-700"
                />
              </div>
            </div>

            {/* isActive toggle */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={isActive}
                onClick={() => setValue("isActive", !isActive)}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                  isActive ? "bg-primary-700" : "bg-neutral-300"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 rounded-full bg-white transition-transform",
                    isActive ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
              <span className="text-sm text-neutral-700">
                {isActive ? "Hoat dong" : "An"}
              </span>
            </div>

            {/* Image Preview */}
            {imageUrl && (
              <div>
                <p className="text-sm font-medium text-neutral-700 mb-1.5">
                  Xem truoc
                </p>
                <div className="relative rounded-lg border border-neutral-200 overflow-hidden bg-neutral-50 max-w-md">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-40 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              </div>
            )}

            {/* Submit */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-lg bg-primary-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingBanner ? "Cap nhat" : "Them banner"}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                Huy
              </button>
            </div>
          </form>
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
      {!loading && !error && banners.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-neutral-200">
          <ImageIcon className="w-12 h-12 text-neutral-300 mb-3" />
          <p className="text-sm text-neutral-500 mb-4">
            Chua co banner nao
          </p>
          <button
            onClick={openCreateForm}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-700 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Them banner dau tien
          </button>
        </div>
      )}

      {/* Banners Grid */}
      {!loading && banners.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {banners.map((banner) => (
            <div
              key={banner._id}
              className="bg-white rounded-xl border border-neutral-200 overflow-hidden group"
            >
              {/* Image */}
              <div className="relative aspect-[16/9] bg-neutral-100">
                <img
                  src={banner.imageUrl}
                  alt={banner.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "";
                    (e.target as HTMLImageElement).alt = "Loi hinh anh";
                  }}
                />
                <div className="absolute top-2 right-2 flex items-center gap-1.5">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      banner.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-neutral-100 text-neutral-500"
                    )}
                  >
                    {banner.isActive ? "Hoat dong" : "An"}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-medium text-neutral-900 text-sm mb-1 truncate">
                  {banner.title}
                </h3>
                <div className="flex items-center gap-3 text-xs text-neutral-500">
                  <span className="inline-flex items-center rounded bg-neutral-100 px-2 py-0.5">
                    {positionLabel(banner.position)}
                  </span>
                  <span>Thu tu: {banner.sortOrder}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 mt-3 pt-3 border-t border-neutral-100">
                  <button
                    onClick={() => openEditForm(banner)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-neutral-600 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Sua
                  </button>
                  <button
                    onClick={() => handleDelete(banner)}
                    disabled={deleting === banner._id}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-neutral-600 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                  >
                    {deleting === banner._id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    Xoa
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
