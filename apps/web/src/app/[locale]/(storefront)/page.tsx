import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { fetchAPI } from "@/lib/api-server";
import { HeroSlider } from "@/components/storefront/home/HeroSlider";
import { CategoryGrid } from "@/components/storefront/home/CategoryGrid";
import { ProductCarousel } from "@/components/storefront/home/ProductCarousel";
import { Newsletter } from "@/components/storefront/home/Newsletter";
import { FlashSaleWidget } from "@/components/storefront/home/FlashSaleWidget";
import { Testimonials } from "@/components/storefront/home/Testimonials";
import { ValueProposition } from "@/components/storefront/home/ValueProposition";
import { generatePageMetadata, organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import { ScrollReveal } from "@/components/storefront/effects/ScrollReveal";
import { OrganicSectionHeading } from "@/components/storefront/effects/OrganicBadge";

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

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("home");
  return generatePageMetadata({
    title: t("seo.title"),
    description: t("seo.description"),
    path: "/",
    type: "website",
  });
}

export default async function HomePage() {
  const t = await getTranslations("home");

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

      {/* Hero */}
      {banners && banners.length > 0 && <HeroSlider banners={banners} />}

      {/* Value Proposition Bar */}
      <ValueProposition />

      {/* Flash Sale */}
      {flashSale && flashSale.items && flashSale.items.length > 0 && (
        <ScrollReveal animation="fade-up">
          <FlashSaleWidget flashSale={flashSale} />
        </ScrollReveal>
      )}

      {/* Categories */}
      {categories && categories.length > 0 && (
        <section className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <ScrollReveal animation="fade-up">
            <OrganicSectionHeading
              title={t("categorySection.title")}
              subtitle={t("categorySection.subtitle")}
            />
          </ScrollReveal>
          <ScrollReveal animation="fade-up" delay={100}>
            <CategoryGrid categories={categories} />
          </ScrollReveal>
        </section>
      )}

      {/* Featured Products */}
      {featuredProducts?.items && featuredProducts.items.length > 0 && (
        <section className="bg-neutral-50 py-16">
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal animation="fade-up">
              <OrganicSectionHeading
                title={t("featuredProducts.title")}
                subtitle={t("featuredProducts.subtitle")}
              />
            </ScrollReveal>
            <ScrollReveal animation="fade-up" delay={100}>
              <ProductCarousel
                products={featuredProducts.items}
                viewAllHref="/products?featured=true"
              />
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* New Products */}
      {newProducts?.items && newProducts.items.length > 0 && (
        <section className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <ScrollReveal animation="fade-up">
            <OrganicSectionHeading
              title={t("newProducts.title")}
              subtitle={t("newProducts.subtitle")}
            />
          </ScrollReveal>
          <ScrollReveal animation="fade-up" delay={100}>
            <ProductCarousel
              products={newProducts.items}
              viewAllHref="/products?sort=newest"
            />
          </ScrollReveal>
        </section>
      )}

      {/* Best Sellers */}
      {bestSellers?.items && bestSellers.items.length > 0 && (
        <section className="bg-neutral-50 py-16">
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal animation="fade-up">
              <OrganicSectionHeading
                title={t("bestSellers.title")}
                subtitle={t("bestSellers.subtitle")}
              />
            </ScrollReveal>
            <ScrollReveal animation="fade-up" delay={100}>
              <ProductCarousel
                products={bestSellers.items}
                viewAllHref="/products?sort=bestseller"
              />
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {featuredReviews && featuredReviews.length > 0 && (
        <ScrollReveal animation="fade">
          <Testimonials reviews={featuredReviews} />
        </ScrollReveal>
      )}

      {/* Newsletter */}
      <section className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <ScrollReveal animation="scale">
          <Newsletter />
        </ScrollReveal>
      </section>
    </>
  );
}

export const revalidate = 300;
