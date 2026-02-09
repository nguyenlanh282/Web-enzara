# Enzara Design Guidelines

**Version:** 1.0 | **Updated:** 2026-02-08
**Stack:** Next.js 15, Tailwind CSS, shadcn/ui (Radix), Framer Motion

---

## 1. Color System

### Brand Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `primary-700` | `#626c13` | Headings, primary buttons, active states |
| `primary-600` | `#738136` | Hover states, secondary elements |
| `primary-500` | `#8a9a4a` | Icons, borders |
| `primary-100` | `#f0f3e4` | Light backgrounds, highlights |
| `primary-50` | `#f7f9f0` | Page backgrounds |
| `secondary-600` | `#de8d1e` | CTAs, sale badges, links |
| `secondary-500` | `#e67e22` | Hover on secondary buttons |
| `accent` | `#ffcc48` | Star ratings, promo banners, highlights |
| `neutral-900` | `#1a1a1a` | Body text |
| `neutral-600` | `#6b7280` | Captions, placeholders |
| `neutral-200` | `#e5e7eb` | Borders, dividers |
| `neutral-100` | `#F5F5F0` | Surface backgrounds |
| `white` | `#FFFFFF` | Cards, modals |
| `success` | `#16a34a` | In-stock, confirmations |
| `error` | `#dc2626` | Errors, out-of-stock |
| `warning` | `#f59e0b` | Low stock, alerts |

### Tailwind Config

```js
// tailwind.config.ts
colors: {
  primary: {
    50:  '#f7f9f0',
    100: '#f0f3e4',
    200: '#dce3c0',
    300: '#c0cf8e',
    400: '#a4b760',
    500: '#8a9a4a',
    600: '#738136',
    700: '#626c13',
    800: '#4a5210',
    900: '#33390b',
  },
  secondary: {
    50:  '#fef7ec',
    100: '#fdecd3',
    200: '#fbd5a0',
    300: '#f5b560',
    400: '#e67e22',
    500: '#de8d1e',
    600: '#c47a15',
    700: '#9c5e10',
    800: '#7a4a0d',
    900: '#5c370a',
  },
  accent: {
    DEFAULT: '#ffcc48',
    light:   '#ffe08a',
    dark:    '#e6b030',
  },
  surface: '#F5F5F0',
}
```

---

## 2. Typography

### Font Stack

```css
/* Google Fonts import */
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Be+Vietnam+Pro:wght@400;500;600&display=swap');
```

| Role | Font | Weight | Fallback |
|------|------|--------|----------|
| Headings | Plus Jakarta Sans | 700, 800 | system-ui, sans-serif |
| Body | Be Vietnam Pro | 400, 500 | system-ui, sans-serif |
| UI Labels | Be Vietnam Pro | 500, 600 | system-ui, sans-serif |

Both fonts fully support Vietnamese diacritics (a, a, d, e, o, o, u).

### Type Scale

| Token | Size (mobile / desktop) | Line Height | Weight | Usage |
|-------|------------------------|-------------|--------|-------|
| `h1` | 28px / 40px | 1.2 | 800 | Hero headings |
| `h2` | 24px / 32px | 1.25 | 700 | Section titles |
| `h3` | 20px / 24px | 1.3 | 700 | Card titles |
| `h4` | 18px / 20px | 1.35 | 600 | Subsections |
| `body` | 15px / 16px | 1.6 | 400 | Paragraphs |
| `body-sm` | 13px / 14px | 1.5 | 400 | Descriptions |
| `caption` | 12px / 12px | 1.4 | 500 | Labels, metadata |
| `price` | 20px / 24px | 1.2 | 700 | Product pricing |
| `price-old` | 14px / 16px | 1.2 | 400 | Strikethrough prices |

### Tailwind Config

```js
fontFamily: {
  heading: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
  body:    ['Be Vietnam Pro', 'system-ui', 'sans-serif'],
},
```

---

## 3. Spacing & Layout

### 8px Grid

All spacing uses multiples of 8px: `8, 16, 24, 32, 40, 48, 64, 80, 96, 128`.
Exception: 4px for tight internal padding (badges, tags).

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Badge padding, tight gaps |
| `space-2` | 8px | Icon-to-text gap, inline spacing |
| `space-3` | 12px | Input padding, small gaps |
| `space-4` | 16px | Card padding, list gaps |
| `space-6` | 24px | Section inner padding |
| `space-8` | 32px | Section gaps |
| `space-12` | 48px | Section vertical padding (mobile) |
| `space-16` | 64px | Section vertical padding (desktop) |
| `space-20` | 80px | Hero padding |

