# Phase 03 - Products & Storefront

## Context Links

- [Master Plan](./plan.md)
- [Previous: Auth & CMS](./phase-02-auth-and-cms.md)
- [Next: Cart, Checkout & Orders](./phase-04-cart-checkout-orders.md)
- [PRD Module 5.3: Products](../Web-enzara-prd.md)
- [PRD Module 5.4: Storefront UI](../Web-enzara-prd.md)
- [Brand Research](../docs/research-enzara-brand.md)

## Overview

| Field | Value |
|-------|-------|
| **Date** | 2026-02-08 |
| **Priority** | Critical |
| **Status** | Pending |
| **Estimated** | 2 weeks |
| **Depends on** | Phase 02 (Auth & CMS) |
| **Blocks** | Phase 04 (Cart/Checkout) |

## Key Insights

- Enzara has ~5 core product lines, each with variants (scent/size). Small catalog = emphasis on rich product pages, not complex filtering.
- Product admin needs tabbed form: basic info, pricing/stock, variants, images (drag-drop), SEO.
- Storefront is mobile-first: 2-col product grid on mobile, 3-4 on desktop. 70%+ VN traffic is mobile.
- Homepage sections are CMS-configurable via `appearance` settings (order, enable/disable).
- Vietnamese slug generation critical -- `generateSlug("Nước Rửa Chén Hữu Cơ")` => `nuoc-rua-chen-huu-co`.
- Product images auto-convert to WebP via Sharp. Embla Carousel for galleries.
- Prices in VND with no decimals (`Decimal(12, 0)`). Format: `85.000đ`.

## Requirements

### Product Management (Admin)
- PROD-01: Full product CRUD (name, description, price, images, SEO)
- PROD-02: Variant management (name, SKU, price, stock per variant)
- PROD-03: Category CRUD with nested tree structure
- PROD-04: Brand CRUD
- PROD-05: Multi-image upload with drag-drop reorder
- PROD-07: Stock management per product/variant
- PROD-09: Featured product flagging
- PROD-11: Auto-generate slug from product name

### Storefront
- Homepage with CMS-driven sections (hero, categories, product carousels, blog posts)
- Product listing page with filters (category, price range, brand) and sorting
- Product detail page with gallery, variants, add-to-cart, tabs
- Search with Vietnamese text support
- Header with logo, mega menu, search, account, cart
- Footer with configurable columns, payment icons, social links

## Architecture

### Product Module (NestJS)

```
apps/api/src/modules/products/
├── products.module.ts
├── products.controller.ts       # Admin: CRUD products
├── products.service.ts
├── products-public.controller.ts  # Public: listing, detail, search
├── categories.controller.ts     # Admin: CRUD categories
├── categories.service.ts
├── brands.controller.ts         # Admin: CRUD brands
├── brands.service.ts
├── dto/
│   ├── create-product.dto.ts
│   ├── update-product.dto.ts
│   ├── product-filter.dto.ts    # query params: category, price, sort, page
│   ├── create-category.dto.ts
│   └── create-brand.dto.ts
└── entities/                    # (Prisma models serve as entities)
```

### Storefront Pages (Next.js)

```
apps/web/src/app/(storefront)/
├── layout.tsx                   # Storefront shell: Header + Footer
├── page.tsx                     # Homepage (SSG/ISR)
├── products/
│   ├── page.tsx                 # Product listing (SSR with search params)
│   └── [slug]/page.tsx          # Product detail (ISR, revalidate 60s)
├── categories/
│   └── [slug]/page.tsx          # Category product listing
├── search/page.tsx              # Search results
└── pages/[slug]/page.tsx        # Static CMS pages
```

### Storefront Components

