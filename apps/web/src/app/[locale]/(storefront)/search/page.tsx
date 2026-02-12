import { fetchAPI } from "@/lib/api-server";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Breadcrumbs } from "@/components/storefront/shared/Breadcrumbs";
import { Pagination } from "@/components/storefront/shared/Pagination";
import { ProductCard } from "@/components/storefront/product/ProductCard";
import { SearchTracker } from "./SearchTracker";
import { Metadata } from "next";

interface ProductListResponse {
  items: any[];
  total: number;
  page: number;
  totalPages: number;
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<Record<string, string>> }): Promise<Metadata> {
  const t = await getTranslations("search");
  const params = await searchParams;
  const query = params.q || "";
  return {
    title: query ? t("seo.resultTitle", { query }) : t("seo.title"),
    description: query ? t("seo.resultDescription", { query }) : undefined,
  };
}

export default async function SearchPage({ searchParams, params: paramsPromise }: { searchParams: Promise<Record<string, string>>; params: Promise<{ locale: string }> }) {
  const { locale } = await paramsPromise;
  setRequestLocale(locale);
  const t = await getTranslations("search");
  const params = await searchParams;
  const query = params.q || "";

  if (!query) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumbs items={[{ label: t("breadcrumb") }]} />
        <div className="text-center py-16 mt-6 bg-white rounded-xl border border-neutral-200">
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
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <p className="text-neutral-500 font-body mt-4">{t("enterKeyword")}</p>
        </div>
      </div>
    );
  }

  const queryString = new URLSearchParams({ q: query, limit: "20", ...params }).toString();
  const products = await fetchAPI<ProductListResponse>(`/products/search?${queryString}`);

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <SearchTracker query={query} />
      <Breadcrumbs
        items={[
          { label: t("breadcrumb"), href: "/search" },
          { label: `"${query}"` },
        ]}
      />

      <div className="mt-6">
        <h1 className="text-2xl font-heading font-bold text-neutral-900">
          {t("title")} <span className="text-primary-700">"{query}"</span>
        </h1>
        {products && products.total > 0 && (
          <p className="text-sm text-neutral-600 font-body mt-2">
            {t("foundProducts")} <span className="font-semibold text-neutral-900">{products.total}</span> {t("products")}
          </p>
        )}
      </div>

      <div className="mt-8">
        {products?.items && products.items.length > 0 ? (
          <>
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
                  baseUrl="/search"
                  searchParams={params}
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
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-neutral-500 font-body mt-4 text-lg">
              {t("noResults")} <span className="font-semibold">"{query}"</span>
            </p>
            <p className="text-neutral-400 font-body text-sm mt-2">{t("tryDifferent")}</p>
            <a
              href="/products"
              className="inline-block mt-6 px-6 py-2 bg-primary-700 text-white rounded-xl font-body font-medium hover:bg-primary-800 transition-colors"
            >
              {t("viewAllProducts")}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export const revalidate = 300;
