# Phase 05 - Blog & SEO

## Context Links

- [Master Plan](./plan.md)
- [Previous: Cart, Checkout & Orders](./phase-04-cart-checkout-orders.md)
- [PRD Module 5.8: Blog System](../Web-enzara-prd.md)
- [PRD Module 5.9: SEO Foundation](../Web-enzara-prd.md)
- [VN Ecommerce Research: SEO](../docs/research-vn-ecommerce.md)

## Overview

| Field | Value |
|-------|-------|
| **Date** | 2026-02-08 |
| **Priority** | High |
| **Status** | Pending |
| **Estimated** | 1.5 weeks |
| **Depends on** | Phase 02 (Auth & CMS -- for Tiptap, admin layout) |
| **Blocks** | Nothing -- MVP complete after this phase |

## Key Insights

- Blog is a core part of Enzara's brand strategy: enzyme science education, safety tips, cleaning guides
- Content drives organic traffic -- critical for SEO in Vietnamese market
- Google.vn is primary search engine; Coc Coc has ~25-30% market share
- Vietnamese slug handling needs diacritics removal: `Nước Rửa Chén` -> `nuoc-rua-chen`
- Structured data (JSON-LD) for Product, Article, BreadcrumbList, Organization, FAQ schemas
- Auto-generated sitemap.xml and robots.txt from CMS settings
- Blog uses Tiptap editor (already implemented in Phase 02 CMS), stored as HTML
- Table of Contents auto-generated from heading elements in blog content
- Reading time calculated from word count (~200 words/min for Vietnamese)

## Requirements

### Blog System
- BLOG-01: Admin CRUD blog posts with Tiptap rich-text editor
- BLOG-02: Admin CRUD blog categories
- BLOG-03: Image upload in editor + featured image
- BLOG-04: Auto-generate slug from title, calculate reading time
- BLOG-05: Blog listing page with pagination and category filter
- BLOG-06: Blog detail page with TOC, share buttons, related posts
- BLOG-07: Draft / Published / Archived status management
- BLOG-08: Schedule publish via future publishedAt date
- BLOG-10: Comment system with admin moderation
- BLOG-12: SEO meta fields per post

### SEO Foundation
- Dynamic `generateMetadata` for every page type
- Sitemap.xml generation (products, blog posts, categories, pages)
- Robots.txt from CMS settings
- JSON-LD structured data: Product, Article, BreadcrumbList, Organization
- Open Graph + Twitter Card meta tags
- Canonical URLs
- Vietnamese-optimized meta tags (proper diacritics)

## Architecture

### Blog Module (NestJS)

```
apps/api/src/modules/blog/
├── blog.module.ts
├── posts.controller.ts          # Admin: CRUD posts
├── posts-public.controller.ts   # Public: listing, detail
├── posts.service.ts
├── categories.controller.ts     # Admin: CRUD blog categories
├── categories.service.ts
├── comments.controller.ts       # Public: submit; Admin: moderate
├── comments.service.ts
└── dto/
    ├── create-post.dto.ts
    ├── update-post.dto.ts
    ├── post-filter.dto.ts
    ├── create-category.dto.ts
    └── create-comment.dto.ts
```

### Blog Pages (Next.js)

```
apps/web/src/app/(storefront)/blog/
├── page.tsx                     # Blog listing (SSR with pagination)
└── [slug]/page.tsx              # Blog detail (ISR)

apps/web/src/app/admin/blog/
├── page.tsx                     # Post list (DataTable)
├── new/page.tsx                 # Create post (Tiptap editor)
├── [id]/page.tsx                # Edit post
└── categories/
    └── page.tsx                 # Blog category management
```

### Blog Components

```
apps/web/src/components/storefront/blog/
├── BlogCard.tsx                 # Card: featured image, title, excerpt, date, category
├── BlogListItem.tsx             # Horizontal card for sidebar
├── TableOfContents.tsx          # Auto-generated from content headings
├── ShareButtons.tsx             # Facebook, Zalo, Twitter/X, Copy link
├── AuthorBox.tsx                # Author avatar, name, bio
├── CommentForm.tsx              # Name, email, content fields
├── CommentList.tsx              # Threaded comment display
└── BlogSidebar.tsx              # Search, categories, recent/popular posts
```

### SEO Utilities

```
apps/web/src/lib/seo.ts          # Metadata generation helpers
apps/web/src/app/sitemap.ts      # Next.js sitemap generation
apps/web/src/app/robots.ts       # Next.js robots.txt generation
```

## Related Code Files

