"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { apiClient, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Loader2, Save, ArrowLeft, X } from "lucide-react";
import RichTextEditor from "@/components/admin/shared/RichTextEditor";
import ImageUpload from "@/components/admin/shared/ImageUpload";

const postSchema = z.object({
  title: z.string().min(1, "Tiêu đề là bắt buộc"),
  slug: z.string().min(1, "Slug là bắt buộc"),
  excerpt: z.string().optional(),
  content: z.string().min(1, "Nội dung là bắt buộc"),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  publishedAt: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  featuredImage: z.string().optional().nullable(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});

type PostFormData = z.infer<typeof postSchema>;

interface PostCategory {
  id: string;
  name: string;
}

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  publishedAt: string | null;
  categoryId: string | null;
  tags: string[];
  featuredImage: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
}

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

function calculateReadingTime(html: string): number {
  const text = html.replace(/<[^>]+>/g, "");
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}

export default function EditBlogPostPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [categories, setCategories] = useState<PostCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      status: "DRAFT",
      tags: [],
    },
  });

  const titleValue = watch("title");
  const contentValue = watch("content");
  const statusValue = watch("status");

  useEffect(() => {
    if (titleValue && !slugManuallyEdited) {
      setValue("slug", generateSlug(titleValue));
    }
  }, [titleValue, slugManuallyEdited, setValue]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const [postRes, categoriesRes] = await Promise.all([
        apiClient.get<{ post: Post }>(`/admin/posts/${params.id}`),
        apiClient.get<{ categories: PostCategory[] }>("/post-categories"),
      ]);

      const post = postRes.post;
      setCategories(categoriesRes.categories || []);

      setValue("title", post.title);
      setValue("slug", post.slug);
      setValue("excerpt", post.excerpt || "");
      setValue("content", post.content);
      setValue("status", post.status);
      setValue("publishedAt", post.publishedAt ? new Date(post.publishedAt).toISOString().slice(0, 16) : "");
      setValue("categoryId", post.categoryId || "");
      setValue("featuredImage", post.featuredImage || "");
      setValue("metaTitle", post.metaTitle || "");
      setValue("metaDescription", post.metaDescription || "");
      setTags(post.tags || []);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Không thể tải bài viết");
      }
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(data: PostFormData) {
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        ...data,
        tags,
        publishedAt: data.status === "PUBLISHED" && data.publishedAt ? data.publishedAt : null,
      };
      await apiClient.put(`/admin/posts/${params.id}`, payload);
      router.push("/admin/blog");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Không thể cập nhật bài viết");
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleTagInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (tagInput.trim() && !tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
        setTagInput("");
      }
    }
  }

  function removeTag(tagToRemove: string) {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  }

  const readingTime = contentValue ? calculateReadingTime(contentValue) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-primary-700 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/blog"
          className="p-2 text-neutral-600 hover:text-primary-700 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="font-heading text-3xl font-bold text-neutral-900">
            Chỉnh sửa bài viết
          </h1>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 font-body">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
            <div>
              <label className="block font-body font-medium text-neutral-900 mb-2">
                Tiêu đề *
              </label>
              <input
                type="text"
                {...register("title")}
                className="w-full px-4 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
                placeholder="Nhập tiêu đề bài viết"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600 font-body">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block font-body font-medium text-neutral-900 mb-2">
                Slug *
              </label>
              <input
                type="text"
                {...register("slug")}
                onChange={(e) => {
                  setSlugManuallyEdited(true);
                  setValue("slug", e.target.value);
                }}
                className="w-full px-4 py-2 border border-neutral-200 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-700"
                placeholder="duong-dan-bai-viet"
              />
              {errors.slug && (
                <p className="mt-1 text-sm text-red-600 font-body">{errors.slug.message}</p>
              )}
            </div>

            <div>
              <label className="block font-body font-medium text-neutral-900 mb-2">
                Mô tả ngắn
              </label>
              <textarea
                {...register("excerpt")}
                rows={3}
                className="w-full px-4 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
                placeholder="Mô tả ngắn gọn về bài viết"
              />
            </div>

            <div>
              <label className="block font-body font-medium text-neutral-900 mb-2">
                Nội dung *
              </label>
              <RichTextEditor
                value={contentValue}
                onChange={(html) => setValue("content", html)}
                placeholder="Nhập nội dung bài viết..."
              />
              {errors.content && (
                <p className="mt-1 text-sm text-red-600 font-body">{errors.content.message}</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
            <h3 className="font-heading font-semibold text-neutral-900">Trạng thái</h3>
            <div>
              <label className="block font-body text-sm text-neutral-700 mb-2">
                Trạng thái xuất bản
              </label>
              <select
                {...register("status")}
                className="w-full px-4 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
              >
                <option value="DRAFT">Bản nháp</option>
                <option value="PUBLISHED">Xuất bản</option>
                <option value="ARCHIVED">Lưu trữ</option>
              </select>
            </div>

            {statusValue === "PUBLISHED" && (
              <div>
                <label className="block font-body text-sm text-neutral-700 mb-2">
                  Ngày xuất bản
                </label>
                <input
                  type="datetime-local"
                  {...register("publishedAt")}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
                />
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
            <h3 className="font-heading font-semibold text-neutral-900">Danh mục</h3>
            <div>
              <label className="block font-body text-sm text-neutral-700 mb-2">
                Chọn danh mục
              </label>
              <select
                {...register("categoryId")}
                className="w-full px-4 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
              >
                <option value="">Không có danh mục</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
            <h3 className="font-heading font-semibold text-neutral-900">Thẻ tag</h3>
            <div>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                placeholder="Nhập tag và nhấn Enter"
                className="w-full px-4 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
              />
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-body"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-primary-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
            <h3 className="font-heading font-semibold text-neutral-900">Ảnh đại diện</h3>
            <input
              type="text"
              {...register("featuredImage")}
              placeholder="URL ảnh đại diện"
              className="w-full px-4 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
            />
          </div>

          <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
            <h3 className="font-heading font-semibold text-neutral-900">Thời gian đọc</h3>
            <p className="font-body text-neutral-700">
              {readingTime} phút đọc
            </p>
          </div>

          <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
            <h3 className="font-heading font-semibold text-neutral-900">SEO</h3>
            <div>
              <label className="block font-body text-sm text-neutral-700 mb-2">
                Meta Title
              </label>
              <input
                type="text"
                {...register("metaTitle")}
                className="w-full px-4 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
                placeholder="Tiêu đề SEO"
              />
            </div>
            <div>
              <label className="block font-body text-sm text-neutral-700 mb-2">
                Meta Description
              </label>
              <textarea
                {...register("metaDescription")}
                rows={3}
                className="w-full px-4 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
                placeholder="Mô tả SEO"
              />
            </div>
            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
              <p className="font-body text-xs text-primary-700 font-medium mb-1">
                {watch("metaTitle") || watch("title") || "Tiêu đề bài viết"}
              </p>
              <p className="font-body text-xs text-green-700 mb-1">
                enzara.vn › blog › {watch("slug") || "slug"}
              </p>
              <p className="font-body text-xs text-neutral-600">
                {watch("metaDescription") || watch("excerpt") || "Mô tả bài viết sẽ hiển thị ở đây..."}
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={cn(
              "w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-body font-medium transition-colors",
              submitting
                ? "bg-neutral-300 text-neutral-500 cursor-not-allowed"
                : "bg-primary-700 text-white hover:bg-primary-800"
            )}
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Đang cập nhật...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Cập nhật bài viết
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