### Container

```css
max-width: 1280px;
padding-inline: 16px;     /* mobile */
padding-inline: 24px;     /* sm+ */
padding-inline: 32px;     /* lg+ */
margin-inline: auto;
```

### Grid System

- Product grid: 2 cols (mobile) / 3 cols (md) / 4 cols (lg)
- Content grid: 1 col (mobile) / 2 cols (lg)
- Gap: 16px (mobile) / 24px (desktop)

---

## 4. Component Guidelines

### Border Radius

| Element | Radius |
|---------|--------|
| Buttons | `8px` (`rounded-lg`) |
| Cards | `12px` (`rounded-xl`) |
| Modals | `16px` (`rounded-2xl`) |
| Inputs | `8px` (`rounded-lg`) |
| Images | `8px` or `12px` |
| Badges/Tags | `9999px` (`rounded-full`) |
| Avatars | `9999px` (`rounded-full`) |

### Shadows

```css
--shadow-sm:  0 1px 2px rgba(0,0,0,0.05);
--shadow-md:  0 4px 12px rgba(0,0,0,0.08);
--shadow-lg:  0 8px 24px rgba(0,0,0,0.10);
--shadow-card: 0 2px 8px rgba(0,0,0,0.06);
```

### Buttons

| Variant | Background | Text | Border |
|---------|-----------|------|--------|
| Primary | `primary-700` | `white` | none |
| Primary hover | `primary-600` | `white` | none |
| Secondary | `secondary-500` | `white` | none |
| Outline | `transparent` | `primary-700` | 1px `primary-500` |
| Ghost | `transparent` | `primary-700` | none |

Sizes: `sm` (h-8, text-13px), `md` (h-10, text-14px), `lg` (h-12, text-16px).
Min touch target: 44x44px on mobile. Add padding if button is smaller.

### Cards (Product)

```
- Background: white
- Radius: 12px
- Shadow: shadow-card, elevate to shadow-md on hover
- Padding: 0 (image flush top) + 16px (content area)
- Image aspect: 1:1
- Badge: absolute top-left (discount) or top-right (new)
- Price: primary-700, old price in neutral-600 line-through
- CTA: full-width secondary button at bottom
```

### Inputs

```
- Height: 44px (mobile-friendly touch target)
- Border: 1px neutral-200
- Focus: 2px ring primary-500, border primary-500
- Radius: 8px
- Padding: 12px horizontal
- Error: border error, helper text in error color below
- Label: caption size, neutral-600, 4px margin-bottom
```

### Badges

```
- Discount: bg secondary-500, text white, rounded-full, text-12px bold
- New: bg accent, text neutral-900, rounded-full
- In-stock: bg success/10, text success, rounded-full
- Out-of-stock: bg error/10, text error, rounded-full
```

---

## 5. Icons