### Backend
- `apps/api/src/modules/blog/posts.controller.ts`
- `apps/api/src/modules/blog/posts.service.ts`
- `apps/api/src/modules/blog/posts-public.controller.ts`
- `apps/api/src/modules/blog/categories.controller.ts`
- `apps/api/src/modules/blog/comments.controller.ts`
- `apps/api/src/modules/blog/comments.service.ts`

### Frontend - Admin
- `apps/web/src/app/admin/blog/page.tsx`
- `apps/web/src/app/admin/blog/new/page.tsx`
- `apps/web/src/app/admin/blog/[id]/page.tsx`
- `apps/web/src/app/admin/blog/categories/page.tsx`

### Frontend - Storefront
- `apps/web/src/app/(storefront)/blog/page.tsx`
- `apps/web/src/app/(storefront)/blog/[slug]/page.tsx`
- `apps/web/src/components/storefront/blog/BlogCard.tsx`
- `apps/web/src/components/storefront/blog/TableOfContents.tsx`
- `apps/web/src/components/storefront/blog/ShareButtons.tsx`

### SEO
- `apps/web/src/lib/seo.ts`
- `apps/web/src/app/sitemap.ts`
- `apps/web/src/app/robots.ts`

## Implementation Steps

### 1. Build Blog Backend

**1.1 Admin post endpoints:**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/posts` | Admin/Staff | List all posts (paginated, filterable by status/category) |
| GET | `/api/admin/posts/:id` | Admin/Staff | Get post for editing |
| POST | `/api/admin/posts` | Admin/Staff | Create post |
| PUT | `/api/admin/posts/:id` | Admin/Staff | Update post |
| DELETE | `/api/admin/posts/:id` | Admin | Delete post |

**1.2 Public post endpoints:**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/posts` | Public | Published posts (paginated, filterable by category) |
| GET | `/api/posts/:slug` | Public | Post detail by slug (published only) |
| GET | `/api/posts/recent` | Public | Recent 4 posts (for homepage) |
| GET | `/api/posts/popular` | Public | Top posts by view count |
| POST | `/api/posts/:slug/view` | Public | Increment view count |

**1.3 Post service -- creation logic:**

```typescript
async createPost(dto: CreatePostDto, authorId: string) {
  const slug = generateSlug(dto.title);
  const readingTime = this.calculateReadingTime(dto.content);

  return this.prisma.post.create({
    data: {
      title: dto.title,
      slug: await this.ensureUniqueSlug(slug),
      excerpt: dto.excerpt,
      content: dto.content,              // HTML from Tiptap
      featuredImage: dto.featuredImage,
      categoryId: dto.categoryId,
      authorId,
      status: dto.status || "DRAFT",
      tags: dto.tags || [],
      readingTime,
      metaTitle: dto.metaTitle,
      metaDescription: dto.metaDescription,
      publishedAt: dto.status === "PUBLISHED" ? new Date() : dto.publishedAt,
    },
  });
}

// Vietnamese reading time: ~200 words/minute
calculateReadingTime(html: string): number {
  const text = html.replace(/<[^>]+>/g, ""); // strip HTML tags
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}

// Ensure slug is unique by appending -2, -3, etc.
async ensureUniqueSlug(slug: string): Promise<string> {
  let candidate = slug;
  let counter = 1;
  while (await this.prisma.post.findUnique({ where: { slug: candidate } })) {
    counter++;
    candidate = `${slug}-${counter}`;
  }
  return candidate;
}
```

**1.4 Blog category endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/post-categories` | Public: active categories |
| POST | `/api/admin/post-categories` | Create category |
| PUT | `/api/admin/post-categories/:id` | Update category |
| DELETE | `/api/admin/post-categories/:id` | Delete (if no posts) |

**1.5 Comment endpoints:**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/posts/:slug/comments` | Public | Approved comments (nested/threaded) |
| POST | `/api/posts/:slug/comments` | Public | Submit comment (goes to moderation) |
| GET | `/api/admin/comments` | Admin | All comments with moderation status |
| PUT | `/api/admin/comments/:id/approve` | Admin | Approve comment |
| DELETE | `/api/admin/comments/:id` | Admin | Delete comment |

Comment submission requires: name, email, content, optional parentId (for replies). Rate limited: 5 comments per IP per 15 minutes.

### 2. Build Admin Blog UI

**2.1 Post editor page:**

```
apps/web/src/app/admin/blog/new/page.tsx (and [id]/page.tsx)
- Left column (2/3): Tiptap rich-text editor (full toolbar)
- Right column (1/3):
  - Status selector (Draft / Published / Archived)
  - Publish date picker (for scheduling)
  - Category selector
  - Tags (multi-select, creatable)
  - Featured image (MediaPicker)
  - SEO section (metaTitle, metaDescription, slug, Google preview)
  - Reading time (auto-calculated, read-only)
```