```
apps/web/src/components/storefront/
├── header/
│   ├── Header.tsx               # Sticky header, responsive
│   ├── MegaMenu.tsx             # Desktop dropdown with category images
│   ├── MobileMenu.tsx           # Sheet/drawer for mobile nav
│   ├── AnnouncementBar.tsx      # Top banner from CMS settings
│   └── SearchModal.tsx          # Overlay search with debounced results
├── footer/
│   ├── Footer.tsx               # Multi-column from CMS settings
│   └── PaymentIcons.tsx         # COD, SePay/VietQR, bank logos
├── product/
│   ├── ProductCard.tsx          # Grid card: image, name, price, rating, sale badge
│   ├── ProductGallery.tsx       # Embla carousel + thumbnails + lightbox
│   ├── ProductTabs.tsx          # Description, specs, reviews tabs
│   ├── VariantSelector.tsx      # Color swatches / size buttons
│   └── RelatedProducts.tsx      # Horizontal carousel of related items
├── home/
│   ├── HeroSlider.tsx           # Embla carousel from Banner model (position=hero)
│   ├── CategoryGrid.tsx         # Category cards with images
│   ├── ProductCarousel.tsx      # Reusable: featured/new/bestseller products
│   ├── Testimonials.tsx         # Customer reviews carousel
│   ├── BrandLogos.tsx           # Partner/certification logos
│   └── Newsletter.tsx           # Email signup form
├── shared/
│   ├── Breadcrumbs.tsx
│   ├── Pagination.tsx
│   ├── Rating.tsx               # Star rating display
│   └── SEOHead.tsx              # Metadata helper
└── widgets/
    ├── BackToTop.tsx
    └── FloatingCart.tsx          # Mobile mini-cart badge
```

### Admin Product Pages

```
apps/web/src/app/admin/
├── products/
│   ├── page.tsx                 # Product list (DataTable)
│   ├── new/page.tsx             # Create product form
│   └── [id]/page.tsx            # Edit product form
├── categories/
│   ├── page.tsx                 # Category tree view
│   └── [id]/page.tsx            # Category form
└── brands/
    ├── page.tsx                 # Brand list
    └── [id]/page.tsx            # Brand form
```

## Related Code Files

### Backend
- `apps/api/src/modules/products/products.controller.ts`
- `apps/api/src/modules/products/products.service.ts`
- `apps/api/src/modules/products/products-public.controller.ts`
- `apps/api/src/modules/products/categories.controller.ts`
- `apps/api/src/modules/products/categories.service.ts`
- `apps/api/src/modules/products/brands.controller.ts`
- `apps/api/src/modules/products/dto/product-filter.dto.ts`

### Frontend - Admin
- `apps/web/src/app/admin/products/page.tsx`
- `apps/web/src/app/admin/products/new/page.tsx`
- `apps/web/src/app/admin/products/[id]/page.tsx`
- `apps/web/src/app/admin/categories/page.tsx`

### Frontend - Storefront
- `apps/web/src/app/(storefront)/layout.tsx`
- `apps/web/src/app/(storefront)/page.tsx`
- `apps/web/src/app/(storefront)/products/[slug]/page.tsx`
- `apps/web/src/components/storefront/header/Header.tsx`
- `apps/web/src/components/storefront/product/ProductCard.tsx`
- `apps/web/src/components/storefront/product/ProductGallery.tsx`
- `apps/web/src/components/storefront/home/HeroSlider.tsx`

## Implementation Steps

### 1. Build Product Backend API

**1.1 Admin product endpoints:**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/products` | Admin/Staff | List products (paginated, filterable) |
| GET | `/api/admin/products/:id` | Admin/Staff | Get product with variants + images |
| POST | `/api/admin/products` | Admin/Staff | Create product |
| PUT | `/api/admin/products/:id` | Admin/Staff | Update product |
| DELETE | `/api/admin/products/:id` | Admin | Soft delete product |
| POST | `/api/admin/products/:id/images` | Admin/Staff | Upload product images |
| PUT | `/api/admin/products/:id/images/reorder` | Admin/Staff | Reorder images |
| DELETE | `/api/admin/products/:id/images/:imageId` | Admin/Staff | Delete image |

**1.2 Public product endpoints:**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/products` | Public | List active products (paginated, filtered) |
| GET | `/api/products/:slug` | Public | Get product detail by slug |
| GET | `/api/products/featured` | Public | Featured products |
| GET | `/api/products/search` | Public | Search by name (Vietnamese support) |

**1.3 Product filter DTO:**

```typescript
// apps/api/src/modules/products/dto/product-filter.dto.ts
export class ProductFilterDto {
  @IsOptional() @IsString() category?: string;     // category slug
  @IsOptional() @IsString() brand?: string;         // brand slug
  @IsOptional() @IsNumber() minPrice?: number;
  @IsOptional() @IsNumber() maxPrice?: number;
  @IsOptional() @IsEnum(SortBy) sort?: SortBy;      // newest, price_asc, price_desc, bestseller
  @IsOptional() @IsInt() page?: number;             // default 1
  @IsOptional() @IsInt() limit?: number;            // default 12
  @IsOptional() @IsString() search?: string;
}
```

