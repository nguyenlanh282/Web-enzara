"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiClient, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Loader2, AlertCircle, Save, ArrowLeft, Plus, Trash2, Image as ImageIcon } from "lucide-react";
import Link from "next/link";

const variantSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Tên biến thể là bắt buộc"),
  sku: z.string().optional(),
  price: z.number().min(0, "Giá phải lớn hơn hoặc bằng 0"),
  salePrice: z.number().min(0, "Giá khuyến mãi phải lớn hơn hoặc bằng 0").optional().nullable(),
  stockQuantity: z.number().min(0, "Số lượng phải lớn hơn hoặc bằng 0"),
  attributes: z.record(z.string()).optional(),
});

const imageSchema = z.object({
  id: z.string().optional(),
  url: z.string().url("URL hình ảnh không hợp lệ"),
  altText: z.string().optional(),
  sortOrder: z.number().min(0),
  isPrimary: z.boolean(),
});

const productSchema = z.object({
  name: z.string().min(1, "Tên sản phẩm là bắt buộc"),
  slug: z.string().min(1, "Slug là bắt buộc"),
  shortDesc: z.string().optional(),
  description: z.string().optional(),
  categoryId: z.string().optional().nullable(),
  brandId: z.string().optional().nullable(),
  tags: z.string().optional(),
  basePrice: z.number().min(0, "Giá cơ bản phải lớn hơn hoặc bằng 0"),
  salePrice: z.number().min(0, "Giá khuyến mãi phải lớn hơn hoặc bằng 0").optional().nullable(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  stockQuantity: z.number().min(0, "Số lượng phải lớn hơn hoặc bằng 0"),
  weight: z.number().min(0, "Trọng lượng phải lớn hơn hoặc bằng 0").optional().nullable(),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  variants: z.array(variantSchema).optional(),
  images: z.array(imageSchema).optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface Category {
  id: string;
  name: string;
}

interface Brand {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  shortDesc?: string;
  description?: string;
  categoryId?: string | null;
  brandId?: string | null;
  tags?: string;
  basePrice: number;
  salePrice?: number | null;
  sku?: string;
  barcode?: string;
  stockQuantity: number;
  weight?: number | null;
  isActive: boolean;
  isFeatured: boolean;
  variants?: Array<z.infer<typeof variantSchema>>;
  images?: Array<z.infer<typeof imageSchema>>;
  metaTitle?: string;
  metaDescription?: string;
}

function generateSlug(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatVND(value: number): string {
  return new Intl.NumberFormat("vi-VN").format(value) + "đ";
}

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<Array<z.infer<typeof variantSchema>>>([]);
  const [images, setImages] = useState<Array<z.infer<typeof imageSchema>>>([]);
  const [attributeInputs, setAttributeInputs] = useState<Record<number, Array<{ key: string; value: string }>>>({});

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  });

  const nameValue = watch("name");

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    if (nameValue && !product) {
      setValue("slug", generateSlug(nameValue));
    }
  }, [nameValue, setValue, product]);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const [productRes, categoriesRes, brandsRes] = await Promise.all([
        apiClient.get<{ product: Product }>(`/admin/products/${id}`),
        apiClient.get<{ categories: Category[] }>("/admin/categories"),
        apiClient.get<{ brands: Brand[] }>("/admin/brands"),
      ]);

      const fetchedProduct = productRes.product;
      setProduct(fetchedProduct);
      setCategories(categoriesRes.categories || []);
      setBrands(brandsRes.brands || []);

      reset({
        name: fetchedProduct.name,
        slug: fetchedProduct.slug,
        shortDesc: fetchedProduct.shortDesc || "",
        description: fetchedProduct.description || "",
        categoryId: fetchedProduct.categoryId || "",
        brandId: fetchedProduct.brandId || "",
        tags: fetchedProduct.tags || "",
        basePrice: fetchedProduct.basePrice,
        salePrice: fetchedProduct.salePrice || undefined,
        sku: fetchedProduct.sku || "",
        barcode: fetchedProduct.barcode || "",
        stockQuantity: fetchedProduct.stockQuantity,
        weight: fetchedProduct.weight || undefined,
        isActive: fetchedProduct.isActive,
        isFeatured: fetchedProduct.isFeatured,
        metaTitle: fetchedProduct.metaTitle || "",
        metaDescription: fetchedProduct.metaDescription || "",
      });

      if (fetchedProduct.variants && fetchedProduct.variants.length > 0) {
        setVariants(fetchedProduct.variants);
        const attrInputs: Record<number, Array<{ key: string; value: string }>> = {};
        fetchedProduct.variants.forEach((variant, index) => {
          if (variant.attributes) {
            attrInputs[index] = Object.entries(variant.attributes).map(([key, value]) => ({
              key,
              value,
            }));
          }
        });
        setAttributeInputs(attrInputs);
      }

      if (fetchedProduct.images && fetchedProduct.images.length > 0) {
        setImages(fetchedProduct.images);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Không thể tải thông tin sản phẩm");
      }
    } finally {
      setLoading(false);
    }
  }

  function addVariant() {
    setVariants([
      ...variants,
      {
        name: "",
        sku: "",
        price: 0,
        salePrice: null,
        stockQuantity: 0,
        attributes: {},
      },
    ]);
    setAttributeInputs({
      ...attributeInputs,
      [variants.length]: [],
    });
  }

  function removeVariant(index: number) {
    setVariants(variants.filter((_, i) => i !== index));
    const newInputs = { ...attributeInputs };
    delete newInputs[index];
    setAttributeInputs(newInputs);
  }

  function updateVariant(index: number, field: string, value: any) {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
  }

  function addAttributeInput(variantIndex: number) {
    setAttributeInputs({
      ...attributeInputs,
      [variantIndex]: [...(attributeInputs[variantIndex] || []), { key: "", value: "" }],
    });
  }

  function removeAttributeInput(variantIndex: number, attrIndex: number) {
    const updated = { ...attributeInputs };
    updated[variantIndex] = updated[variantIndex].filter((_, i) => i !== attrIndex);
    setAttributeInputs(updated);
  }

  function updateAttributeInput(variantIndex: number, attrIndex: number, field: "key" | "value", value: string) {
    const updated = { ...attributeInputs };
    updated[variantIndex][attrIndex][field] = value;
    setAttributeInputs(updated);

    const attrs: Record<string, string> = {};
    updated[variantIndex].forEach((attr) => {
      if (attr.key && attr.value) {
        attrs[attr.key] = attr.value;
      }
    });
    updateVariant(variantIndex, "attributes", attrs);
  }

  function addImage() {
    setImages([
      ...images,
      {
        url: "",
        altText: "",
        sortOrder: images.length,
        isPrimary: images.length === 0,
      },
    ]);
  }

  function removeImage(index: number) {
    const updated = images.filter((_, i) => i !== index);
    if (updated.length > 0 && !updated.some((img) => img.isPrimary)) {
      updated[0].isPrimary = true;
    }
    setImages(updated);
  }

  function updateImage(index: number, field: string, value: any) {
    const updated = [...images];
    if (field === "isPrimary" && value === true) {
      updated.forEach((img, i) => {
        img.isPrimary = i === index;
      });
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setImages(updated);
  }

  async function onSubmit(data: ProductFormData) {
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        ...data,
        variants: variants.length > 0 ? variants : undefined,
        images: images.filter((img) => img.url).length > 0 ? images.filter((img) => img.url) : undefined,
        categoryId: data.categoryId || null,
        brandId: data.brandId || null,
        salePrice: data.salePrice || null,
        weight: data.weight || null,
      };
      await apiClient.put(`/admin/products/${id}`, payload);
      router.push("/admin/products");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Không thể cập nhật sản phẩm");
      }
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Bạn có chắc muốn xóa sản phẩm "${product?.name}"?`)) {
      return;
    }
    setDeleting(true);
    try {
      await apiClient.delete(`/admin/products/${id}`);
      router.push("/admin/products");
    } catch (err) {
      if (err instanceof ApiError) {
        alert(`Lỗi: ${err.message}`);
      } else {
        alert("Không thể xóa sản phẩm");
      }
      setDeleting(false);
    }
  }

  const tabs = [
    { id: 0, label: "Thông tin" },
    { id: 1, label: "Giá & Kho" },
    { id: 2, label: "Biến thể" },
    { id: 3, label: "Hình ảnh" },
    { id: 4, label: "SEO" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-primary-700 animate-spin" />
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertCircle className="w-12 h-12 text-red-600" />
        <p className="font-body text-red-600">{error}</p>
        <Link
          href="/admin/products"
          className="px-4 py-2 bg-primary-700 text-white rounded-xl font-body font-medium hover:bg-primary-800 transition-colors"
        >
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/products"
          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-heading text-3xl font-bold text-neutral-900">
            Chỉnh sửa sản phẩm
          </h1>
          <p className="font-body text-neutral-600 mt-1">
            Cập nhật thông tin sản phẩm
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
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <div className="border-b border-neutral-200 flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 px-6 py-3 font-body font-medium transition-colors border-b-2",
                  activeTab === tab.id
                    ? "border-primary-700 text-primary-700 bg-primary-50"
                    : "border-transparent text-neutral-600 hover:bg-neutral-50"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 0 && (
              <div className="space-y-4">
                <div>
                  <label className="block font-body font-medium text-neutral-900 mb-2">
                    Tên sản phẩm <span className="text-red-600">*</span>
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
                    Mô tả ngắn
                  </label>
                  <textarea
                    {...register("shortDesc")}
                    rows={3}
                    className="w-full px-4 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
                  />
                </div>

                <div>
                  <label className="block font-body font-medium text-neutral-900 mb-2">
                    Mô tả chi tiết
                  </label>
                  <textarea
                    {...register("description")}
                    rows={16}
                    placeholder="Sử dụng trình soạn thảo văn bản để thêm nội dung chi tiết..."
                    className="w-full px-4 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-body font-medium text-neutral-900 mb-2">
                      Danh mục
                    </label>
                    <select
                      {...register("categoryId")}
                      className="w-full px-4 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
                    >
                      <option value="">Chọn danh mục</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-body font-medium text-neutral-900 mb-2">
                      Thương hiệu
                    </label>
                    <select
                      {...register("brandId")}
                      className="w-full px-4 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
                    >
                      <option value="">Chọn thương hiệu</option>
                      {brands.map((brand) => (
                        <option key={brand.id} value={brand.id}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-body font-medium text-neutral-900 mb-2">
                    Tags (phân cách bằng dấu phẩy)
                  </label>
                  <input
                    type="text"
                    {...register("tags")}
                    placeholder="Ví dụ: mới, khuyến mãi, bán chạy"
                    className="w-full px-4 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
                  />
                </div>
              </div>
            )}

            {activeTab === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-body font-medium text-neutral-900 mb-2">
                      Giá cơ bản <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register("basePrice", { valueAsNumber: true })}
                      className="w-full px-4 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
                    />
                    {errors.basePrice && (
                      <p className="mt-1 text-sm text-red-600 font-body">{errors.basePrice.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block font-body font-medium text-neutral-900 mb-2">
                      Giá khuyến mãi
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register("salePrice", { valueAsNumber: true })}
                      className="w-full px-4 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-body font-medium text-neutral-900 mb-2">
                      SKU
                    </label>
                    <input
                      type="text"
                      {...register("sku")}
                      className="w-full px-4 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
                    />
                  </div>

                  <div>
                    <label className="block font-body font-medium text-neutral-900 mb-2">
                      Barcode
                    </label>
                    <input
                      type="text"
                      {...register("barcode")}
                      className="w-full px-4 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-body font-medium text-neutral-900 mb-2">
                      Số lượng tồn kho
                    </label>
                    <input
                      type="number"
                      {...register("stockQuantity", { valueAsNumber: true })}
                      className="w-full px-4 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
                    />
                  </div>

                  <div>
                    <label className="block font-body font-medium text-neutral-900 mb-2">
                      Trọng lượng (g)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register("weight", { valueAsNumber: true })}
                      className="w-full px-4 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register("isActive")}
                      className="w-4 h-4 text-primary-700 border-neutral-300 rounded focus:ring-primary-700"
                    />
                    <span className="font-body text-neutral-900">Kích hoạt sản phẩm</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register("isFeatured")}
                      className="w-4 h-4 text-primary-700 border-neutral-300 rounded focus:ring-primary-700"
                    />
                    <span className="font-body text-neutral-900">Sản phẩm nổi bật</span>
                  </label>
                </div>
              </div>
            )}

            {activeTab === 2 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="font-body text-neutral-600">
                    Thêm các biến thể sản phẩm (size, màu sắc, v.v.)
                  </p>
                  <button
                    type="button"
                    onClick={addVariant}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-700 text-white rounded-xl font-body font-medium hover:bg-primary-800 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Thêm biến thể
                  </button>
                </div>

                {variants.length === 0 ? (
                  <div className="text-center py-8 text-neutral-500 font-body">
                    Chưa có biến thể nào. Nhấn "Thêm biến thể" để bắt đầu.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {variants.map((variant, index) => (
                      <div
                        key={index}
                        className="p-4 border border-neutral-200 rounded-xl space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-body font-semibold text-neutral-900">
                            Biến thể {index + 1}
                          </h4>
                          <button
                            type="button"
                            onClick={() => removeVariant(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block font-body text-sm font-medium text-neutral-900 mb-1">
                              Tên biến thể
                            </label>
                            <input
                              type="text"
                              value={variant.name}
                              onChange={(e) => updateVariant(index, "name", e.target.value)}
                              className="w-full px-3 py-2 border border-neutral-200 rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary-700"
                            />
                          </div>

                          <div>
                            <label className="block font-body text-sm font-medium text-neutral-900 mb-1">
                              SKU
                            </label>
                            <input
                              type="text"
                              value={variant.sku || ""}
                              onChange={(e) => updateVariant(index, "sku", e.target.value)}
                              className="w-full px-3 py-2 border border-neutral-200 rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary-700"
                            />
                          </div>

                          <div>
                            <label className="block font-body text-sm font-medium text-neutral-900 mb-1">
                              Giá
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={variant.price}
                              onChange={(e) =>
                                updateVariant(index, "price", parseFloat(e.target.value) || 0)
                              }
                              className="w-full px-3 py-2 border border-neutral-200 rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary-700"
                            />
                          </div>

                          <div>
                            <label className="block font-body text-sm font-medium text-neutral-900 mb-1">
                              Giá khuyến mãi
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={variant.salePrice || ""}
                              onChange={(e) =>
                                updateVariant(
                                  index,
                                  "salePrice",
                                  e.target.value ? parseFloat(e.target.value) : null
                                )
                              }
                              className="w-full px-3 py-2 border border-neutral-200 rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary-700"
                            />
                          </div>

                          <div>
                            <label className="block font-body text-sm font-medium text-neutral-900 mb-1">
                              Số lượng
                            </label>
                            <input
                              type="number"
                              value={variant.stockQuantity}
                              onChange={(e) =>
                                updateVariant(index, "stockQuantity", parseInt(e.target.value) || 0)
                              }
                              className="w-full px-3 py-2 border border-neutral-200 rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary-700"
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block font-body text-sm font-medium text-neutral-900">
                              Thuộc tính
                            </label>
                            <button
                              type="button"
                              onClick={() => addAttributeInput(index)}
                              className="text-sm font-body text-primary-700 hover:text-primary-800"
                            >
                              + Thêm thuộc tính
                            </button>
                          </div>
                          {(attributeInputs[index] || []).map((attr, attrIndex) => (
                            <div key={attrIndex} className="flex items-center gap-2 mb-2">
                              <input
                                type="text"
                                placeholder="Tên (vd: Màu)"
                                value={attr.key}
                                onChange={(e) =>
                                  updateAttributeInput(index, attrIndex, "key", e.target.value)
                                }
                                className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary-700"
                              />
                              <input
                                type="text"
                                placeholder="Giá trị (vd: Đỏ)"
                                value={attr.value}
                                onChange={(e) =>
                                  updateAttributeInput(index, attrIndex, "value", e.target.value)
                                }
                                className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary-700"
                              />
                              <button
                                type="button"
                                onClick={() => removeAttributeInput(index, attrIndex)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 3 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="font-body text-neutral-600">
                    Thêm hình ảnh cho sản phẩm
                  </p>
                  <button
                    type="button"
                    onClick={addImage}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-700 text-white rounded-xl font-body font-medium hover:bg-primary-800 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Thêm hình ảnh
                  </button>
                </div>

                {images.length === 0 ? (
                  <div className="text-center py-8 text-neutral-500 font-body">
                    Chưa có hình ảnh nào. Nhấn "Thêm hình ảnh" để bắt đầu.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {images.map((image, index) => (
                      <div
                        key={index}
                        className="p-4 border border-neutral-200 rounded-xl space-y-3"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            {image.url ? (
                              <img
                                src={image.url}
                                alt={image.altText || ""}
                                className="w-24 h-24 object-cover rounded-lg border border-neutral-200"
                                onError={(e) => {
                                  e.currentTarget.src = "";
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            ) : (
                              <div className="w-24 h-24 bg-neutral-100 rounded-lg border border-neutral-200 flex items-center justify-center">
                                <ImageIcon className="w-8 h-8 text-neutral-400" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 space-y-3">
                            <div>
                              <label className="block font-body text-sm font-medium text-neutral-900 mb-1">
                                URL hình ảnh
                              </label>
                              <input
                                type="url"
                                value={image.url}
                                onChange={(e) => updateImage(index, "url", e.target.value)}
                                className="w-full px-3 py-2 border border-neutral-200 rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary-700"
                              />
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="block font-body text-sm font-medium text-neutral-900 mb-1">
                                  Alt Text
                                </label>
                                <input
                                  type="text"
                                  value={image.altText || ""}
                                  onChange={(e) => updateImage(index, "altText", e.target.value)}
                                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary-700"
                                />
                              </div>

                              <div>
                                <label className="block font-body text-sm font-medium text-neutral-900 mb-1">
                                  Thứ tự
                                </label>
                                <input
                                  type="number"
                                  value={image.sortOrder}
                                  onChange={(e) =>
                                    updateImage(index, "sortOrder", parseInt(e.target.value) || 0)
                                  }
                                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary-700"
                                />
                              </div>

                              <div className="flex items-end">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="radio"
                                    checked={image.isPrimary}
                                    onChange={(e) =>
                                      updateImage(index, "isPrimary", e.target.checked)
                                    }
                                    className="w-4 h-4 text-primary-700 border-neutral-300 focus:ring-primary-700"
                                  />
                                  <span className="font-body text-sm text-neutral-900">
                                    Ảnh chính
                                  </span>
                                </label>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 4 && (
              <div className="space-y-4">
                <div>
                  <label className="block font-body font-medium text-neutral-900 mb-2">
                    Meta Title
                  </label>
                  <input
                    type="text"
                    {...register("metaTitle")}
                    className="w-full px-4 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
                  />
                  <p className="mt-1 text-sm text-neutral-500 font-body">
                    Tối đa 60 ký tự cho kết quả tìm kiếm tốt nhất
                  </p>
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
                  <p className="mt-1 text-sm text-neutral-500 font-body">
                    Tối đa 160 ký tự cho kết quả tìm kiếm tốt nhất
                  </p>
                </div>

                <div className="border border-neutral-200 rounded-xl p-4 bg-neutral-50">
                  <h4 className="font-body font-semibold text-neutral-900 mb-3">
                    Xem trước Google Search
                  </h4>
                  <div className="bg-white p-4 rounded-lg">
                    <div className="text-blue-700 text-xl font-body mb-1">
                      {watch("metaTitle") || watch("name") || "Tiêu đề sản phẩm"}
                    </div>
                    <div className="text-green-700 text-sm font-body mb-2">
                      https://enzara.vn/products/{watch("slug") || "san-pham"}
                    </div>
                    <div className="text-neutral-700 text-sm font-body">
                      {watch("metaDescription") ||
                        watch("shortDesc") ||
                        "Mô tả sản phẩm sẽ hiển thị ở đây..."}
                    </div>
                  </div>
                </div>
              </div>
            )}
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
                Xóa sản phẩm
              </>
            )}
          </button>

          <div className="flex items-center gap-4">
            <Link
              href="/admin/products"
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
                  Cập nhật sản phẩm
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