Tiptap toolbar: Bold, Italic, Strikethrough, H2, H3, H4, Bullet list, Ordered list, Blockquote, Code block, Link, Image (upload via Media Library), Horizontal rule, Undo/Redo.

**2.2 Post list page:**

DataTable with columns: featured image thumbnail, title, category, status badge, author, published date, views, actions (edit/delete).
Filters: status dropdown, category dropdown, search by title.

**2.3 Blog category management:**

Simple list with inline edit. Fields: name, slug (auto), description, sortOrder, isActive.

**2.4 Comment moderation page:**

```
apps/web/src/app/admin/blog/comments/page.tsx (or apps/web/src/app/admin/reviews/page.tsx)
- DataTable: comment content preview, post title, author, email, status, date
- Quick actions: approve, reject/delete
- Filter: pending / approved / all
```

### 3. Build Storefront Blog Pages

**3.1 Blog listing page:**

```tsx
// apps/web/src/app/(storefront)/blog/page.tsx
export default async function BlogPage({ searchParams }) {
  const category = searchParams.category;
  const page = Number(searchParams.page) || 1;

  const [posts, categories] = await Promise.all([
    fetchPosts({ category, page, limit: 9, status: "PUBLISHED" }),
    fetchPostCategories(),
  ]);

  return (
    <>
      <Breadcrumbs items={[{ label: "Blog" }]} />
      <h1>Blog Enzara</h1>

      {/* Category filter tabs */}
      <CategoryTabs categories={categories} active={category} />

      {/* Post grid: 1 col mobile, 2 col tablet, 3 col desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.items.map(post => <BlogCard key={post.id} post={post} />)}
      </div>

      <Pagination total={posts.totalPages} current={page} />
    </>
  );
}
```

**3.2 Blog detail page:**

```tsx
// apps/web/src/app/(storefront)/blog/[slug]/page.tsx
export async function generateMetadata({ params }) {
  const post = await fetchPost(params.slug);
  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [post.featuredImage],
      type: "article",
      publishedTime: post.publishedAt,
    },
  };
}

export default async function BlogDetailPage({ params }) {
  const post = await fetchPost(params.slug);
  const [related, categories, recentPosts] = await Promise.all([
    fetchPosts({ category: post.category?.slug, limit: 3, exclude: post.id }),
    fetchPostCategories(),
    fetchPosts({ limit: 5, sort: "newest" }),
  ]);

  // Fire view count increment (non-blocking)
  incrementViewCount(params.slug);

  return (
    <>
      <Breadcrumbs items={[
        { label: "Blog", href: "/blog" },
        { label: post.category?.name, href: `/blog?category=${post.category?.slug}` },
        { label: post.title },
      ]} />

      {post.featuredImage && (
        <Image src={post.featuredImage} alt={post.title} className="w-full rounded-enzara" />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content (2/3) */}
        <article className="lg:col-span-2">
          <span className="text-brand-green">{post.category?.name}</span>
          <h1>{post.title}</h1>
          <div className="text-muted-foreground">
            {post.publishedAt} | {post.readingTime} phut doc | {post.viewCount} luot xem
          </div>

          <ShareButtons url={`/blog/${post.slug}`} title={post.title} />
          <TableOfContents content={post.content} />

          {/* Rendered HTML content (sanitized with DOMPurify) */}
          <div className="prose" dangerouslySetInnerHTML={{ __html: sanitize(post.content) }} />

          <div className="flex gap-2">{post.tags.map(tag => <Badge>{tag}</Badge>)}</div>
          <ShareButtons url={`/blog/${post.slug}`} title={post.title} />
          <CommentSection slug={post.slug} />
        </article>

        {/* Sidebar (1/3) */}
        <BlogSidebar categories={categories} recentPosts={recentPosts.items} />
      </div>

      <RelatedPosts posts={related.items} />

      {/* JSON-LD Article schema */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify(articleJsonLd(post))
      }} />
    </>
  );
}

export const revalidate = 300; // ISR: 5 minutes
```

**3.3 TableOfContents component:**

```typescript
// Parse HTML content for h2/h3 headings
// Generate anchor links
// Render as sticky sidebar navigation on desktop
// Collapsible on mobile
function extractHeadings(html: string): { id: string; text: string; level: number }[] {
  const regex = /<h([23])[^>]*>(.*?)<\/h[23]>/gi;
  const headings = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    const id = generateSlug(match[2].replace(/<[^>]+>/g, ""));
    headings.push({ id, text: match[2].replace(/<[^>]+>/g, ""), level: parseInt(match[1]) });
  }
  return headings;
}
```