**1.4 Product service query with filtering:**

```typescript
async findPublic(filter: ProductFilterDto) {
  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(filter.category && { category: { slug: filter.category } }),
    ...(filter.brand && { brand: { slug: filter.brand } }),
    ...(filter.minPrice && { basePrice: { gte: filter.minPrice } }),
    ...(filter.maxPrice && { basePrice: { lte: filter.maxPrice } }),
    ...(filter.search && {
      OR: [
        { name: { contains: filter.search, mode: "insensitive" } },
        { tags: { has: filter.search } },
      ],
    }),
  };

  const orderBy = this.getSortOrder(filter.sort);
  const [items, total] = await Promise.all([
    this.prisma.product.findMany({
      where, orderBy,
      skip: ((filter.page || 1) - 1) * (filter.limit || 12),
      take: filter.limit || 12,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        category: { select: { name: true, slug: true } },
      },
    }),
    this.prisma.product.count({ where }),
  ]);

  return { items, total, page: filter.page || 1, totalPages: Math.ceil(total / (filter.limit || 12)) };
}
```

### 2. Build Category & Brand APIs

**2.1 Category endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | Public: active categories tree |
| GET | `/api/admin/categories` | Admin: all categories flat list |
| POST | `/api/admin/categories` | Create category |
| PUT | `/api/admin/categories/:id` | Update category |
| DELETE | `/api/admin/categories/:id` | Delete (if no products) |

Category tree built by recursive query on `parentId`. Return nested structure for mega menu.

**2.2 Brand endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/brands` | Public: active brands |
| POST | `/api/admin/brands` | Create brand |
| PUT | `/api/admin/brands/:id` | Update brand |
| DELETE | `/api/admin/brands/:id` | Delete brand |

### 3. Build Admin Product Form

**3.1 Tabbed product form:**

- **Tab 1 - Basic Info**: name (auto-generates slug), shortDesc, description (Tiptap RichTextEditor), category (tree select), brand (select), tags (multi-select creatable)
- **Tab 2 - Price & Stock**: basePrice, salePrice, SKU, barcode, stockQuantity, weight, isActive toggle
- **Tab 3 - Variants**: dynamic form to add variants. Each row: name, SKU, price, salePrice, stock, attributes (JSON editor for color/size). "Generate combinations" button.
- **Tab 4 - Images**: drag-drop upload zone, grid of uploaded images, set primary, reorder via drag, alt text per image
- **Tab 5 - SEO**: metaTitle, metaDescription, Google snippet preview

Use React Hook Form with Zod schema. Submit creates/updates product + variants + images in single API call.

**3.2 Product list page:**

DataTable with columns: image thumbnail, name, category, price, stock, status, actions.
Filters: category dropdown, status toggle, search input.
Bulk actions: activate, deactivate, delete.

### 4. Build Admin Category Management

- Tree view component showing parent/child hierarchy
- Create/edit form: name, slug, description, image (MediaPicker), parent (select), sortOrder, isActive, metaTitle, metaDesc
- Drag-drop reordering within tree

### 5. Build Storefront Layout

**5.1 Header component:**

```tsx
// apps/web/src/components/storefront/header/Header.tsx
// Sticky header with:
// - AnnouncementBar (from CMS settings.appearance.announcement_bar)
// - Logo (from CMS settings.general.logo)
// - MegaMenu (desktop: dropdown with category images)
// - MobileMenu (hamburger -> Sheet drawer)
// - SearchModal trigger (magnifying glass icon)
// - Account icon (login/profile link)
// - Cart icon with item count badge
```

**5.2 MegaMenu:**

- Fetches categories tree from `/api/categories`
- Desktop: hover dropdown showing subcategories with images
- Groups by parent category
- Styled with Enzara green + white, rounded corners

**5.3 Footer:**

- Rendered from CMS `settings.appearance.footer` configuration
- Multi-column layout: about text, policy links, contact info
- Payment method icons (COD, VietQR/SePay)
- Social media links (Facebook, TikTok, YouTube from settings.general.social)
- BCT badge (Bo Cong Thuong)
- Copyright text

**5.4 Storefront layout:**

```tsx
// apps/web/src/app/(storefront)/layout.tsx
export default async function StorefrontLayout({ children }) {
  // Fetch settings (general, appearance) at layout level -- cached via ISR
  const [general, appearance, menus] = await Promise.all([
    fetchSettings("general"),
    fetchSettings("appearance"),
    fetchMenus(),
  ]);

  return (
    <>
      <AnnouncementBar config={appearance.announcement_bar} />
      <Header settings={general} menus={menus} />
      <main>{children}</main>
      <Footer settings={general} config={appearance.footer} />
      <BackToTop />
    </>
  );
}
```

### 6. Build Homepage

**6.1 Dynamic section rendering:**

Homepage reads `appearance.homepage_sections` from CMS settings. Each section has `type`, `enabled`, `sort_order`. Render enabled sections in sort order.

```tsx
// apps/web/src/app/(storefront)/page.tsx
export default async function HomePage() {
  const appearance = await fetchSettings("appearance");
  const sections = appearance.homepage_sections
    .filter(s => s.enabled)
    .sort((a, b) => a.sort_order - b.sort_order);

  // Parallel data fetching for all sections
  const [banners, categories, featured, newProducts, bestSellers, posts] =
    await Promise.all([
      fetchBanners("hero"),
      fetchCategories(),
      fetchProducts({ featured: true, limit: 8 }),
      fetchProducts({ sort: "newest", limit: 8 }),
      fetchProducts({ sort: "bestseller", limit: 8 }),
      fetchPosts({ limit: 4 }),
    ]);

  return (
    <>
      {sections.map(section => {
        switch (section.type) {
          case "hero_slider": return <HeroSlider banners={banners} />;
          case "category_grid": return <CategoryGrid categories={categories} />;
          case "featured_products": return <ProductCarousel title={section.title} products={featured} />;
          // ... etc
        }
      })}
    </>
  );
}

