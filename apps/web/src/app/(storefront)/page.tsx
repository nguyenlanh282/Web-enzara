import { Metadata } from "next";
import { fetchAPI } from "@/lib/api-server";
import { HeroSlider } from "@/components/storefront/home/HeroSlider";
import { CategoryGrid } from "@/components/storefront/home/CategoryGrid";
import { ProductCarousel } from "@/components/storefront/home/ProductCarousel";
import { Newsletter } from "@/components/storefront/home/Newsletter";
import { FlashSaleWidget } from "@/components/storefront/home/FlashSaleWidget";
import { Testimonials } from "@/components/storefront/home/Testimonials";
import { generatePageMetadata, organizationJsonLd } from "@/lib/seo";

interface FlashSaleData {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  items: Array<{
    id: string;
    productId: string;
    salePrice: number;
    quantity: number;
    soldCount: number;
    product: {
      id: string;
      name: string;
      slug: string;
      basePrice: number;
      images: Array<{ id: string; url: string; isPrimary?: boolean }>;
    };
  }>;
}

export const metadata: Metadata = generatePageMetadata({
  title: "Enzara - San pham tay rua huu co, than thien voi moi truong",
  description:
    "Mua sam san pham tay rua sinh hoc, huu co tai Enzara. Cac san pham lam sach an toan, than thien voi moi truong va suc khoe gia dinh ban.",
  path: "/",
  type: "website",
});

export default async function HomePage() {
  const [banners, categories, featuredProducts, newProducts, bestSellers, flashSale, featuredReviews] = await Promise.all([
    fetchAPI<any[]>("/banners?position=hero&active=true"),
    fetchAPI<any[]>("/categories"),
    fetchAPI<any>("/products/featured?limit=8"),
    fetchAPI<any>("/products?sort=newest&limit=8"),
    fetchAPI<any>("/products?sort=bestseller&limit=8"),
    fetchAPI<FlashSaleData>("/flash-sales/active"),
    fetchAPI<any[]>("/reviews/featured?limit=6"),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationJsonLd()),
        }}
      />

      {banners && banners.length > 0 && <HeroSlider banners={banners} />}

      {flashSale && flashSale.items && flashSale.items.length > 0 && (
        <FlashSaleWidget flashSale={flashSale} />
      )}

      {categories && categories.length > 0 && (
        <section className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h2 className="text-2xl font-heading font-bold text-neutral-900 mb-6 text-center">
            Danh mục sản phẩm
          </h2>
          <CategoryGrid categories={categories} />
        </section>
      )}

      {featuredProducts?.items && featuredProducts.items.length > 0 && (
        <section className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <ProductCarousel
            title="Sản phẩm nổi bật"
            products={featuredProducts.items}
            viewAllHref="/products?featured=true"
          />
        </section>
      )}

      {newProducts?.items && newProducts.items.length > 0 && (
        <section className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <ProductCarousel
            title="Sản phẩm mới"
            products={newProducts.items}
            viewAllHref="/products?sort=newest"
          />
        </section>
      )}

      {bestSellers?.items && bestSellers.items.length > 0 && (
        <section className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <ProductCarousel
            title="Bán chạy nhất"
            products={bestSellers.items}
            viewAllHref="/products?sort=bestseller"
          />
        </section>
      )}

      {featuredReviews && featuredReviews.length > 0 && (
        <Testimonials reviews={featuredReviews} />
      )}

      <section className="bg-primary-50 py-12">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <Newsletter />
        </div>
      </section>
    </>
  );
}

export const revalidate = 300;