**3.4 ShareButtons component:**

- Facebook share: `https://www.facebook.com/sharer/sharer.php?u={url}`
- Zalo share: `https://zalo.me/share?url={url}`
- Twitter/X: `https://twitter.com/intent/tweet?url={url}&text={title}`
- Copy link: navigator.clipboard API with toast notification

**3.5 CommentSection component (client component):**

- Fetch approved comments for the post
- Display threaded/nested comments
- Comment form: name, email, content, submit
- "Binh luan cua ban dang cho duyet" message after submission
- Reply button on each comment (shows nested form)

### 4. Build SEO Infrastructure

**4.1 Metadata generation helper:**

```typescript
// apps/web/src/lib/seo.ts
import { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://enzara.vn";

export function generatePageMetadata(opts: {
  title: string;
  description: string;
  image?: string;
  path: string;
  type?: "website" | "article";
  publishedTime?: string;
}): Metadata {
  const url = `${SITE_URL}${opts.path}`;
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: url },
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
```

**4.2 JSON-LD structured data helpers:**

```typescript
// Product schema
export function productJsonLd(product: Product) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDesc,
    image: product.images.map(i => i.url),
    sku: product.sku,
    brand: { "@type": "Brand", name: product.brand?.name || "Enzara" },
    offers: {
      "@type": "Offer",
      priceCurrency: "VND",
      price: Number(product.salePrice || product.basePrice),
      availability: product.stockQuantity > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `${SITE_URL}/products/${product.slug}`,
    },
    aggregateRating: product.avgRating > 0 ? {
      "@type": "AggregateRating",
      ratingValue: Number(product.avgRating),
      reviewCount: product.reviews?.length || 0,
    } : undefined,
  };
}

// Article schema
export function articleJsonLd(post: Post) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: post.featuredImage,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { "@type": "Person", name: "Enzara" },
    publisher: {
      "@type": "Organization",
      name: "Enzara",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` },
    },
  };
}

// BreadcrumbList schema
export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  };
}

