import { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://enzara.vn";

export function generatePageMetadata(opts: {
  title: string;
  description: string;
  image?: string;
  path: string;
  type?: "website" | "article";
  publishedTime?: string;
  noIndex?: boolean;
}): Metadata {
  const url = `${SITE_URL}${opts.path}`;
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: url },
    ...(opts.noIndex && { robots: { index: false, follow: false } }),
    openGraph: {
      title: opts.title,
      description: opts.description,
      url,
      siteName: "Enzara",
      images: opts.image ? [{ url: opts.image, width: 1200, height: 630 }] : [],
      type: opts.type || "website",
      locale: "vi_VN",
      ...(opts.publishedTime && { publishedTime: opts.publishedTime }),
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description: opts.description,
      images: opts.image ? [opts.image] : [],
    },
  };
}

export function productJsonLd(product: {
  name: string;
  shortDesc?: string;
  description?: string;
  images?: { url: string }[];
  sku?: string;
  brand?: { name: string };
  salePrice?: number;
  basePrice: number;
  stockQuantity: number;
  slug: string;
  avgRating?: number;
  reviews?: any[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDesc || product.description || "",
    image: product.images?.map((i) => i.url) || [],
    sku: product.sku || "",
    brand: product.brand
      ? {
          "@type": "Brand",
          name: product.brand.name,
        }
      : undefined,
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/products/${product.slug}`,
      priceCurrency: "VND",
      price: product.salePrice || product.basePrice,
      availability:
        product.stockQuantity > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
    ...(product.avgRating &&
      product.avgRating > 0 && {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: product.avgRating,
          bestRating: 5,
          reviewCount: product.reviews?.length || 0,
        },
      }),
  };
}

export function articleJsonLd(post: {
  title: string;
  excerpt?: string;
  featuredImage?: string;
  publishedAt?: string;
  updatedAt?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt || "",
    image: post.featuredImage ? [post.featuredImage] : [],
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    author: {
      "@type": "Organization",
      name: "Enzara",
    },
    publisher: {
      "@type": "Organization",
      name: "Enzara",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo.png`,
      },
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Enzara",
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description:
      "Enzara - Chuyen cung cap san pham tay rua huu co, than thien voi moi truong",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Service",
      availableLanguage: "Vietnamese",
    },
    sameAs: [],
  };
}