export const revalidate = 300; // ISR: revalidate every 5 minutes
```

**6.2 HeroSlider:**

Embla Carousel with auto-play, dots, swipe. Desktop + mobile images from Banner model. Link on click.

**6.3 ProductCarousel:**

Horizontal scrollable carousel using Embla. Shows ProductCard components. Responsive: 2 visible on mobile, 4 on desktop.

**6.4 CategoryGrid:**

Grid of category cards with image backgrounds. 2x3 on mobile, 3x2 on desktop. Links to `/categories/:slug`.

### 7. Build Product Listing Page

```tsx
// apps/web/src/app/(storefront)/products/page.tsx
// SSR with searchParams for filters
export default async function ProductListingPage({ searchParams }) {
  const products = await fetchProducts(searchParams);
  const categories = await fetchCategories();
  const brands = await fetchBrands();

  return (
    <>
      <Breadcrumbs items={[{ label: "San pham" }]} />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <FilterSidebar categories={categories} brands={brands} />
        <div className="lg:col-span-3">
          <SortBar />
          <ProductGrid products={products.items} />
          <Pagination total={products.totalPages} current={products.page} />
        </div>
      </div>
    </>
  );
}
```

FilterSidebar: category links, price range slider, brand checkboxes. Updates URL search params for SSR-compatible filtering.

### 8. Build Product Detail Page

```tsx
// apps/web/src/app/(storefront)/products/[slug]/page.tsx
export async function generateMetadata({ params }) {
  const product = await fetchProduct(params.slug);
  return {
    title: product.metaTitle || product.name,
    description: product.metaDescription || product.shortDesc,
    openGraph: { images: [product.images[0]?.url] },
  };
}

