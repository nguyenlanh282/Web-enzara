import { fetchAPI } from "@/lib/api-server";
import { Breadcrumbs } from "@/components/storefront/shared/Breadcrumbs";
import { Pagination } from "@/components/storefront/shared/Pagination";
import { ProductCard } from "@/components/storefront/product/ProductCard";
import FilterSidebar from "./FilterSidebar";
import SortBar from "./SortBar";
import { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = generatePageMetadata({
  title: "San pham - Enzara",
  description: "Kham pha bo suu tap san pham lam sach huu co Enzara. Nuoc rua chen, nuoc giat, nuoc lau san tu enzyme dua tu nhien.",
  path: "/products",
});

interface ProductListResponse {
  items: any[];
  total: number;
  page: number;
  totalPages: number;
}

export default async function ProductListingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const queryString = new URLSearchParams(params).toString();

  const [products, categories, brands] = await Promise.all([
    fetchAPI<ProductListResponse>(`/products?${queryString}`),
    fetchAPI<any[]>("/categories"),
    fetchAPI<any[]>("/brands"),
  ]);

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <Breadcrumbs items={[{ label: "San pham" }]} />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-4">
        <FilterSidebar categories={categories || []} brands={brands || []} currentParams={params} />
        <div className="lg:col-span-3">
          <SortBar currentSort={params.sort || ""} total={products?.total || 0} />
          {products?.items && products.items.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                {products.items.map((product: any) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              {products.totalPages > 1 && (
                <div className="mt-8">
                  <Pagination current={products.page} total={products.totalPages} baseUrl="/products" searchParams={params} />
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <p className="text-neutral-500 font-body">Khong tim thay san pham nao</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
