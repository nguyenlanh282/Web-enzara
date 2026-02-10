import { fetchAPI } from "@/lib/api-server";
import { Breadcrumbs } from "@/components/storefront/shared/Breadcrumbs";
import { Pagination } from "@/components/storefront/shared/Pagination";
import { ProductCard } from "@/components/storefront/product/ProductCard";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { generatePageMetadata, breadcrumbJsonLd, collectionPageJsonLd } from "@/lib/seo";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
}

interface ProductListResponse {
  items: any[];
  total: number;
  page: number;
  totalPages: number;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = await fetchAPI<Category>(`/categories/${slug}`);
  if (!category) return { title: "Danh muc khong ton tai" };
  return generatePageMetadata({
    title: category.metaTitle || `${category.name} - Enzara`,
    description: category.metaDescription || category.description || `Mua san pham ${category.name} tai Enzara`,
    path: `/categories/${slug}`,
  });
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const { slug } = await params;
  const queryParams = await searchParams;

  const category = await fetchAPI<Category>(`/categories/${slug}`);
  if (!category) notFound();

  const searchParamsWithCategory = new URLSearchParams({
    ...queryParams,
    category: slug,
  }).toString();

  const products = await fetchAPI<ProductListResponse>(`/products?${searchParamsWithCategory}`);

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd([
            { name: "Trang chu", url: "/" },
            { name: "San pham", url: "/products" },
            { name: category.name, url: `/categories/${slug}` },
          ])),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(collectionPageJsonLd({
            name: category.name,
            description: category.description,
            url: `/categories/${slug}`,
          })),
        }}
      />
      <Breadcrumbs
        items={[
          { label: "San pham", href: "/products" },
          { label: category.name },
        ]}
      />

      <div className="mt-6">
        <h1 className="text-3xl font-heading font-bold text-neutral-900">{category.name}</h1>
        {category.description && (
          <p className="text-neutral-600 font-body mt-2">{category.description}</p>
        )}
      </div>

      <div className="mt-8">
        {products?.items && products.items.length > 0 ? (
          <>
            <div className="mb-4">
              <p className="text-sm text-neutral-600 font-body">
                Hien thi <span className="font-semibold text-neutral-900">{products.total}</span> san pham
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.items.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {products.totalPages > 1 && (
              <div className="mt-8">
                <Pagination
                  current={products.page}
                  total={products.totalPages}
                  baseUrl={`/categories/${slug}`}
                  searchParams={queryParams}
                />
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-neutral-200">
            <svg
              className="w-16 h-16 mx-auto text-neutral-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <p className="text-neutral-500 font-body mt-4">Khong tim thay san pham nao trong danh muc nay</p>
            <a
              href="/products"
              className="inline-block mt-6 px-6 py-2 bg-primary-700 text-white rounded-xl font-body font-medium hover:bg-primary-800 transition-colors"
            >
              Xem tat ca san pham
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export const revalidate = 300;
