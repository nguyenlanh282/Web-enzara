import { fetchAPI } from "@/lib/api-server";
import { Breadcrumbs } from "@/components/storefront/shared/Breadcrumbs";
import { ProductGallery } from "@/components/storefront/product/ProductGallery";
import { ProductTabs } from "@/components/storefront/product/ProductTabs";
import { ReviewSection } from "@/components/storefront/product/ReviewSection";
import { RelatedProducts } from "@/components/storefront/product/RelatedProducts";
import { CrossSellSection } from "@/components/storefront/product/CrossSellSection";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import AddToCartSection from "./AddToCartSection";
import ViewTracker from "./ViewTracker";
import { FlashSaleBadge } from "./FlashSaleBadge";
import { WishlistButton } from "@/components/storefront/shared/WishlistButton";
import { generatePageMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { RecentlyViewed } from "@/components/storefront/product/RecentlyViewed";
import { TrackRecentlyViewed } from "./TrackRecentlyViewed";
import { SocialShare } from "@/components/storefront/product/SocialShare";

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  shortDesc?: string;
  basePrice: number;
  salePrice?: number;
  sku?: string;
  weight?: number;
  stockQuantity: number;
  metaTitle?: string;
  metaDescription?: string;
  category?: { id: string; name: string; slug: string };
  brand?: { id: string; name: string; slug: string };
  images: Array<{ id: string; url: string; altText?: string; isPrimary?: boolean }>;
  variants: Array<{
    id: string;
    name: string;
    price: number;
    salePrice?: number;
    stockQuantity: number;
    attributes: Record<string, string>;
    isActive: boolean;
  }>;
  avgRating: number;
  viewCount: number;
  soldCount: number;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchAPI<Product>(`/products/${slug}`);
  if (!product) return { title: "San pham khong ton tai" };

  return generatePageMetadata({
    title: product.metaTitle || `${product.name} - Enzara`,
    description:
      product.metaDescription ||
      product.shortDesc ||
      "Mua san pham tay rua huu co tai Enzara",
    image: product.images[0]?.url,
    path: `/products/${slug}`,
    type: "website",
  });
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await fetchAPI<Product>(`/products/${slug}`);
  if (!product) notFound();

  const related = await fetchAPI<{ items: any[] }>(`/products?category=${product.category?.slug || ""}&limit=8`);

  const formatPrice = (p: number) => new Intl.NumberFormat("vi-VN").format(p) + "đ";
  const discount = product.salePrice
    ? Math.round(((product.basePrice - product.salePrice) / product.basePrice) * 100)
    : 0;

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <Breadcrumbs
        items={[
          { label: "San pham", href: "/products" },
          ...(product.category ? [{ label: product.category.name, href: `/categories/${product.category.slug}` }] : []),
          { label: product.name },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
        <ProductGallery images={product.images} />

        <div className="space-y-6">
          {product.brand && <p className="text-sm text-neutral-500 font-body">{product.brand.name}</p>}
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl lg:text-3xl font-heading font-bold text-neutral-900">{product.name}</h1>
            <WishlistButton productId={product.id} />
          </div>

          <FlashSaleBadge productId={product.id} />

          <div className="flex items-baseline gap-3">
            {product.salePrice ? (
              <>
                <span className="text-2xl font-heading font-bold text-primary-700">
                  {formatPrice(product.salePrice)}
                </span>
                <span className="text-lg text-neutral-400 line-through">{formatPrice(product.basePrice)}</span>
                <span className="text-sm font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded">-{discount}%</span>
              </>
            ) : (
              <span className="text-2xl font-heading font-bold text-primary-700">{formatPrice(product.basePrice)}</span>
            )}
          </div>

          <SocialShare
            url={`${process.env.NEXT_PUBLIC_SITE_URL || "https://enzara.vn"}/products/${product.slug}`}
            title={product.name}
          />

          {product.shortDesc && <p className="text-neutral-600 font-body">{product.shortDesc}</p>}

          {product.variants.length > 0 && <AddToCartSection product={product} />}

          {product.variants.length === 0 && (
            <div className="space-y-4">
              <p
                className={`text-sm font-body ${
                  product.stockQuantity > 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {product.stockQuantity > 0 ? `Con ${product.stockQuantity} san pham` : "Het hang"}
              </p>
              <button
                disabled={product.stockQuantity === 0}
                className="w-full h-12 rounded-xl bg-primary-700 text-white font-body font-medium hover:bg-primary-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {product.stockQuantity > 0 ? "Them vao gio hang" : "Het hang"}
              </button>
            </div>
          )}

          <div className="border-t pt-4 space-y-2 text-sm text-neutral-500 font-body">
            {product.sku && <p>SKU: {product.sku}</p>}
            {product.category && (
              <p>
                Danh muc:{" "}
                <a href={`/categories/${product.category.slug}`} className="text-primary-700 hover:underline">
                  {product.category.name}
                </a>
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-12">
        <ProductTabs product={product} />
      </div>

      <ReviewSection productId={product.id} productSlug={product.slug} />

      <CrossSellSection productSlug={product.slug} />

      {related?.items && related.items.length > 1 && (
        <div className="mt-12">
          <RelatedProducts products={related.items.filter((p: any) => p.slug !== product.slug).slice(0, 8)} />
        </div>
      )}

      <ViewTracker
        slug={slug}
        product={{
          sku: product.sku,
          name: product.name,
          category: product.category?.name,
          brand: product.brand?.name,
          price: product.salePrice || product.basePrice,
        }}
      />

      <TrackRecentlyViewed
        product={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          image: product.images[0]?.url || "",
          price: product.salePrice || product.basePrice,
          originalPrice: product.salePrice ? product.basePrice : undefined,
        }}
      />

      <RecentlyViewed currentProductId={product.id} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd([
            { name: "Trang chu", url: "/" },
            { name: "San pham", url: "/products" },
            ...(product.category ? [{ name: product.category.name, url: `/categories/${product.category.slug}` }] : []),
            { name: product.name, url: `/products/${product.slug}` },
          ])),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            description: product.shortDesc || product.description || "",
            image: product.images.map((i) => i.url),
            sku: product.sku || product.id,
            brand: product.brand ? { "@type": "Brand", name: product.brand.name } : undefined,
            offers: {
              "@type": "Offer",
              url: `${process.env.NEXT_PUBLIC_SITE_URL || ""}/products/${product.slug}`,
              priceCurrency: "VND",
              price: product.salePrice || product.basePrice,
              availability:
                product.stockQuantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            },
            ...(product.avgRating > 0 && {
              aggregateRating: { "@type": "AggregateRating", ratingValue: product.avgRating, bestRating: 5 },
            }),
          }),
        }}
      />
    </div>
  );
}

export const revalidate = 60;