export default async function ProductDetailPage({ params }) {
  const product = await fetchProduct(params.slug);
  const related = await fetchProducts({ category: product.category?.slug, limit: 8 });

  return (
    <>
      <Breadcrumbs items={[
        { label: "San pham", href: "/products" },
        { label: product.category?.name, href: `/categories/${product.category?.slug}` },
        { label: product.name },
      ]} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ProductGallery images={product.images} />
        <ProductInfo product={product} />  {/* price, variants, add-to-cart */}
      </div>
      <ProductTabs product={product} />
      <RelatedProducts products={related.items} />
      {/* JSON-LD structured data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify(productJsonLd(product))
      }} />
    </>
  );
}

export const revalidate = 60; // ISR: revalidate every 60 seconds
```

### 9. Build ProductGallery Component

- Embla Carousel for main image with thumbnails below
- Zoom on hover (desktop) via CSS transform
- Lightbox fullscreen modal on click
- Swipe-friendly on mobile
- Lazy loading for non-visible images

### 10. Build Search

**10.1 SearchModal component:**

- Triggered by search icon in header
- Full-screen overlay on mobile, centered modal on desktop
- Debounced input (300ms) queries `/api/products/search?q=`
- Shows product cards in results
- Recent searches stored in localStorage

**10.2 Search results page:**

- `/search?q=keyword` with SSR
- Same layout as product listing
- Empty state: "Khong tim thay san pham"

### 11. Increment product view count

On product detail page load, fire `POST /api/products/:slug/view` (fire-and-forget, no await). Service increments `viewCount` field. Debounce per session to avoid inflation.

## Todo List

- [ ] Create products module (NestJS) with admin CRUD endpoints
- [ ] Create public product endpoints (list, detail, search, featured)
- [ ] Implement product filter/sort/pagination logic
- [ ] Create categories module with nested tree support
- [ ] Create brands module with CRUD
- [ ] Build admin product list page (DataTable)
- [ ] Build admin product form (tabbed: basic, pricing, variants, images, SEO)
- [ ] Build admin category tree view + CRUD form
- [ ] Build admin brand list + CRUD form
- [ ] Build Header component (responsive, sticky)
- [ ] Build MegaMenu with category tree dropdown
- [ ] Build MobileMenu (Sheet drawer)
- [ ] Build AnnouncementBar from CMS settings
- [ ] Build SearchModal with debounced search
- [ ] Build Footer with CMS-driven columns
- [ ] Build storefront layout (header + footer shell)
- [ ] Build Homepage with dynamic CMS sections
- [ ] Build HeroSlider with Embla Carousel
- [ ] Build CategoryGrid component
- [ ] Build ProductCarousel (reusable for featured/new/bestseller)
- [ ] Build ProductCard component
- [ ] Build product listing page with FilterSidebar
- [ ] Build SortBar and Pagination components
- [ ] Build product detail page
- [ ] Build ProductGallery with thumbnails + lightbox + zoom
- [ ] Build VariantSelector (swatches/buttons)
- [ ] Build ProductTabs (description, specs, reviews placeholder)
- [ ] Build RelatedProducts carousel
- [ ] Build Breadcrumbs component
- [ ] Build search results page
- [ ] Implement view count tracking
- [ ] Add Product JSON-LD structured data
- [ ] Add BreadcrumbList JSON-LD

## Success Criteria

1. Admin can create a product with all fields, variants, and multiple images
2. Admin can manage categories in a nested tree structure
3. Products appear on storefront listing with correct filtering and sorting
4. Product detail page renders gallery, variant selection, pricing, and tabs
5. Homepage renders CMS-configurable sections with real product data
6. Header mega menu shows category tree, search works with Vietnamese text
7. Mobile layout is responsive and usable (2-col grid, hamburger menu)
8. ISR works -- product pages revalidate without full rebuild
9. Page load under 3s on simulated 3G mobile connection (for above-the-fold)

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Large product images slow mobile performance | High | Sharp auto-resize to max 1200px, WebP, lazy loading |
| Vietnamese search accuracy (diacritics) | Medium | PostgreSQL `unaccent` extension + `ilike` search |
| ISR cache invalidation lag | Low | Webhook-triggered revalidation for price/stock changes |
| Embla Carousel SSR hydration mismatch | Low | Use `useEffect` for client-only carousel init |
| Category tree N+1 queries | Medium | Single recursive CTE query or fetch all + build tree in memory |

## Security Considerations

- Admin product endpoints behind JwtAuthGuard + RolesGuard (ADMIN/STAFF only)
- Public endpoints have no auth but are read-only
- File uploads validated: image MIME types only, max 5MB
- Product descriptions sanitized on output to prevent XSS
- Search input sanitized to prevent SQL injection (Prisma parameterized queries)
- Rate limiting on search endpoint to prevent abuse

## Next Steps

After this phase completes, proceed to [Phase 04 - Cart, Checkout & Orders](./phase-04-cart-checkout-orders.md).
