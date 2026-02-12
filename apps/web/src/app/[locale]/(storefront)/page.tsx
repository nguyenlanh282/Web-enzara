import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
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
import { Leaf, Droplets, Sparkles } from "lucide-react";
import { Link } from "@/i18n/navigation";

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

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  const [banners, categories, featuredProductsRaw, newProductsRaw, bestSellersRaw, flashSale, featuredReviews] = await Promise.all([
    fetchAPI<any[]>("/banners?position=hero&active=true"),
    fetchAPI<any[]>("/categories"),
    fetchAPI<any>("/products/featured?limit=8"),
    fetchAPI<any>("/products?sort=newest&limit=8"),
    fetchAPI<any>("/products?sort=bestseller&limit=8"),
    fetchAPI<FlashSaleData>("/flash-sales/active"),
    fetchAPI<any[]>("/reviews/featured?limit=6"),
  ]);

  // Normalize product responses: API returns array or {data: [...]}
  const featuredProducts = Array.isArray(featuredProductsRaw)
    ? featuredProductsRaw
    : featuredProductsRaw?.data || featuredProductsRaw?.items || [];
  const newProducts = Array.isArray(newProductsRaw)
    ? newProductsRaw
    : newProductsRaw?.data || newProductsRaw?.items || [];
  const bestSellers = Array.isArray(bestSellersRaw)
    ? bestSellersRaw
    : bestSellersRaw?.data || bestSellersRaw?.items || [];

  const hasBanners = banners && banners.length > 0;

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
      {hasBanners ? (
        <HeroSlider banners={banners} />
      ) : (
        <section className="relative overflow-hidden bg-gradient-to-br from-primary-800 via-primary-700 to-primary-600">
          {/* Decorative elements */}
          <div className="absolute inset-0">
            <div className="absolute top-10 left-10 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary-400/15 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-300/10 rounded-full blur-3xl" />
          </div>

          <div className="relative max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-6">
                <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm text-white/90 text-xs font-medium px-3 py-1.5 rounded-full">
                  <Leaf className="h-3.5 w-3.5" />
                  100% Organic
                </span>
                <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm text-white/90 text-xs font-medium px-3 py-1.5 rounded-full">
                  <Sparkles className="h-3.5 w-3.5" />
                  Enzyme
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-heading font-bold text-white leading-tight mb-4">
                {t("hero.title")}
              </h1>
              <p className="text-base sm:text-lg text-white/80 mb-8 max-w-lg leading-relaxed">
                {t("hero.subtitle")}
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center gap-2 bg-white text-primary-800 font-heading font-semibold px-8 py-3.5 rounded-full hover:bg-primary-50 transition-colors shadow-lg text-sm"
                >
                  <Droplets className="h-4 w-4" />
                  {t("hero.cta")}
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

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
      {featuredProducts.length > 0 && (
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
                products={featuredProducts}
                viewAllHref="/products?featured=true"
              />
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* New Products */}
      {newProducts.length > 0 && (
        <section className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <ScrollReveal animation="fade-up">
            <OrganicSectionHeading
              title={t("newProducts.title")}
              subtitle={t("newProducts.subtitle")}
            />
          </ScrollReveal>
          <ScrollReveal animation="fade-up" delay={100}>
            <ProductCarousel
              products={newProducts}
              viewAllHref="/products?sort=newest"
            />
          </ScrollReveal>
        </section>
      )}

      {/* Best Sellers */}
      {bestSellers.length > 0 && (
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
                products={bestSellers}
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