// Organization schema (homepage)
export function organizationJsonLd(settings: GeneralSettings) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Enzara",
    url: SITE_URL,
    logo: settings.logo,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: settings.contact.phone,
      contactType: "customer service",
      areaServed: "VN",
      availableLanguage: "vi",
    },
    sameAs: [
      settings.social.facebook,
      settings.social.tiktok,
      settings.social.youtube,
    ].filter(Boolean),
  };
}
```

**4.3 Sitemap generation:**

```typescript
// apps/web/src/app/sitemap.ts
import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, posts, categories, pages] = await Promise.all([
    fetchAllProductSlugs(),
    fetchAllPostSlugs(),
    fetchAllCategorySlugs(),
    fetchAllPageSlugs(),
  ]);

  const staticPages = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/products`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
  ];

  const productPages = products.map(p => ({
    url: `${SITE_URL}/products/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const postPages = posts.map(p => ({
    url: `${SITE_URL}/blog/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const categoryPages = categories.map(c => ({
    url: `${SITE_URL}/categories/${c.slug}`,
    lastModified: c.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const cmsPages = pages.map(p => ({
    url: `${SITE_URL}/pages/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [...staticPages, ...productPages, ...categoryPages, ...postPages, ...cmsPages];
}
```

**4.4 Robots.txt:**

```typescript
// apps/web/src/app/robots.ts
import { MetadataRoute } from "next";

export default async function robots(): Promise<MetadataRoute.Robots> {
  // Optionally fetch from CMS settings for admin-configurable robots
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/checkout", "/account"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
```

### 5. Vietnamese Slug Handling

Already implemented in `packages/utils/src/slug.ts`. Ensure it handles all Vietnamese diacritics:

```typescript
// Test cases:
// "Nước Rửa Chén Hữu Cơ" -> "nuoc-rua-chen-huu-co"
// "Gel Rửa Bình Sữa" -> "gel-rua-binh-sua"
// "Enzyme Dứa 90 Ngày" -> "enzyme-dua-90-ngay"
// "Đặc biệt & Nổi bật!" -> "dac-biet-noi-bat"
```

Used in: product slug, category slug, post slug, page slug generation.

### 6. Apply SEO to All Existing Pages

Retroactively add proper `generateMetadata` to pages built in earlier phases:

- Homepage: Organization title, default description from CMS
- Product listing: "San pham | Enzara" with category name if filtered
- Product detail: product name + short description
- Category pages: category name + description
- Blog listing: "Blog | Enzara"
- Blog detail: post title + excerpt
- Static pages: page title + metaDescription
- Cart/Checkout: `noindex` (no reason to index)

### 7. ISR Revalidation API Route

```typescript
// apps/web/src/app/api/revalidate/route.ts
// Called by NestJS backend when content changes
// POST /api/revalidate { path: "/products/some-slug", secret: "xxx" }
// Triggers Next.js on-demand revalidation
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  const { path, secret } = await request.json();
  if (secret !== process.env.REVALIDATION_SECRET) {
    return Response.json({ error: "Invalid secret" }, { status: 401 });
  }
  revalidatePath(path);
  return Response.json({ revalidated: true });
}
```

NestJS triggers revalidation after: product update, post publish/update, settings change, banner update.

## Todo List

- [ ] Create blog module (NestJS) with admin post CRUD
- [ ] Create public post endpoints (listing, detail, recent, popular)
- [ ] Implement reading time calculation
- [ ] Implement unique slug generation with Vietnamese support
- [ ] Create blog category CRUD endpoints
- [ ] Create comment submission and moderation endpoints
- [ ] Build admin post editor page (Tiptap + sidebar fields)
- [ ] Build admin post list page (DataTable)
- [ ] Build admin blog category management page
- [ ] Build admin comment moderation page
- [ ] Build blog listing page (storefront)
- [ ] Build blog detail page with two-column layout
- [ ] Build TableOfContents component (auto from headings)
- [ ] Build ShareButtons component (Facebook, Zalo, Twitter, Copy)
- [ ] Build CommentSection component (form + threaded display)
- [ ] Build BlogSidebar (search, categories, recent/popular)
- [ ] Build BlogCard component
- [ ] Create SEO metadata generation helper (`seo.ts`)
- [ ] Create JSON-LD helpers (Product, Article, BreadcrumbList, Organization)
- [ ] Implement sitemap.ts with all content types
- [ ] Implement robots.ts
- [ ] Add `generateMetadata` to all existing pages
- [ ] Add JSON-LD to homepage, product detail, blog detail
- [ ] Build ISR revalidation API route
- [ ] Trigger revalidation from NestJS on content changes
- [ ] Test Vietnamese slug generation with all edge cases
- [ ] Add `noindex` to cart/checkout/account pages

## Success Criteria

1. Admin can create, edit, and publish blog posts with rich content
2. Blog listing shows published posts with category filtering and pagination
3. Blog detail page renders content with TOC, share buttons, and related posts
4. Comments can be submitted and appear after admin approval
5. `sitemap.xml` includes all products, posts, categories, and pages
6. `robots.txt` blocks admin/API/checkout paths
7. All pages have proper `<title>`, `<meta description>`, and Open Graph tags
8. Product detail pages include Product JSON-LD structured data
9. Blog detail pages include Article JSON-LD structured data
10. Vietnamese slugs generate correctly for all diacritics
11. ISR revalidation updates pages within seconds of backend changes
12. Google Search Console validates structured data without errors

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Tiptap HTML output inconsistent across browsers | Medium | Normalize HTML on server before save; DOMPurify on output |
| Sitemap too large (>50K URLs) | Low | Not a concern for current catalog size; split if needed |
| Comment spam | Medium | Rate limiting + honeypot field + manual moderation |
| ISR revalidation missing some paths | Low | Revalidate parent paths (e.g., `/products` when any product changes) |
| Coc Coc search engine has different crawling behavior | Low | Test with Coc Coc Webmaster Tools; follow Google best practices |

## Security Considerations

- Blog content sanitized with DOMPurify before rendering to prevent stored XSS
- Comment content escaped on output; no HTML allowed in comments
- Rate limiting on comment submission: 5 per IP per 15 minutes
- Revalidation endpoint protected by secret key
- Admin blog endpoints behind JwtAuthGuard + RolesGuard
- Comment email addresses not exposed in public API responses
- Sitemap does not expose admin/internal URLs
- `noindex` on cart, checkout, and account pages to prevent indexing sensitive pages

## Next Steps

After this phase, the MVP is complete. Proceed to:
- **QA and bug fixing** across all phases
- **Performance audit** (Lighthouse, Core Web Vitals on mobile)
- **Content population** (seed products, blog posts, settings)
- **Staging deployment** (Docker + Nginx + PM2 on VPS)
- **Phase 2 planning** (Tracking, Chat, Reviews, Vouchers, Notifications)
