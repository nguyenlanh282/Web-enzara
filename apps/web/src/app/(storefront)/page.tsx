import { Metadata } from "next";
import { fetchAPI } from "@/lib/api-server";
import { HeroSlider } from "@/components/storefront/home/HeroSlider";
import { CategoryGrid } from "@/components/storefront/home/CategoryGrid";
import { ProductCarousel } from "@/components/storefront/home/ProductCarousel";
import { Newsletter } from "@/components/storefront/home/Newsletter";
import { FlashSaleWidget } from "@/components/storefront/home/FlashSaleWidget";
import { Testimonials } from "@/components/storefront/home/Testimonials";
import { generatePageMetadata, organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import { ScrollReveal } from "@/components/storefront/effects/ScrollReveal";
import { OrganicSectionHeading } from "@/components/storefront/effects/OrganicBadge";
import { WaveDividerSoft } from "@/components/storefront/effects/WaveDivider";
import { FloatingLeaves } from "@/components/storefront/effects/LeafDecoration";

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteJsonLd()),
        }}
      />

      {banners && banners.length > 0 && <HeroSlider banners={banners} />}

      {flashSale && flashSale.items && flashSale.items.length > 0 && (
        <FlashSaleWidget flashSale={flashSale} />
      )}

      {categories && categories.length > 0 && (
        <section className="relative max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <ScrollReveal animation="fade-up">
            <OrganicSectionHeading
              title="Danh mục sản phẩm"
              subtitle="Khám phá các dòng sản phẩm thiên nhiên, an toàn cho gia đình bạn"
            />
          </ScrollReveal>
          <ScrollReveal animation="fade-up" delay={150}>
            <CategoryGrid categories={categories} />
          </ScrollReveal>
        </section>
      )}

      <WaveDividerSoft />

      {featuredProducts?.items && featuredProducts.items.length > 0 && (
        <section className="relative bg-organic-gradient py-12">
          <FloatingLeaves />
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal animation="fade-up">
              <OrganicSectionHeading
                title="Sản phẩm nổi bật"
                subtitle="Được yêu thích và tin dùng bởi hàng ngàn khách hàng"
              />
            </ScrollReveal>
            <ScrollReveal animation="fade-up" delay={150}>
              <ProductCarousel
                products={featuredProducts.items}
                viewAllHref="/products?featured=true"
              />
            </ScrollReveal>
          </div>
        </section>
      )}

      <WaveDividerSoft flip />

      {newProducts?.items && newProducts.items.length > 0 && (
        <section className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <ScrollReveal animation="fade-up">
            <OrganicSectionHeading
              title="Sản phẩm mới"
              subtitle="Cập nhật những sản phẩm mới nhất từ thiên nhiên"
            />
          </ScrollReveal>
          <ScrollReveal animation="fade-up" delay={150}>
            <ProductCarousel
              products={newProducts.items}
              viewAllHref="/products?sort=newest"
            />
          </ScrollReveal>
        </section>
      )}

      {bestSellers?.items && bestSellers.items.length > 0 && (
        <section className="relative bg-organic-radial py-12">
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal animation="fade-up">
              <OrganicSectionHeading
                title="Bán chạy nhất"
                subtitle="Sản phẩm được lựa chọn nhiều nhất"
              />
            </ScrollReveal>
            <ScrollReveal animation="fade-up" delay={150}>
              <ProductCarousel
                products={bestSellers.items}
                viewAllHref="/products?sort=bestseller"
              />
            </ScrollReveal>
          </div>
        </section>
      )}

      {featuredReviews && featuredReviews.length > 0 && (
        <ScrollReveal animation="fade">
          <Testimonials reviews={featuredReviews} />
        </ScrollReveal>
      )}

      <WaveDividerSoft fill="#f0f5e0" />

      <section className="relative bg-leaf-gradient bg-primary-50 py-14">
        <FloatingLeaves className="opacity-30" />
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal animation="scale">
            <Newsletter />
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}

export const revalidate = 300;