**Library:** [Lucide React](https://lucide.dev) (already included with shadcn/ui).

| Attribute | Value |
|-----------|-------|
| Default size | 20px (body context), 24px (nav/header) |
| Stroke width | 1.75 (default) to 2 (emphasis) |
| Color | Inherits text color via `currentColor` |
| Touch target | Wrap in 44x44px button when interactive |

Common icons: `ShoppingCart`, `Search`, `Menu`, `X`, `ChevronRight`, `Star`, `Truck`, `Shield`, `Leaf`, `Phone`, `MapPin`, `Heart`, `Minus`, `Plus`, `Trash2`.

---

## 6. Motion Guidelines

**Library:** Framer Motion. All animations subtle and purposeful.

### Defaults

```tsx
const spring = { type: 'spring', stiffness: 300, damping: 30 };
const ease   = { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] };
```

### Patterns

| Element | Animation | Duration |
|---------|-----------|----------|
| Page transitions | Fade + slide up 8px | 200ms |
| Card hover | Scale 1.02 + shadow elevation | 200ms |
| Button press | Scale 0.97 | 100ms |
| Modal open | Fade in + scale from 0.95 | 250ms |
| Toast enter | Slide in from right | 300ms |
| Skeleton loader | Pulse shimmer | 1.5s loop |
| Add to cart | Icon bounce + badge count pop | 400ms |
| Accordion | Height auto-animate | 200ms |

### Rules

1. Never exceed 400ms for UI transitions (feels sluggish).
2. Respect `prefers-reduced-motion`: disable transforms, keep opacity fades only.
3. No animation on first paint (avoid layout shift, improve LCP).
4. Product images: no entry animation; use hover zoom only.
5. Stagger lists by 50ms per item, max 5 items staggered.

```tsx
// Reduced motion helper
const prefersReduced = typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
```

---

## 7. Responsive Breakpoints

Mobile-first. Design for 375px, scale up.

| Token | Min-width | Target |
|-------|-----------|--------|
| `xs` | 0 | Small phones (320-374px) |
| `sm` | 640px | Large phones landscape |
| `md` | 768px | Tablets |
| `lg` | 1024px | Small desktops |
| `xl` | 1280px | Desktops (container max) |

### Key Responsive Behaviors

| Component | Mobile | Tablet+ | Desktop+ |
|-----------|--------|---------|----------|
| Nav | Bottom tab bar (5 items) | Top header + search | Full header + mega menu |
| Product grid | 2 columns | 3 columns | 4 columns |
| Hero | Stacked, full-bleed image | Side-by-side | Side-by-side, max-h-[600px] |
| Cart | Full-screen drawer | Side drawer 400px | Side drawer 420px |
| Footer | Accordion sections | 2-col grid | 4-col grid |
| Search | Full-screen overlay | Expandable in header | Inline in header |

### Mobile-First Priorities

1. Bottom navigation bar with: Home, Categories, Cart (with badge), Account, Search.
2. Sticky add-to-cart bar on product pages.
3. Swipeable product image gallery.
4. Tap-friendly filters (bottom sheet, not sidebar).
5. One-thumb reachability for primary CTAs.

---

## 8. Vietnamese-Specific Notes

### Diacritics

Always verify text renders correctly: a, a, d, e, o, o, u and all tone marks.
Never use images for Vietnamese text -- always real text for SEO and accessibility.
Test with long words: "PHUONG PHAP CHUYEN HOA" should not clip or overflow.

### Currency Formatting

```ts
function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}
// Output: "85.000 d" (with dong symbol)

// Alternative display: "85.000d" or "85,000 VND"
```

Rules:
- Thousands separator: dot (`.`) not comma. Example: `85.000d`.
- No decimal places (VND has no subunit in practice).
- Show original price with strikethrough when discounted.
- Discount badge: `-24%` format, secondary-500 background.

### Phone Number Format

Display: `0945.139.990` or `0945 139 990` (groups of 3-3-4 after leading 0).
Href: `tel:+84945139990` (international format, drop leading 0, add +84).

### Address Format

```
[Street number] [Street name], [Ward/Phuong],
[District/Quan], [City/Province]
```

### Content Tone

- Educational, trustworthy, community-focused.
- Use formal-but-friendly Vietnamese (not overly casual).
- Emphasize "huu co" (organic), "tu nhien" (natural), "an toan" (safe).
- Trust signals: certification badges, lab test references, customer reviews.

---

## Appendix: Quick Reference

### Tailwind Shortcuts

```
/* Common card */        rounded-xl shadow-sm hover:shadow-md bg-white p-4
/* Primary button */     bg-primary-700 hover:bg-primary-600 text-white rounded-lg h-10 px-6 font-semibold
/* Secondary button */   bg-secondary-500 hover:bg-secondary-600 text-white rounded-lg h-10 px-6
/* Outline button */     border border-primary-500 text-primary-700 hover:bg-primary-50 rounded-lg h-10 px-6
/* Price display */      font-heading text-xl font-bold text-primary-700
/* Old price */          text-sm text-neutral-600 line-through
/* Discount badge */     bg-secondary-500 text-white text-xs font-bold rounded-full px-2 py-0.5
/* Section padding */    py-12 md:py-16 lg:py-20
/* Container */          max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8
```

### File Organization (shadcn/ui)

```
packages/ui/
  components/
    ui/           # shadcn primitives (button, input, dialog, etc.)
    product/      # ProductCard, ProductGrid, ProductBadge
    layout/       # Header, Footer, BottomNav, Container
    cart/          # CartDrawer, CartItem, CartSummary
    shared/       # PriceDisplay, Rating, TrustBadge
  lib/
    utils.ts      # cn() helper, formatVND, formatPhone
```
