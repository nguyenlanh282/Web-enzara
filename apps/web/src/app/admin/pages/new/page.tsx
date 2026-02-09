"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { apiClient, ApiError } from "@/lib/api";

const pageSchema = z.object({
  title: z.string().min(1, "Tieu de khong duoc de trong"),
  slug: z
    .string()
    .min(1, "Slug khong duoc de trong")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug chi chua chu thuong, so va dau gach ngang"
    ),
  content: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  isActive: z.boolean(),
});

type PageFormData = z.infer<typeof pageSchema>;

function generateSlug(title: string): string {
  return title
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

export default function AdminNewPagePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PageFormData>({
    resolver: zodResolver(pageSchema),
    defaultValues: {
      title: "",
      slug: "",
      content: "",
      metaTitle: "",
      metaDescription: "",
      isActive: true,
    },
  });

  const isActive = watch("isActive");

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setValue("title", title);
    if (!slugManuallyEdited) {
      setValue("slug", generateSlug(title));
    }
  };

  const onSubmit = async (data: PageFormData) => {
    try {
      setSubmitting(true);
      setError("");
      await apiClient.post("/pages", data);
      router.push("/admin/pages");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Khong the tao trang. Vui long thu lai.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/pages"
          className="inline-flex items-center justify-center rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-heading font-bold text-neutral-900">
            Tao trang moi
          </h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Tao trang tinh moi cho website
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-5">
              {/* Title */}
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-neutral-700 mb-1.5"
                >
                  Tieu de <span className="text-red-500">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  {...register("title")}
                  onChange={handleTitleChange}
                  placeholder="Nhap tieu de trang"
                  className={cn(
                    "w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors",
                    "focus:border-primary-700 focus:ring-1 focus:ring-primary-700",
                    errors.title
                      ? "border-red-300 bg-red-50"
                      : "border-neutral-300"
                  )}
                />
                {errors.title && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.title.message}
                  </p>
                )}
              </div>

              {/* Slug */}
              <div>
                <label
                  htmlFor="slug"
                  className="block text-sm font-medium text-neutral-700 mb-1.5"
                >
                  Slug <span className="text-red-500">*</span>
                </label>
                <input
                  id="slug"
                  type="text"
                  {...register("slug")}
                  onChange={(e) => {
                    setSlugManuallyEdited(true);
                    setValue("slug", e.target.value);
                  }}
                  placeholder="duong-dan-trang"
                  className={cn(
                    "w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors font-mono",
                    "focus:border-primary-700 focus:ring-1 focus:ring-primary-700",
                    errors.slug
                      ? "border-red-300 bg-red-50"
                      : "border-neutral-300"
                  )}
                />
                {errors.slug && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.slug.message}
                  </p>
                )}
              </div>

              {/* Content */}
              <div>
                <label
                  htmlFor="content"
                  className="block text-sm font-medium text-neutral-700 mb-1.5"
                >
                  Noi dung
                </label>
                <textarea
                  id="content"
                  {...register("content")}
                  rows={16}
                  placeholder="Nhap noi dung trang (ho tro HTML)..."
                  className={cn(
                    "w-full rounded-lg border px-4 py-3 text-sm outline-none transition-colors resize-y font-mono",
                    "focus:border-primary-700 focus:ring-1 focus:ring-primary-700",
                    "border-neutral-300"
                  )}
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <div className="bg-white rounded-xl border border-neutral-200 p-6">
              <h3 className="text-sm font-medium text-neutral-900 mb-4">
                Trang thai
              </h3>
              <label className="flex items-center gap-3 cursor-pointer">
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
              </label>
            </div>

            {/* SEO */}
            <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
              <h3 className="text-sm font-medium text-neutral-900">SEO</h3>

              <div>
                <label
                  htmlFor="metaTitle"
                  className="block text-sm font-medium text-neutral-700 mb-1.5"
                >
                  Meta Title
                </label>
                <input
                  id="metaTitle"
                  type="text"
                  {...register("metaTitle")}
                  placeholder="Tieu de SEO"
                  className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary-700 focus:ring-1 focus:ring-primary-700"
                />
              </div>

              <div>
                <label
                  htmlFor="metaDescription"
                  className="block text-sm font-medium text-neutral-700 mb-1.5"
                >
                  Meta Description
                </label>
                <textarea
                  id="metaDescription"
                  {...register("metaDescription")}
                  rows={3}
                  placeholder="Mo ta SEO"
                  className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm outline-none transition-colors resize-y focus:border-primary-700 focus:ring-1 focus:ring-primary-700"
                />
              </div>
            </div>

            {/* Actions */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {submitting ? "Dang luu..." : "Luu trang"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
