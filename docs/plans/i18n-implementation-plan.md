# i18n Implementation Plan -- next-intl for Enzara Storefront

**Status**: Draft
**Date**: 2026-02-10
**Scope**: Storefront only (`(storefront)/*`). Admin panel unchanged.
**Locales**: `vi` (default), `en`
**Library**: `next-intl` (App Router compatible)

---

## 1. Current State Analysis

### Architecture
- **Next.js 15** with App Router, monorepo (`apps/web/`)
- Root layout at `apps/web/src/app/layout.tsx` hardcodes `lang="vi"`
- Storefront route group: `apps/web/src/app/(storefront)/`
- Admin route group: `apps/web/src/app/admin/` (excluded from i18n)
- Middleware at `apps/web/src/middleware.ts` only handles admin auth
- `@/*` path alias maps to `./src/*`

### Vietnamese-slug routes (require English mapping)
| Current slug       | English equivalent |
|--------------------|--------------------|
| `/lien-he`         | `/contact`         |
| `/theo-doi-don-hang` | `/order-tracking` |

### Hardcoded Vietnamese text locations
- **Layouts**: root layout metadata, storefront layout
- **Pages**: home (`page.tsx`), products, cart, checkout, contact, order-tracking, auth/*, account/*, blog, search, not-found, error
- **Components**: Header, Footer, MobileMenu, SearchModal, Breadcrumbs, Newsletter, CartSummary, CartSuggestions, ShippingForm, PaymentMethodSelector, VoucherInput, OrderSummary, LoyaltyRedemption, FilterSidebar, SortBar, AddToCartSection, ProductCard, ContactForm, TrackingForm, FlashSaleWidget, Testimonials, HeroSlider, OrganicSectionHeading calls
- **Validation schemas**: checkout (`zod` messages), login, register, forgot-password, reset-password
- **SEO**: `lib/seo.ts` hardcodes `locale: "vi_VN"` for OpenGraph
- **Utilities**: `formatPrice()` uses `"vi-VN"` locale in cart/checkout
- **Sitemap**: `sitemap.ts` generates single-locale URLs

### No i18n dependencies installed
Package.json has no `next-intl`, `react-intl`, or similar.

---

## 2. Architecture Decision

### Why next-intl
- First-class App Router support (Server Components, `generateMetadata`, middleware routing)
- Locale-prefix URL strategy out of the box
- Message namespaces for organized translation files
- ICU MessageFormat (plurals, interpolation)
- Small bundle: only ships translations for the active locale to the client

### URL Strategy
```
/vi/products          (default locale, shown explicitly)
/en/products
/vi/lien-he           (Vietnamese slug kept for vi)
/en/contact           (English slug for en)
```

The default locale `vi` will still show the prefix (`/vi/...`) for clarity and SEO consistency. Redirect bare `/` to `/vi`. This avoids the complexity of "hide default locale prefix" which causes issues with Vietnamese-slug routes.

**Alternative considered**: Hide default locale prefix (no `/vi/`). Rejected because the Vietnamese-slug routes (`/lien-he`, `/theo-doi-don-hang`) would conflict with a locale-unaware URL structure, making it impossible to tell if `/lien-he` is a locale or a page.

---

## 3. Implementation Phases

### Phase 1: Install and Configure next-intl

**3.1 Install dependency**
```bash
cd apps/web && pnpm add next-intl
```

**3.2 Create i18n configuration file**

File: `apps/web/src/i18n/config.ts`
```ts
export const locales = ["vi", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "vi";
```

**3.3 Create i18n request configuration**

File: `apps/web/src/i18n/request.ts`

This file is the next-intl App Router entry point. It uses `getRequestConfig` to load messages for the current locale from JSON files.

```ts
import { getRequestConfig } from "next-intl/server";
import { locales, defaultLocale } from "./config";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !locales.includes(locale as any)) {
    locale = defaultLocale;
  }
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
```

**3.4 Create next-intl plugin in next.config.js**

File: `apps/web/next.config.js` (modify)

Wrap with `createNextIntlPlugin`:
```js
const createNextIntlPlugin = require("next-intl/plugin");
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig = { /* existing config */ };
module.exports = withNextIntl(nextConfig);
```

**3.5 Update middleware**

File: `apps/web/src/middleware.ts` (modify)

Merge admin auth logic with next-intl's `createMiddleware`. Key behavior:
- Requests to `/admin/*` skip locale routing entirely, keep existing auth guard
- Requests to `/api/*` skip locale routing
- All other requests get locale detection and prefix redirection

```ts
import createMiddleware from "next-intl/middleware";
import { NextResponse, NextRequest } from "next/server";
import { locales, defaultLocale } from "./i18n/config";

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
});

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip i18n for admin and API routes
  if (pathname.startsWith("/admin") || pathname.startsWith("/api")) {
    // Existing admin auth logic here
    if (pathname.startsWith("/admin")) {
      if (pathname === "/admin/login") return NextResponse.next();
      const authCookie = request.cookies.get("enzara-auth");
      if (!authCookie || authCookie.value !== "1") {
        return NextResponse.redirect(new URL("/admin/login", request.url));
      }
    }
    return NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
```

---

### Phase 2: Route Restructuring

**Current structure:**
```
apps/web/src/app/
  layout.tsx              <-- root
  (storefront)/
    layout.tsx
    page.tsx
    products/
    cart/
    checkout/
    lien-he/
    theo-doi-don-hang/
    ...
  admin/
```

**New structure:**
```
apps/web/src/app/
  layout.tsx              <-- minimal: html/body only, NO lang attr yet
  [locale]/               <-- NEW dynamic segment
    layout.tsx            <-- sets lang={locale}, wraps NextIntlClientProvider
    (storefront)/
      layout.tsx          <-- existing storefront layout (moved here)
      page.tsx
      products/
      cart/
      checkout/
      contact/            <-- renamed from lien-he (pathnames handle mapping)
      order-tracking/     <-- renamed from theo-doi-don-hang
      ...
  admin/                  <-- stays at root level, untouched
```

**Key changes:**
1. Move the entire `(storefront)` folder into a new `[locale]` folder
2. The root `layout.tsx` becomes a shell (html/body, fonts, globals.css) without `lang` attr
3. `[locale]/layout.tsx` receives `params.locale`, sets `<html lang={locale}>`, wraps children in `NextIntlClientProvider`
4. Rename `lien-he/` to `contact/` and `theo-doi-don-hang/` to `order-tracking/`
5. Admin stays at `app/admin/` -- completely outside the `[locale]` segment

**Handling Vietnamese-slug routes (lien-he, theo-doi-don-hang):**

Option A (recommended, simpler): Use English slugs for both locales (`/vi/contact`, `/en/contact`). Vietnamese users wont notice or care about URL slugs.

Option B (complex): Use next-intl's `pathnames` config to map `/vi/lien-he` -> `/en/contact`. This requires the `createLocalizedPathnamesNavigation` setup with a pathnames map. More complex but preserves existing Vietnamese URLs.

**Recommendation**: Go with Option A. Rename the folders to English. Add redirects from old Vietnamese URLs (`/lien-he` -> `/vi/contact`) in middleware or `next.config.js` to preserve any existing backlinks.

---

### Phase 3: Translation File Structure

**Directory:**
```
apps/web/src/messages/
  vi.json
  en.json
```

Each JSON file uses flat namespaces. Namespaces map to feature areas:

```
{
  "common": { ... },
  "navigation": { ... },
  "home": { ... },
  "products": { ... },
  "product": { ... },
  "cart": { ... },
  "checkout": { ... },
  "auth": { ... },
  "account": { ... },
  "contact": { ... },
  "orderTracking": { ... },
  "blog": { ... },
  "search": { ... },
  "footer": { ... },
  "newsletter": { ... },
  "errors": { ... },
  "seo": { ... }
}
```

**3.3.1 Namespace: `common`**
Shared across multiple pages/components.
```json
{
  "common": {
    "enzara": "Enzara",
    "currency": "d",
    "loading": "Dang tai...",
    "error": "Co loi xay ra. Vui long thu lai.",
    "continueShopping": "Tiep tuc mua sam",
    "viewAll": "Xem tat ca",
    "home": "Trang chu",
    "close": "Dong",
    "cancel": "Huy",
    "save": "Luu",
    "delete": "Xoa",
    "apply": "Ap dung",
    "submit": "Gui",
    "back": "Quay lai",
    "backToHome": "Ve trang chu",
    "searchProducts": "Tim kiem san pham",
    "noResults": "Khong co ket qua",
    "poweredBy": "Powered by Enzara",
    "allRightsReserved": "Tat ca quyen duoc bao luu"
  }
}
```

**3.3.2 Namespace: `navigation`**
Header, utility bar, mobile menu links.
```json
{
  "navigation": {
    "trackOrder": "Theo doi don hang",
    "blog": "Blog",
    "search": "Tim kiem",
    "account": "Tai khoan",
    "cart": "Gio hang",
    "menu": "Menu"
  }
}
```

**3.3.3 Namespace: `home`**
Homepage section headings and content.
```json
{
  "home": {
    "categories": "Danh muc san pham",
    "categoriesSubtitle": "Kham pha cac dong san pham thien nhien, an toan cho gia dinh ban",
    "featured": "San pham noi bat",
    "featuredSubtitle": "Duoc yeu thich va tin dung boi hang ngan khach hang",
    "newProducts": "San pham moi",
    "newProductsSubtitle": "Cap nhat nhung san pham moi nhat tu thien nhien",
    "bestSellers": "Ban chay nhat",
    "bestSellersSubtitle": "San pham duoc lua chon nhieu nhat"
  }
}
```

**3.3.4 Namespace: `products`**
Product listing and product detail page.
```json
{
  "products": {
    "title": "San pham",
    "filters": "Bo loc",
    "sort": "Sap xep",
    "sortNewest": "Moi nhat",
    "sortPriceAsc": "Gia tang dan",
    "sortPriceDesc": "Gia giam dan",
    "sortBestseller": "Ban chay",
    "addToCart": "Them vao gio hang",
    "buyNow": "Mua ngay",
    "outOfStock": "Het hang",
    "inStock": "Con hang",
    "quantity": "So luong",
    "description": "Mo ta",
    "reviews": "Danh gia",
    "relatedProducts": "San pham lien quan",
    "sku": "Ma SP"
  }
}
```

**3.3.5 Namespace: `cart`**
```json
{
  "cart": {
    "title": "Gio hang",
    "empty": "Gio hang cua ban dang trong",
    "emptyDescription": "Hay them san pham vao gio hang de bat dau mua sam cac san pham lam sach sinh hoc than thien voi moi truong.",
    "product": "San pham",
    "unitPrice": "Don gia",
    "quantity": "So luong",
    "subtotal": "Thanh tien",
    "shippingNote": "Phi van chuyen se duoc tinh khi ban chon dia chi giao hang o buoc thanh toan.",
    "voucherCode": "Ma giam gia",
    "voucherPlaceholder": "Nhap ma giam gia",
    "removeVoucher": "Xoa ma giam gia",
    "proceedToCheckout": "Tien hanh thanh toan",
    "itemCount": "{count} san pham",
    "decreaseQuantity": "Giam so luong",
    "increaseQuantity": "Tang so luong",
    "removeItem": "Xoa san pham"
  }
}
```

**3.3.6 Namespace: `checkout`**
```json
{
  "checkout": {
    "title": "Thanh toan",
    "shippingInfo": "Thong tin giao hang",
    "fullName": "Ho ten",
    "phone": "So dien thoai",
    "email": "Email",
    "province": "Tinh/Thanh",
    "district": "Quan/Huyen",
    "ward": "Phuong/Xa",
    "address": "Dia chi chi tiet",
    "note": "Ghi chu",
    "paymentMethod": "Phuong thuc thanh toan",
    "cod": "Thanh toan khi nhan hang (COD)",
    "qrPayment": "Chuyen khoan QR",
    "placeOrder": "Dat hang",
    "processing": "Dang xu ly...",
    "selectAddress": "Vui long chon dia chi giao hang",
    "orderTotal": "Dat hang ({total})",
    "breadcrumbCart": "Gio hang",
    "breadcrumbCheckout": "Thanh toan",
    "validation": {
      "nameRequired": "Vui long nhap ho ten",
      "phoneInvalid": "So dien thoai khong hop le",
      "emailInvalid": "Email khong hop le",
      "provinceRequired": "Vui long chon tinh/thanh",
      "districtRequired": "Vui long chon quan/huyen",
      "wardRequired": "Vui long chon phuong/xa",
      "addressRequired": "Vui long nhap dia chi chi tiet"
    }
  }
}
```

**3.3.7 Namespace: `auth`**
```json
{
  "auth": {
    "login": "Dang nhap",
    "register": "Dang ky",
    "forgotPassword": "Quen mat khau",
    "resetPassword": "Dat lai mat khau",
    "email": "Email",
    "password": "Mat khau",
    "confirmPassword": "Xac nhan mat khau",
    "loginButton": "Dang nhap",
    "registerButton": "Tao tai khoan",
    "noAccount": "Chua co tai khoan?",
    "hasAccount": "Da co tai khoan?",
    "validation": {
      "emailRequired": "Vui long nhap email",
      "emailInvalid": "Email khong hop le",
      "passwordMin": "Mat khau toi thieu 6 ky tu"
    }
  }
}
```

**3.3.8 Namespace: `footer`**
```json
{
  "footer": {
    "quickLinks": "Lien ket nhanh",
    "aboutUs": "Ve chung toi",
    "products": "San pham",
    "contact": "Lien he",
    "trackOrder": "Theo doi don hang",
    "policies": "Chinh sach",
    "privacy": "Chinh sach bao mat",
    "terms": "Dieu khoan su dung",
    "shipping": "Chinh sach van chuyen",
    "returns": "Chinh sach doi tra",
    "contactInfo": "Lien he",
    "copyright": "© {year} Enzara. {rights}",
    "defaultDescription": "Cua hang tinh dau va san pham thien nhien chat luong cao..."
  }
}
```

**3.3.9 Additional namespaces**: `newsletter`, `search`, `contact`, `orderTracking`, `account`, `blog`, `errors`, `seo` -- follow same pattern.

**English file (`en.json`)**: Mirror the exact same keys with English values.

**Estimated total translation keys**: ~250-300.

---

### Phase 4: Layout and Provider Changes

**4.1 Root layout (`apps/web/src/app/layout.tsx`)**

Strip `lang="vi"` from `<html>`. Keep fonts, globals.css, ServiceWorkerRegistration. The locale-aware layout below will handle `lang`.

```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={`${heading.variable} ${body.variable}`}>
      <body>
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
```

Note: Metadata in root layout should remain generic/brand-only. Locale-specific metadata moves to `[locale]/layout.tsx`.

**4.2 New locale layout (`apps/web/src/app/[locale]/layout.tsx`)**

```tsx
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales } from "@/i18n/config";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!locales.includes(locale as any)) notFound();
  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
```

The root `<html lang>` attribute must be set dynamically. Since the root layout renders `<html>`, but the locale is only known in `[locale]/layout.tsx`, there are two approaches:

- **Approach A (simpler)**: Move `<html>` and `<body>` into `[locale]/layout.tsx`. Root layout becomes just `{children}`. But admin pages would lose the html/body wrapper. Fix: admin gets its own `layout.tsx` with `<html lang="vi">`.
- **Approach B**: Keep root layout with `<html>`, set `lang` via a suppressHydrationWarning script. Hacky.

**Recommendation**: Approach A. Move `<html>` + `<body>` into both `[locale]/layout.tsx` and `admin/layout.tsx`. Root layout becomes a pass-through.

**4.3 Move storefront layout**

The existing `apps/web/src/app/(storefront)/layout.tsx` moves to `apps/web/src/app/[locale]/(storefront)/layout.tsx` with no content changes initially. Text within it (like AnnouncementBar text) comes from server settings, not hardcoded.

---

### Phase 5: Component Translation

**5.1 Server Components** -- use `getTranslations` from `next-intl/server`

Affected files (partial list):
- `[locale]/(storefront)/page.tsx` -- section headings passed to OrganicSectionHeading
- `[locale]/(storefront)/products/page.tsx` -- metadata, breadcrumbs
- `[locale]/(storefront)/products/[slug]/page.tsx` -- metadata, breadcrumbs, labels
- `[locale]/(storefront)/blog/page.tsx`
- `[locale]/(storefront)/contact/page.tsx` (renamed from lien-he)
- `[locale]/(storefront)/order-tracking/page.tsx` (renamed from theo-doi-don-hang)
- All `account/*` pages
- All `auth/*` pages

Pattern for server components:
```tsx
import { getTranslations } from "next-intl/server";

export default async function HomePage() {
  const t = await getTranslations("home");
  // use t("categories"), t("featured"), etc.
}
```

**5.2 Client Components** -- use `useTranslations` hook

Affected files (partial list):
- `Header.tsx` -- aria-labels, utility bar text
- `Footer.tsx` -- section headings, link labels, copyright
- `MobileMenu.tsx`
- `SearchModal.tsx`
- `Breadcrumbs.tsx` -- "Trang chu"
- `Newsletter.tsx` -- all text
- `CartSummary.tsx`
- `FilterSidebar.tsx`, `SortBar.tsx`
- `AddToCartSection.tsx`
- `ShippingForm.tsx`, `PaymentMethodSelector.tsx`
- `ContactForm.tsx`, `TrackingForm.tsx`
- Cart page (`cart/page.tsx` -- uses "use client")
- Checkout page (`checkout/page.tsx` -- uses "use client")

Pattern for client components:
```tsx
"use client";
import { useTranslations } from "next-intl";

export function Header() {
  const t = useTranslations("navigation");
  // use t("trackOrder"), t("blog"), etc.
}
```

**5.3 Zod validation messages**

Validation messages in `checkoutSchema`, `loginSchema`, etc. are hardcoded in the schema definition. Two approaches:

- **Approach A**: Move schema creation into a function that accepts `t` and returns the schema with translated messages. Call this inside the component.
- **Approach B**: Use generic error codes in schemas, map to translations in the UI error display.

**Recommendation**: Approach A is simpler. Create schema factories:
```tsx
function createCheckoutSchema(t: (key: string) => string) {
  return z.object({
    shippingName: z.string().min(2, t("validation.nameRequired")),
    // ...
  });
}
```

**5.4 formatPrice locale-awareness**

The `formatPrice` function in `cart/page.tsx` hardcodes `"vi-VN"`. Update to use the current locale:
- Vietnamese: `new Intl.NumberFormat("vi-VN").format(price) + "d"`
- English: `new Intl.NumberFormat("en-US").format(price) + " VND"` (keep VND since prices are in VND)

Create a shared utility: `lib/format.ts` with `formatPrice(price: number, locale: string)`.

**5.5 Metadata translation**

For `generateMetadata` in pages, use `getTranslations` from `next-intl/server`:
```tsx
export async function generateMetadata({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: "seo" });
  return {
    title: t("homeTitle"),
    description: t("homeDescription"),
    openGraph: { locale: params.locale === "vi" ? "vi_VN" : "en_US" },
  };
}
```

The existing `generatePageMetadata` helper in `lib/seo.ts` needs a `locale` parameter.

---

### Phase 6: Language Switcher Component

**File**: `apps/web/src/components/storefront/header/LanguageSwitcher.tsx`

A simple dropdown or toggle button in the header. Implementation:

```tsx
"use client";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next-intl/navigation";
import { locales } from "@/i18n/config";

const localeLabels: Record<string, string> = {
  vi: "VI",
  en: "EN",
};
```

Behavior:
- Shows current locale flag/code
- On click/select, navigates to the same page in the other locale
- Uses `useRouter` and `usePathname` from `next-intl/navigation` (not `next/navigation`) to handle locale-aware routing

Placement: in `Header.tsx` between the search button and account button (desktop), and at the bottom of `MobileMenu.tsx`.

---

### Phase 7: Navigation Link Updates

**7.1 Use next-intl's Link and navigation**

Create a navigation configuration file:

File: `apps/web/src/i18n/navigation.ts`
```ts
import { createNavigation } from "next-intl/navigation";
import { locales, defaultLocale } from "./config";

export const { Link, redirect, usePathname, useRouter } =
  createNavigation({ locales, defaultLocale, localePrefix: "always" });
```

**7.2 Replace all `next/link` imports in storefront components**

Every `import Link from "next/link"` in storefront components must change to `import { Link } from "@/i18n/navigation"`. This ensures links automatically include the locale prefix.

Similarly, replace `useRouter` from `next/navigation` with the one from `@/i18n/navigation` in client components, and `redirect` from `next/navigation` with the one from `@/i18n/navigation` in server components.

**Affected files** (non-exhaustive): Header.tsx, Footer.tsx, MobileMenu.tsx, Breadcrumbs.tsx, CartIconWithBadge.tsx, ProductCard.tsx, all page.tsx files with `<Link>` tags.

**7.3 Internal hrefs**

Current hrefs like `/products`, `/cart`, `/checkout` remain the same -- `next-intl`'s `Link` will automatically prepend the locale. No href changes needed.

For Vietnamese-slug routes that are renamed:
- Update all `href="/lien-he"` to `href="/contact"`
- Update all `href="/theo-doi-don-hang"` to `href="/order-tracking"`

---

### Phase 8: SEO and Sitemap

**8.1 Update `lib/seo.ts`**

- Add `locale` parameter to `generatePageMetadata`
- Set `openGraph.locale` based on locale
- Add `alternates.languages` for hreflang tags:
  ```ts
  alternates: {
    canonical: `${SITE_URL}/${locale}${path}`,
    languages: {
      vi: `${SITE_URL}/vi${path}`,
      en: `${SITE_URL}/en${path}`,
    }
  }
  ```

**8.2 Update `sitemap.ts`**

Generate entries for both locales. Each URL gets both `/vi/...` and `/en/...` variants with proper `alternates` hreflang annotations.

**8.3 Add redirects for old URLs**

In `next.config.js`, add redirects:
```js
async redirects() {
  return [
    { source: "/lien-he", destination: "/vi/contact", permanent: true },
    { source: "/theo-doi-don-hang", destination: "/vi/order-tracking", permanent: true },
    { source: "/products", destination: "/vi/products", permanent: false },
    { source: "/cart", destination: "/vi/cart", permanent: false },
    // ... etc for all old un-prefixed routes
  ];
}
```

The middleware will handle most of these by redirecting unprefixed routes to the default locale, but explicit redirects for renamed routes are still needed.

---

## 4. File Change Summary

### New files to create
| File | Purpose |
|------|---------|
| `apps/web/src/i18n/config.ts` | Locale list and default locale |
| `apps/web/src/i18n/request.ts` | next-intl request config (message loading) |
| `apps/web/src/i18n/navigation.ts` | Locale-aware Link, useRouter, usePathname, redirect |
| `apps/web/src/messages/vi.json` | Vietnamese translations (~250-300 keys) |
| `apps/web/src/messages/en.json` | English translations (~250-300 keys) |
| `apps/web/src/app/[locale]/layout.tsx` | Locale-specific layout with NextIntlClientProvider |
| `apps/web/src/components/storefront/header/LanguageSwitcher.tsx` | Language toggle component |
| `apps/web/src/lib/format.ts` | Locale-aware formatPrice utility |

### Files to modify
| File | Change |
|------|--------|
| `apps/web/next.config.js` | Wrap with `createNextIntlPlugin`, add redirects |
| `apps/web/src/middleware.ts` | Merge admin auth + next-intl locale routing |
| `apps/web/src/app/layout.tsx` | Remove `lang="vi"`, remove locale-specific metadata, possibly restructure html/body |
| `apps/web/src/app/not-found.tsx` | Translate hardcoded text |
| `apps/web/src/app/sitemap.ts` | Generate multi-locale entries with hreflang |
| `apps/web/src/lib/seo.ts` | Add locale param, hreflang alternates |
| `apps/web/package.json` | Add `next-intl` dependency |

### Files to move (into `[locale]/` segment)
All contents of `apps/web/src/app/(storefront)/` move to `apps/web/src/app/[locale]/(storefront)/`:
- `layout.tsx`, `page.tsx`, `error.tsx`, `loading.tsx`, `not-found.tsx`
- `products/`, `cart/`, `checkout/`, `blog/`, `search/`, `categories/`, `pages/`, `auth/`, `account/`
- `lien-he/` -> renamed to `contact/`
- `theo-doi-don-hang/` -> renamed to `order-tracking/`

### Components to update (replace hardcoded text with `t()` calls)
All files in `apps/web/src/components/storefront/`:
- `header/Header.tsx`, `header/MobileMenu.tsx`, `header/SearchModal.tsx`
- `footer/Footer.tsx`
- `shared/Breadcrumbs.tsx`
- `home/Newsletter.tsx`, `home/FlashSaleWidget.tsx`, `home/Testimonials.tsx`
- `product/ProductCard.tsx`
- `cart/CartSummary.tsx`, `cart/CartSuggestions.tsx`
- `checkout/ShippingForm.tsx`, `checkout/PaymentMethodSelector.tsx`, `checkout/VoucherInput.tsx`, `checkout/OrderSummary.tsx`, `checkout/LoyaltyRedemption.tsx`
- `storefront/effects/OrganicBadge.tsx` (if it has hardcoded text)

### Pages to update (replace hardcoded text, update metadata)
- All `page.tsx` files under `[locale]/(storefront)/`
- `lien-he/ContactForm.tsx` -> `contact/ContactForm.tsx`
- `theo-doi-don-hang/TrackingForm.tsx` -> `order-tracking/TrackingForm.tsx`
- `products/FilterSidebar.tsx`, `products/SortBar.tsx`
- `products/[slug]/AddToCartSection.tsx`
- All `auth/*/page.tsx`
- All `account/*/page.tsx`

---

## 5. Implementation Order (Recommended)

Implement in this order to minimize breakage and allow incremental testing:

1. **Install next-intl, create config files** (Phase 1: 3.1-3.2)
2. **Create translation JSON files** with vi.json first (extract existing text), then en.json (Phase 3)
3. **Create i18n/request.ts and i18n/navigation.ts** (Phase 1: 3.3, Phase 7.1)
4. **Update next.config.js** with next-intl plugin (Phase 1: 3.4)
5. **Restructure routes**: move `(storefront)/` into `[locale]/`, rename slug routes (Phase 2)
6. **Create `[locale]/layout.tsx`**, update root layout (Phase 4)
7. **Update middleware** (Phase 1: 3.5)
8. **Replace Link imports** in all storefront components (Phase 7.2)
9. **Translate components** one by one, starting with layout components (Header, Footer), then pages (Phase 5)
10. **Add LanguageSwitcher** to Header (Phase 6)
11. **Update SEO and sitemap** (Phase 8)
12. **Add redirects** for old URLs (Phase 8.3)
13. **Test**: verify both locales, check all pages, test language switching, verify admin still works

---

## 6. Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking admin routes during middleware change | Admin inaccessible | Test admin auth immediately after middleware update. Admin is excluded from locale matcher. |
| Missing translation keys cause runtime errors | Blank text on pages | next-intl shows key name as fallback by default. Run a script to validate both JSON files have identical key structures. |
| Old bookmarked/indexed URLs return 404 | SEO damage, user friction | Add permanent redirects for all old URLs in next.config.js and middleware. |
| Client-side navigation breaks with new Link | Navigation failures | Use search-and-replace carefully. Test all navigation paths. |
| `formatPrice` locale mismatch | Wrong currency format | Centralize into single utility, pass locale from context. |
| Large translation files slow page load | Performance | next-intl only sends active-locale messages to client. Namespace splitting possible later if needed. |

---

## 7. Testing Checklist

- [ ] `pnpm build` succeeds with no errors
- [ ] `/vi` shows Vietnamese homepage
- [ ] `/en` shows English homepage
- [ ] `/` redirects to `/vi`
- [ ] Language switcher toggles between locales and preserves current page
- [ ] `/admin/*` routes work unchanged (no locale prefix, auth still works)
- [ ] `/api/*` routes work unchanged
- [ ] All storefront pages render in both locales without missing keys
- [ ] Cart and checkout flows work in both locales
- [ ] Auth flows (login, register, forgot password) work in both locales
- [ ] Metadata (title, description, OG tags) are locale-appropriate
- [ ] Sitemap includes both locale variants with hreflang
- [ ] Old URLs (`/products`, `/lien-he`, `/theo-doi-don-hang`) redirect correctly
- [ ] Mobile menu and search work in both locales
- [ ] `formatPrice` shows correct format per locale
- [ ] Zod validation messages appear in current locale

---

## 8. Unresolved Questions

1. **Should `/vi` prefix be hidden for the default locale?** Current plan shows it explicitly for SEO consistency. Hiding it is possible but adds complexity with Vietnamese-slug route handling. Decide before implementation.

2. **Product names/descriptions from the API -- are they already multilingual?** If the backend only stores Vietnamese product data, the product detail pages will show Vietnamese content regardless of locale. Backend i18n for dynamic content is a separate effort not covered here.

3. **Should blog post content be translated?** Blog content comes from the API/CMS. If not multilingual on the backend, blog pages in `/en` would show Vietnamese content. Consider hiding blog from English navigation or marking it as Vietnamese-only.

4. **Vietnamese-slug routes: rename or use pathnames mapping?** Plan recommends renaming to English slugs. If preserving `/vi/lien-he` is critical for existing traffic, use next-intl's pathnames config instead.

5. **Should category and page slugs from the API be locale-aware?** Currently slugs like `/categories/[slug]` and `/pages/[slug]` use API-provided slugs which are Vietnamese. These would appear as-is in both `/vi` and `/en` URL paths unless the backend provides locale-specific slugs.
