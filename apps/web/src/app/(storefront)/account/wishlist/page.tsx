"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { apiClient, ApiError } from "@/lib/api";
import { Breadcrumbs } from "@/components/storefront/shared/Breadcrumbs";
import {
  Loader2,
  AlertCircle,
  Heart,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface WishlistProduct {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  salePrice?: number;
  stockQuantity: number;
  images: Array<{ id: string; url: string; altText?: string; isPrimary?: boolean }>;
}

interface WishlistItem {
  id: string;
  productId: string;
  createdAt: string;
  product: WishlistProduct;
}

interface WishlistResponse {
  items: WishlistItem[];
  total: number;
  page: number;
  totalPages: number;
}

function formatVND(value: number): string {
  return new Intl.NumberFormat("vi-VN").format(value) + "đ";
}

function getProductImage(product: WishlistProduct): string | null {
  const primary = product.images.find((img) => img.isPrimary);
  return primary?.url || product.images[0]?.url || null;
}

export function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const limit = 20;

  useEffect(() => {
    fetchWishlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  async function fetchWishlist() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      });
      const response = await apiClient.get<WishlistResponse>(
        `/wishlist?${params}`
      );
      setItems(response.items || []);
      setTotalPages(response.totalPages || 1);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Khong the tai danh sach yeu thich");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(productId: string) {
    setRemovingIds((prev) => new Set(prev).add(productId));
    try {
      await apiClient.delete(`/wishlist/${productId}`);
      setItems((prev) => prev.filter((item) => item.productId !== productId));
    } catch {
      // Silently fail
    } finally {
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-2">
      <Breadcrumbs
        items={[
          { label: "Tai khoan", href: "/account" },
          { label: "Yeu thich" },
        ]}
      />

      <h1 className="text-2xl font-heading font-bold text-neutral-900 mb-6">
        San pham yeu thich
      </h1>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-primary-700 animate-spin" />
        </div>
      ) : error ? (
        <div className="flex items-center justify-center gap-2 py-12 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <span className="font-body">{error}</span>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-6 py-16 text-neutral-400">
          <Heart className="h-24 w-24 stroke-1" />
          <h2 className="text-xl font-heading font-bold text-neutral-900">
            Chua co san pham yeu thich
          </h2>
          <p className="text-neutral-500 font-body text-center max-w-md">
            Hay them san pham yeu thich de theo doi va mua sam de dang hon.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center justify-center h-12 px-8 rounded-xl bg-primary-700 text-white font-medium hover:bg-primary-800 transition-colors"
          >
            Kham pha san pham
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item) => {
              const product = item.product;
              const imageUrl = getProductImage(product);
              const discountPercent = product.salePrice
                ? Math.round(
                    ((product.basePrice - product.salePrice) /
                      product.basePrice) *
                      100
                  )
                : 0;
              const isRemoving = removingIds.has(item.productId);

              return (
                <div
                  key={item.id}
                  className="group relative bg-white rounded-xl overflow-hidden border border-neutral-200 hover:border-primary-700 transition-all hover:shadow-lg"
                >
                  <Link href={`/products/${product.slug}`}>
                    <div className="relative aspect-[3/4] overflow-hidden bg-neutral-100">
                      {imageUrl && (
                        <Image
                          src={imageUrl}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      )}

                      {discountPercent > 0 && (
                        <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                          -{discountPercent}%
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <h3 className="font-medium text-neutral-900 mb-2 line-clamp-2 min-h-[2.5rem]">
                        {product.name}
                      </h3>

                      <div className="flex items-center gap-2 mb-3">
                        {product.salePrice ? (
                          <>
                            <span className="text-primary-700 font-bold text-lg">
                              {formatVND(product.salePrice)}
                            </span>
                            <span className="text-sm text-neutral-400 line-through">
                              {formatVND(product.basePrice)}
                            </span>
                          </>
                        ) : (
                          <span className="text-primary-700 font-bold text-lg">
                            {formatVND(product.basePrice)}
                          </span>
                        )}
                      </div>

                      <p
                        className={`text-xs font-body ${
                          product.stockQuantity > 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {product.stockQuantity > 0 ? "Con hang" : "Het hang"}
                      </p>
                    </div>
                  </Link>

                  <button
                    onClick={() => handleRemove(item.productId)}
                    disabled={isRemoving}
                    className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 border border-neutral-200 text-neutral-400 hover:text-red-500 hover:border-red-300 transition-colors disabled:opacity-50"
                    aria-label="Xoa khoi yeu thich"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between py-6">
              <div className="font-body text-sm text-neutral-600">
                Trang {currentPage} / {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-neutral-300 rounded-lg hover:border-primary-700 hover:text-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Trang truoc"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-2 border border-neutral-300 rounded-lg hover:border-primary-700 hover:text-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Trang sau"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function WishlistPageRoute() {
  return <WishlistPage />;
}
