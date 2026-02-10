import { MetadataRoute } from "next";
import { locales } from "@/i18n/config";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://enzara.vn";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

async function fetchSlugs(path: string): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function multiLocaleEntry(
  path: string,
  opts: { changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"]; priority: number; lastModified: Date },
): MetadataRoute.Sitemap {
  return locales.map((locale) => ({
    url: `${SITE_URL}/${locale}${path}`,
    lastModified: opts.lastModified,
    changeFrequency: opts.changeFrequency,
    priority: opts.priority,
    alternates: {
      languages: Object.fromEntries(
        locales.map((l) => [l, `${SITE_URL}/${l}${path}`]),
      ),
    },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const [productSlugs, categorySlugs, postSlugs, pageSlugs] = await Promise.all([
    fetchSlugs("/products/slugs"),
    fetchSlugs("/categories/slugs"),
    fetchSlugs("/posts/slugs"),
    fetchSlugs("/pages/slugs"),
  ]);

  const staticPages = [
    ...multiLocaleEntry("", { changeFrequency: "daily", priority: 1.0, lastModified: now }),
    ...multiLocaleEntry("/products", { changeFrequency: "daily", priority: 0.9, lastModified: now }),
    ...multiLocaleEntry("/blog", { changeFrequency: "daily", priority: 0.8, lastModified: now }),
    ...multiLocaleEntry("/contact", { changeFrequency: "monthly", priority: 0.5, lastModified: now }),
    ...multiLocaleEntry("/order-tracking", { changeFrequency: "monthly", priority: 0.4, lastModified: now }),
  ];

  const productPages = productSlugs.flatMap((slug) =>
    multiLocaleEntry(`/products/${slug}`, { changeFrequency: "weekly", priority: 0.8, lastModified: now }),
  );

  const categoryPages = categorySlugs.flatMap((slug) =>
    multiLocaleEntry(`/categories/${slug}`, { changeFrequency: "weekly", priority: 0.7, lastModified: now }),
  );

  const blogPages = postSlugs.flatMap((slug) =>
    multiLocaleEntry(`/blog/${slug}`, { changeFrequency: "monthly", priority: 0.6, lastModified: now }),
  );

  const cmsPages = pageSlugs.flatMap((slug) =>
    multiLocaleEntry(`/pages/${slug}`, { changeFrequency: "monthly", priority: 0.5, lastModified: now }),
  );

  return [
    ...staticPages,
    ...productPages,
    ...categoryPages,
    ...blogPages,
    ...cmsPages,
  ];
}
