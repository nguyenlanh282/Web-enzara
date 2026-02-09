# 📋 PRODUCT REQUIREMENTS DOCUMENT (PRD)
# PosCake E-Commerce Platform - Tổng Thể

**Version:** 1.0  
**Ngày tạo:** 08/02/2026  
**Tác giả:** Lành Guru  
**Repository:** https://github.com/nguyenlanh282/poscake-skill  
**Trạng thái:** Draft  

---

## 📑 MỤC LỤC

1. [Tổng quan dự án](#1-tổng-quan-dự-án)
2. [Kiến trúc hệ thống](#2-kiến-trúc-hệ-thống)
3. [Tech Stack](#3-tech-stack)
4. [Database Schema](#4-database-schema)
5. [Phase 1 - MVP Core](#5-phase-1---mvp-core)
6. [Phase 2 - Engagement & Marketing](#6-phase-2---engagement--marketing)
7. [Phase 3 - Advanced & Optimization](#7-phase-3---advanced--optimization)
8. [API Endpoints](#8-api-endpoints)
9. [Tích hợp bên thứ 3](#9-tích-hợp-bên-thứ-3)
10. [UI/UX Wireframes & User Flows](#10-uiux-wireframes--user-flows)
11. [Bảo mật & Performance](#11-bảo-mật--performance)
12. [Deployment & DevOps](#12-deployment--devops)
13. [Timeline & Milestones](#13-timeline--milestones)

---

## 1. TỔNG QUAN DỰ ÁN

### 1.1 Mô tả
PosCake là nền tảng E-Commerce toàn diện được xây dựng cho thị trường Việt Nam, tích hợp sâu với hệ sinh thái Pancake POS để đồng bộ đơn hàng, kho hàng. Hỗ trợ thanh toán qua SePay (QR Banking), hệ thống CMS linh hoạt để quản lý nội dung, blog chia sẻ, và đầy đủ công cụ marketing/tracking.

### 1.2 Đối tượng người dùng

| Vai trò | Mô tả |
|---------|--------|
| **Admin** | Chủ shop, quản lý toàn bộ hệ thống |
| **Staff** | Nhân viên xử lý đơn hàng, content |
| **Customer** | Khách hàng mua sắm, đọc blog |
| **Guest** | Khách chưa đăng ký, duyệt sản phẩm |

### 1.3 Mục tiêu kinh doanh
- Xây dựng kênh bán hàng online độc lập (không phụ thuộc Shopee, Lazada)
- Đồng bộ 2 chiều với Pancake POS (đơn hàng, tồn kho)
- Thu thập data khách hàng, remarketing qua Pixel/GA4
- Tối ưu SEO để tăng organic traffic
- Xây dựng cộng đồng qua blog chia sẻ
- Tăng tỷ lệ chuyển đổi với UX tối ưu và marketing automation

### 1.4 Phân chia Phase

| Phase | Thời gian | Nội dung |
|-------|-----------|----------|
| **Phase 1 - MVP** | 8-10 tuần | CMS, Products, Storefront, Cart, Checkout + SePay, Orders + Pancake POS, Blog, Auth, SEO cơ bản |
| **Phase 2 - Engagement** | 4-6 tuần | Tracking (GA4/Pixel), Chat Widget, Floating Contacts, Reviews, Loyalty/Vouchers, Notifications |
| **Phase 3 - Advanced** | 4-6 tuần | Marketing (Flash Sale, Upsell), Analytics Dashboard, Shipping API, AI Chatbot, Performance Optimization |

---

## 2. KIẾN TRÚC HỆ THỐNG

### 2.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │  Storefront  │  │  CMS Admin  │  │  Mobile (PWA)   │  │
│  │  (Next.js)   │  │  (Next.js)  │  │  Responsive     │  │
│  └──────┬───────┘  └──────┬──────┘  └───────┬─────────┘  │
└─────────┼─────────────────┼─────────────────┼────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌──────────────────────────────────────────────────────────┐
│                      API GATEWAY                         │
│                    (NestJS Backend)                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │ Auth     │ │ Products │ │ Orders   │ │ CMS        │  │
│  │ Module   │ │ Module   │ │ Module   │ │ Module     │  │
│  ├──────────┤ ├──────────┤ ├──────────┤ ├────────────┤  │
│  │ Blog     │ │ Payment  │ │ Customer │ │ Marketing  │  │
│  │ Module   │ │ Module   │ │ Module   │ │ Module     │  │
│  ├──────────┤ ├──────────┤ ├──────────┤ ├────────────┤  │
│  │ Tracking │ │ Shipping │ │ Notify   │ │ Analytics  │  │
│  │ Module   │ │ Module   │ │ Module   │ │ Module     │  │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘  │
└──────────┬───────────────────────────────────┬───────────┘
           │                                   │
           ▼                                   ▼
┌─────────────────────┐          ┌─────────────────────────┐
│    DATA LAYER       │          │   EXTERNAL SERVICES     │
│  ┌───────────────┐  │          │  ┌───────────────────┐  │
│  │  PostgreSQL   │  │          │  │  Pancake POS API  │  │
│  │  (Primary DB) │  │          │  ├───────────────────┤  │
│  ├───────────────┤  │          │  │  SePay API        │  │
│  │  Redis        │  │          │  ├───────────────────┤  │
│  │  (Cache/Queue)│  │          │  │  GHN / GHTK API   │  │
│  ├───────────────┤  │          │  ├───────────────────┤  │
│  │  Cloudflare   │  │          │  │  Zalo OA API      │  │
│  │  R2 (Storage) │  │          │  ├───────────────────┤  │
│  └───────────────┘  │          │  │  Email (Resend)   │  │
└─────────────────────┘          │  ├───────────────────┤  │
                                 │  │  Telegram Bot API  │  │
                                 │  └───────────────────┘  │
                                 └─────────────────────────┘
```

### 2.2 Folder Structure

```
poscake-skill/
├── apps/
│   ├── web/                          # Next.js Storefront + CMS Admin
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (storefront)/     # Public storefront routes
│   │   │   │   │   ├── page.tsx              # Homepage
│   │   │   │   │   ├── products/
│   │   │   │   │   │   ├── page.tsx          # Product listing
│   │   │   │   │   │   └── [slug]/page.tsx   # Product detail
│   │   │   │   │   ├── blog/
│   │   │   │   │   │   ├── page.tsx          # Blog listing
│   │   │   │   │   │   └── [slug]/page.tsx   # Blog detail
│   │   │   │   │   ├── cart/page.tsx         # Cart
│   │   │   │   │   ├── checkout/page.tsx     # Checkout
│   │   │   │   │   ├── account/              # Customer account
│   │   │   │   │   ├── pages/[slug]/page.tsx # Static pages
│   │   │   │   │   └── search/page.tsx       # Search results
│   │   │   │   │
│   │   │   │   ├── admin/             # CMS Admin routes
│   │   │   │   │   ├── layout.tsx            # Admin layout + sidebar
│   │   │   │   │   ├── dashboard/page.tsx    # Dashboard
│   │   │   │   │   ├── products/             # Product CRUD
│   │   │   │   │   ├── orders/               # Order management
│   │   │   │   │   ├── customers/            # Customer management
│   │   │   │   │   ├── blog/                 # Blog CRUD
│   │   │   │   │   ├── pages/                # Static pages CRUD
│   │   │   │   │   ├── media/                # Media library
│   │   │   │   │   ├── marketing/            # Vouchers, Flash sale
│   │   │   │   │   ├── reviews/              # Review moderation
│   │   │   │   │   ├── settings/             # Site settings
│   │   │   │   │   │   ├── general/          # Logo, contact
│   │   │   │   │   │   ├── tracking/         # GA4, Pixel, GTM
│   │   │   │   │   │   ├── chat/             # Chat widgets
│   │   │   │   │   │   ├── contacts/         # Floating contacts
│   │   │   │   │   │   ├── shipping/         # Shipping config
│   │   │   │   │   │   ├── payment/          # SePay config
│   │   │   │   │   │   ├── seo/              # SEO settings
│   │   │   │   │   │   └── appearance/       # Theme, announcement
│   │   │   │   │   └── analytics/            # Reports
│   │   │   │   │
│   │   │   │   ├── api/               # Next.js API routes (BFF)
│   │   │   │   │   ├── auth/
│   │   │   │   │   ├── webhook/
│   │   │   │   │   │   ├── sepay/            # SePay webhook
│   │   │   │   │   │   └── pancake/          # Pancake POS webhook
│   │   │   │   │   └── revalidate/           # ISR revalidation
│   │   │   │   │
│   │   │   │   └── layout.tsx         # Root layout
│   │   │   │
│   │   │   ├── components/
│   │   │   │   ├── storefront/        # Storefront components
│   │   │   │   │   ├── header/
│   │   │   │   │   │   ├── Header.tsx
│   │   │   │   │   │   ├── MegaMenu.tsx
│   │   │   │   │   │   ├── AnnouncementBar.tsx
│   │   │   │   │   │   └── SearchModal.tsx
│   │   │   │   │   ├── footer/
│   │   │   │   │   │   ├── Footer.tsx
│   │   │   │   │   │   └── PaymentIcons.tsx
│   │   │   │   │   ├── product/
│   │   │   │   │   │   ├── ProductCard.tsx
│   │   │   │   │   │   ├── ProductGallery.tsx
│   │   │   │   │   │   ├── ProductTabs.tsx
│   │   │   │   │   │   ├── VariantSelector.tsx
│   │   │   │   │   │   └── RelatedProducts.tsx
│   │   │   │   │   ├── cart/
│   │   │   │   │   │   ├── CartDrawer.tsx
│   │   │   │   │   │   ├── CartItem.tsx
│   │   │   │   │   │   └── CartSummary.tsx
│   │   │   │   │   ├── checkout/
│   │   │   │   │   │   ├── CheckoutForm.tsx
│   │   │   │   │   │   ├── SepayQR.tsx
│   │   │   │   │   │   └── OrderConfirmation.tsx
│   │   │   │   │   ├── blog/
│   │   │   │   │   │   ├── BlogCard.tsx
│   │   │   │   │   │   ├── TableOfContents.tsx
│   │   │   │   │   │   └── ShareButtons.tsx
│   │   │   │   │   ├── home/
│   │   │   │   │   │   ├── HeroSlider.tsx
│   │   │   │   │   │   ├── CategoryGrid.tsx
│   │   │   │   │   │   ├── ProductCarousel.tsx
│   │   │   │   │   │   ├── Testimonials.tsx
│   │   │   │   │   │   ├── BrandLogos.tsx
│   │   │   │   │   │   └── Newsletter.tsx
│   │   │   │   │   ├── widgets/
│   │   │   │   │   │   ├── FloatingContacts.tsx
│   │   │   │   │   │   ├── ChatWidget.tsx
│   │   │   │   │   │   ├── BackToTop.tsx
│   │   │   │   │   │   └── FloatingCart.tsx
│   │   │   │   │   └── shared/
│   │   │   │   │       ├── Breadcrumbs.tsx
│   │   │   │   │       ├── Pagination.tsx
│   │   │   │   │       ├── Rating.tsx
│   │   │   │   │       └── SEOHead.tsx
│   │   │   │   │
│   │   │   │   └── admin/             # Admin components
│   │   │   │       ├── layout/
│   │   │   │       │   ├── AdminSidebar.tsx
│   │   │   │       │   ├── AdminHeader.tsx
│   │   │   │       │   └── AdminLayout.tsx
│   │   │   │       ├── shared/
│   │   │   │       │   ├── DataTable.tsx
│   │   │   │       │   ├── RichTextEditor.tsx
│   │   │   │       │   ├── MediaPicker.tsx
│   │   │   │       │   ├── ImageUpload.tsx
│   │   │   │       │   └── FormBuilder.tsx
│   │   │   │       ├── dashboard/
│   │   │   │       │   ├── RevenueChart.tsx
│   │   │   │       │   ├── OrderStats.tsx
│   │   │   │       │   └── TopProducts.tsx
│   │   │   │       └── orders/
│   │   │   │           ├── OrderDetail.tsx
│   │   │   │           └── OrderTimeline.tsx
│   │   │   │
│   │   │   ├── hooks/
│   │   │   │   ├── useCart.ts
│   │   │   │   ├── useAuth.ts
│   │   │   │   ├── useTracking.ts
│   │   │   │   └── useDebounce.ts
│   │   │   │
│   │   │   ├── lib/
│   │   │   │   ├── api.ts              # API client
│   │   │   │   ├── auth.ts             # Auth utilities
│   │   │   │   ├── tracking.ts         # GA4 + Pixel helpers
│   │   │   │   ├── seo.ts              # SEO utilities
│   │   │   │   ├── utils.ts            # Common utilities
│   │   │   │   └── constants.ts
│   │   │   │
│   │   │   ├── stores/
│   │   │   │   ├── cartStore.ts        # Zustand cart store
│   │   │   │   ├── authStore.ts
│   │   │   │   └── uiStore.ts
│   │   │   │
│   │   │   └── types/
│   │   │       ├── product.ts
│   │   │       ├── order.ts
│   │   │       ├── blog.ts
│   │   │       ├── customer.ts
│   │   │       └── settings.ts
│   │   │
│   │   ├── public/
│   │   │   ├── images/
│   │   │   └── icons/
│   │   ├── next.config.js
│   │   ├── tailwind.config.ts
│   │   └── package.json
│   │
│   └── api/                           # NestJS Backend API
│       ├── src/
│       │   ├── main.ts
│       │   ├── app.module.ts
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   │   ├── auth.module.ts
│       │   │   │   ├── auth.controller.ts
│       │   │   │   ├── auth.service.ts
│       │   │   │   ├── guards/
│       │   │   │   │   ├── jwt.guard.ts
│       │   │   │   │   └── roles.guard.ts
│       │   │   │   ├── strategies/
│       │   │   │   │   ├── jwt.strategy.ts
│       │   │   │   │   └── google.strategy.ts
│       │   │   │   └── dto/
│       │   │   │       ├── login.dto.ts
│       │   │   │       └── register.dto.ts
│       │   │   │
│       │   │   ├── products/
│       │   │   │   ├── products.module.ts
│       │   │   │   ├── products.controller.ts
│       │   │   │   ├── products.service.ts
│       │   │   │   ├── entities/
│       │   │   │   │   ├── product.entity.ts
│       │   │   │   │   ├── product-variant.entity.ts
│       │   │   │   │   ├── product-image.entity.ts
│       │   │   │   │   └── category.entity.ts
│       │   │   │   └── dto/
│       │   │   │       ├── create-product.dto.ts
│       │   │   │       ├── update-product.dto.ts
│       │   │   │       └── product-filter.dto.ts
│       │   │   │
│       │   │   ├── orders/
│       │   │   │   ├── orders.module.ts
│       │   │   │   ├── orders.controller.ts
│       │   │   │   ├── orders.service.ts
│       │   │   │   ├── entities/
│       │   │   │   │   ├── order.entity.ts
│       │   │   │   │   └── order-item.entity.ts
│       │   │   │   └── dto/
│       │   │   │
│       │   │   ├── payments/
│       │   │   │   ├── payments.module.ts
│       │   │   │   ├── payments.controller.ts
│       │   │   │   ├── payments.service.ts
│       │   │   │   └── sepay/
│       │   │   │       ├── sepay.service.ts
│       │   │   │       └── sepay-webhook.controller.ts
│       │   │   │
│       │   │   ├── pancake/
│       │   │   │   ├── pancake.module.ts
│       │   │   │   ├── pancake.service.ts
│       │   │   │   ├── pancake-sync.service.ts
│       │   │   │   └── pancake-webhook.controller.ts
│       │   │   │
│       │   │   ├── blog/
│       │   │   │   ├── blog.module.ts
│       │   │   │   ├── blog.controller.ts
│       │   │   │   ├── blog.service.ts
│       │   │   │   └── entities/
│       │   │   │       ├── post.entity.ts
│       │   │   │       ├── post-category.entity.ts
│       │   │   │       └── comment.entity.ts
│       │   │   │
│       │   │   ├── customers/
│       │   │   │   ├── customers.module.ts
│       │   │   │   ├── customers.controller.ts
│       │   │   │   ├── customers.service.ts
│       │   │   │   └── entities/
│       │   │   │       ├── customer.entity.ts
│       │   │   │       └── address.entity.ts
│       │   │   │
│       │   │   ├── cms/
│       │   │   │   ├── cms.module.ts
│       │   │   │   ├── settings.controller.ts
│       │   │   │   ├── settings.service.ts
│       │   │   │   ├── pages.controller.ts
│       │   │   │   ├── pages.service.ts
│       │   │   │   ├── media.controller.ts
│       │   │   │   ├── media.service.ts
│       │   │   │   ├── menus.controller.ts
│       │   │   │   └── entities/
│       │   │   │       ├── setting.entity.ts
│       │   │   │       ├── page.entity.ts
│       │   │   │       ├── media.entity.ts
│       │   │   │       ├── menu.entity.ts
│       │   │   │       ├── banner.entity.ts
│       │   │   │       └── redirect.entity.ts
│       │   │   │
│       │   │   ├── marketing/
│       │   │   │   ├── marketing.module.ts
│       │   │   │   ├── voucher.controller.ts
│       │   │   │   ├── voucher.service.ts
│       │   │   │   ├── flash-sale.controller.ts
│       │   │   │   └── entities/
│       │   │   │       ├── voucher.entity.ts
│       │   │   │       ├── flash-sale.entity.ts
│       │   │   │       └── loyalty-point.entity.ts
│       │   │   │
│       │   │   ├── reviews/
│       │   │   │   ├── reviews.module.ts
│       │   │   │   ├── reviews.controller.ts
│       │   │   │   └── entities/
│       │   │   │       └── review.entity.ts
│       │   │   │
│       │   │   ├── notifications/
│       │   │   │   ├── notifications.module.ts
│       │   │   │   ├── email.service.ts
│       │   │   │   ├── zalo.service.ts
│       │   │   │   └── telegram.service.ts
│       │   │   │
│       │   │   ├── shipping/
│       │   │   │   ├── shipping.module.ts
│       │   │   │   ├── shipping.service.ts
│       │   │   │   ├── ghn.service.ts
│       │   │   │   └── ghtk.service.ts
│       │   │   │
│       │   │   └── analytics/
│       │   │       ├── analytics.module.ts
│       │   │       ├── analytics.controller.ts
│       │   │       └── analytics.service.ts
│       │   │
│       │   ├── common/
│       │   │   ├── decorators/
│       │   │   ├── filters/
│       │   │   ├── guards/
│       │   │   ├── interceptors/
│       │   │   ├── pipes/
│       │   │   └── utils/
│       │   │
│       │   └── config/
│       │       ├── database.config.ts
│       │       ├── redis.config.ts
│       │       ├── storage.config.ts
│       │       └── app.config.ts
│       │
│       ├── prisma/
│       │   ├── schema.prisma
│       │   ├── migrations/
│       │   └── seed.ts
│       │
│       └── package.json
│
├── packages/
│   └── shared/                        # Shared types, utils
│       ├── types/
│       └── utils/
│
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
├── turbo.json                         # Turborepo config
└── package.json
```

---

## 3. TECH STACK

### 3.1 Frontend

| Technology | Purpose |
|-----------|---------|
| **Next.js 14+** | App Router, SSR/SSG/ISR, API Routes |
| **TypeScript** | Type safety |
| **Tailwind CSS** | Styling |
| **shadcn/ui** | UI Component library |
| **Zustand** | State management (Cart, Auth, UI) |
| **TanStack Query** | Data fetching, caching |
| **React Hook Form + Zod** | Form handling & validation |
| **Tiptap** | Rich text editor (Blog, Pages) |
| **Swiper** | Image slider, carousels |
| **Framer Motion** | Animations |
| **next-intl** | i18n (nếu cần đa ngôn ngữ) |

### 3.2 Backend

| Technology | Purpose |
|-----------|---------|
| **NestJS** | REST API framework |
| **TypeScript** | Type safety |
| **Prisma** | ORM, migrations |
| **PostgreSQL** | Primary database |
| **Redis** | Cache, session, queue, rate-limit |
| **BullMQ** | Job queue (email, sync, notifications) |
| **Passport.js** | Authentication (JWT, Google, Zalo) |
| **Sharp** | Image processing, WebP conversion |
| **Multer + Cloudflare R2** | File upload & storage |
| **Resend** | Transactional email |
| **Helmet + CORS** | Security |

### 3.3 DevOps

| Technology | Purpose |
|-----------|---------|
| **Docker + Docker Compose** | Containerization |
| **Turborepo** | Monorepo management |
| **GitHub Actions** | CI/CD |
| **Nginx** | Reverse proxy |
| **Let's Encrypt** | SSL |
| **PM2** | Process manager (production) |

---

## 4. DATABASE SCHEMA

### 4.1 Entity Relationship Diagram (ERD)

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│    users      │     │    products      │     │   categories │
├──────────────┤     ├──────────────────┤     ├──────────────┤
│ id           │     │ id               │────▶│ id           │
│ email        │     │ name             │     │ name         │
│ password     │     │ slug             │     │ slug         │
│ full_name    │     │ description      │     │ parent_id    │
│ phone        │     │ short_desc       │     │ image        │
│ avatar       │     │ category_id (FK) │     │ sort_order   │
│ role         │     │ brand_id (FK)    │     │ is_active    │
│ provider     │     │ base_price       │     │ meta_title   │
│ provider_id  │     │ sale_price       │     │ meta_desc    │
│ is_active    │     │ sku              │     │ created_at   │
│ email_verified│    │ barcode          │     └──────────────┘
│ created_at   │     │ stock_quantity   │
│ updated_at   │     │ weight           │     ┌──────────────┐
└──────┬───────┘     │ is_active        │     │   brands     │
       │             │ is_featured      │     ├──────────────┤
       │             │ tags             │     │ id           │
       │             │ meta_title       │     │ name         │
       │             │ meta_description │     │ slug         │
       │             │ pancake_id       │     │ logo         │
       │             │ view_count       │     │ is_active    │
       │             │ sold_count       │     └──────────────┘
       │             │ avg_rating       │
       │             │ created_at       │     ┌──────────────────┐
       │             │ updated_at       │     │ product_variants │
       │             └────────┬─────────┘     ├──────────────────┤
       │                      │               │ id               │
       │                      │──────────────▶│ product_id (FK)  │
       │                      │               │ name             │
       │                      │               │ sku              │
       │                      │               │ price            │
       │                      │               │ sale_price       │
       │                      │               │ stock_quantity   │
       │                      │               │ attributes (JSON)│
       │                      │               │ is_active        │
       │                      │               │ pancake_id       │
       │                      │               └──────────────────┘
       │                      │
       │                      │               ┌──────────────────┐
       │                      │──────────────▶│ product_images   │
       │                      │               ├──────────────────┤
       │                      │               │ id               │
       │                      │               │ product_id (FK)  │
       │                      │               │ url              │
       │                      │               │ alt_text         │
       │                      │               │ sort_order       │
       │                      │               │ is_primary       │
       │                      │               └──────────────────┘
       │
       │             ┌──────────────────┐     ┌──────────────────┐
       │             │    orders        │     │   order_items    │
       │             ├──────────────────┤     ├──────────────────┤
       └────────────▶│ id               │────▶│ id               │
                     │ order_number     │     │ order_id (FK)    │
                     │ customer_id (FK) │     │ product_id (FK)  │
                     │ status           │     │ variant_id (FK)  │
                     │ payment_status   │     │ product_name     │
                     │ payment_method   │     │ variant_name     │
                     │ subtotal         │     │ sku              │
                     │ discount_amount  │     │ price            │
                     │ shipping_fee     │     │ quantity         │
                     │ total            │     │ total            │
                     │ voucher_id (FK)  │     └──────────────────┘
                     │ shipping_name    │
                     │ shipping_phone   │
                     │ shipping_email   │
                     │ shipping_address │
                     │ shipping_ward    │
                     │ shipping_district│
                     │ shipping_province│
                     │ shipping_method  │
                     │ tracking_number  │
                     │ note             │
                     │ pancake_order_id │
                     │ sepay_tx_id      │
                     │ paid_at          │
                     │ shipped_at       │
                     │ delivered_at     │
                     │ cancelled_at     │
                     │ cancel_reason    │
                     │ created_at       │
                     │ updated_at       │
                     └──────────────────┘
```

### 4.2 Full Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// AUTH & USERS
// ============================================

enum UserRole {
  ADMIN
  STAFF
  CUSTOMER
}

enum AuthProvider {
  LOCAL
  GOOGLE
  ZALO
  FACEBOOK
}

model User {
  id             String       @id @default(cuid())
  email          String       @unique
  password       String?
  fullName       String       @map("full_name")
  phone          String?      @unique
  avatar         String?
  role           UserRole     @default(CUSTOMER)
  provider       AuthProvider @default(LOCAL)
  providerId     String?      @map("provider_id")
  isActive       Boolean      @default(true) @map("is_active")
  emailVerified  Boolean      @default(false) @map("email_verified")
  lastLoginAt    DateTime?    @map("last_login_at")
  createdAt      DateTime     @default(now()) @map("created_at")
  updatedAt      DateTime     @updatedAt @map("updated_at")

  // Relations
  orders         Order[]
  reviews        Review[]
  addresses      Address[]
  wishlist       Wishlist[]
  loyaltyPoints  LoyaltyPoint[]

  @@map("users")
}

model Address {
  id          String   @id @default(cuid())
  userId      String   @map("user_id")
  fullName    String   @map("full_name")
  phone       String
  address     String
  ward        String
  district    String
  province    String
  isDefault   Boolean  @default(false) @map("is_default")
  createdAt   DateTime @default(now()) @map("created_at")

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("addresses")
}

// ============================================
// PRODUCTS
// ============================================

model Category {
  id          String     @id @default(cuid())
  name        String
  slug        String     @unique
  description String?
  image       String?
  parentId    String?    @map("parent_id")
  sortOrder   Int        @default(0) @map("sort_order")
  isActive    Boolean    @default(true) @map("is_active")
  metaTitle   String?    @map("meta_title")
  metaDesc    String?    @map("meta_description")
  createdAt   DateTime   @default(now()) @map("created_at")
  updatedAt   DateTime   @updatedAt @map("updated_at")

  parent      Category?  @relation("CategoryTree", fields: [parentId], references: [id])
  children    Category[] @relation("CategoryTree")
  products    Product[]

  @@map("categories")
}

model Brand {
  id        String    @id @default(cuid())
  name      String
  slug      String    @unique
  logo      String?
  isActive  Boolean   @default(true) @map("is_active")
  createdAt DateTime  @default(now()) @map("created_at")

  products  Product[]

  @@map("brands")
}

model Product {
  id              String           @id @default(cuid())
  name            String
  slug            String           @unique
  description     String?          @db.Text
  shortDesc       String?          @map("short_description")
  categoryId      String?          @map("category_id")
  brandId         String?          @map("brand_id")
  basePrice       Decimal          @map("base_price") @db.Decimal(12, 0)
  salePrice       Decimal?         @map("sale_price") @db.Decimal(12, 0)
  sku             String?          @unique
  barcode         String?
  stockQuantity   Int              @default(0) @map("stock_quantity")
  weight          Int?             // gram
  isActive        Boolean          @default(true) @map("is_active")
  isFeatured      Boolean          @default(false) @map("is_featured")
  tags            String[]         @default([])
  metaTitle       String?          @map("meta_title")
  metaDescription String?          @map("meta_description")
  pancakeId       String?          @unique @map("pancake_id")
  viewCount       Int              @default(0) @map("view_count")
  soldCount       Int              @default(0) @map("sold_count")
  avgRating       Decimal          @default(0) @map("avg_rating") @db.Decimal(2, 1)
  createdAt       DateTime         @default(now()) @map("created_at")
  updatedAt       DateTime         @updatedAt @map("updated_at")

  category        Category?        @relation(fields: [categoryId], references: [id])
  brand           Brand?           @relation(fields: [brandId], references: [id])
  variants        ProductVariant[]
  images          ProductImage[]
  reviews         Review[]
  orderItems      OrderItem[]
  wishlist        Wishlist[]
  flashSaleItems  FlashSaleItem[]

  @@index([categoryId])
  @@index([slug])
  @@index([isActive, isFeatured])
  @@map("products")
}

model ProductVariant {
  id            String      @id @default(cuid())
  productId     String      @map("product_id")
  name          String      // e.g., "Đỏ - XL"
  sku           String?     @unique
  price         Decimal     @db.Decimal(12, 0)
  salePrice     Decimal?    @map("sale_price") @db.Decimal(12, 0)
  stockQuantity Int         @default(0) @map("stock_quantity")
  attributes    Json        // { "color": "Đỏ", "size": "XL" }
  isActive      Boolean     @default(true) @map("is_active")
  pancakeId     String?     @unique @map("pancake_id")
  createdAt     DateTime    @default(now()) @map("created_at")

  product       Product     @relation(fields: [productId], references: [id], onDelete: Cascade)
  orderItems    OrderItem[]

  @@map("product_variants")
}

model ProductImage {
  id        String   @id @default(cuid())
  productId String   @map("product_id")
  url       String
  altText   String?  @map("alt_text")
  sortOrder Int      @default(0) @map("sort_order")
  isPrimary Boolean  @default(false) @map("is_primary")

  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@map("product_images")
}

model Wishlist {
  id        String   @id @default(cuid())
  userId    String   @map("user_id")
  productId String   @map("product_id")
  createdAt DateTime @default(now()) @map("created_at")

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@unique([userId, productId])
  @@map("wishlists")
}

// ============================================
// ORDERS
// ============================================

enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING
  SHIPPING
  DELIVERED
  CANCELLED
  REFUNDED
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
}

enum PaymentMethod {
  COD
  SEPAY_QR
  BANK_TRANSFER
}

enum ShippingMethod {
  GHN
  GHTK
  VIETTEL_POST
  SELF_DELIVERY
  PICKUP
}

model Order {
  id               String          @id @default(cuid())
  orderNumber      String          @unique @map("order_number")
  customerId       String?         @map("customer_id")
  status           OrderStatus     @default(PENDING)
  paymentStatus    PaymentStatus   @default(PENDING) @map("payment_status")
  paymentMethod    PaymentMethod   @map("payment_method")
  subtotal         Decimal         @db.Decimal(12, 0)
  discountAmount   Decimal         @default(0) @map("discount_amount") @db.Decimal(12, 0)
  shippingFee      Decimal         @default(0) @map("shipping_fee") @db.Decimal(12, 0)
  total            Decimal         @db.Decimal(12, 0)
  voucherId        String?         @map("voucher_id")
  // Shipping Info
  shippingName     String          @map("shipping_name")
  shippingPhone    String          @map("shipping_phone")
  shippingEmail    String?         @map("shipping_email")
  shippingAddress  String          @map("shipping_address")
  shippingWard     String          @map("shipping_ward")
  shippingDistrict String          @map("shipping_district")
  shippingProvince String          @map("shipping_province")
  shippingMethod   ShippingMethod? @map("shipping_method")
  trackingNumber   String?         @map("tracking_number")
  note             String?
  // External IDs
  pancakeOrderId   String?         @unique @map("pancake_order_id")
  sepayTxId        String?         @unique @map("sepay_tx_id")
  // Timestamps
  paidAt           DateTime?       @map("paid_at")
  shippedAt        DateTime?       @map("shipped_at")
  deliveredAt      DateTime?       @map("delivered_at")
  cancelledAt      DateTime?       @map("cancelled_at")
  cancelReason     String?         @map("cancel_reason")
  createdAt        DateTime        @default(now()) @map("created_at")
  updatedAt        DateTime        @updatedAt @map("updated_at")

  customer         User?           @relation(fields: [customerId], references: [id])
  voucher          Voucher?        @relation(fields: [voucherId], references: [id])
  items            OrderItem[]
  timeline         OrderTimeline[]

  @@index([orderNumber])
  @@index([customerId])
  @@index([status])
  @@index([createdAt])
  @@map("orders")
}

model OrderItem {
  id          String          @id @default(cuid())
  orderId     String          @map("order_id")
  productId   String          @map("product_id")
  variantId   String?         @map("variant_id")
  productName String          @map("product_name")
  variantName String?         @map("variant_name")
  sku         String?
  price       Decimal         @db.Decimal(12, 0)
  quantity    Int
  total       Decimal         @db.Decimal(12, 0)

  order       Order           @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product     Product         @relation(fields: [productId], references: [id])
  variant     ProductVariant? @relation(fields: [variantId], references: [id])

  @@map("order_items")
}

model OrderTimeline {
  id        String   @id @default(cuid())
  orderId   String   @map("order_id")
  status    String
  note      String?
  createdBy String?  @map("created_by")
  createdAt DateTime @default(now()) @map("created_at")

  order     Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@map("order_timelines")
}

// ============================================
// BLOG
// ============================================

enum PostStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

model PostCategory {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String?
  sortOrder   Int      @default(0) @map("sort_order")
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")

  posts       Post[]

  @@map("post_categories")
}

model Post {
  id              String       @id @default(cuid())
  title           String
  slug            String       @unique
  excerpt         String?
  content         String       @db.Text
  featuredImage   String?      @map("featured_image")
  categoryId      String?      @map("category_id")
  authorId        String       @map("author_id")
  status          PostStatus   @default(DRAFT)
  tags            String[]     @default([])
  readingTime     Int?         @map("reading_time") // minutes
  viewCount       Int          @default(0) @map("view_count")
  metaTitle       String?      @map("meta_title")
  metaDescription String?      @map("meta_description")
  publishedAt     DateTime?    @map("published_at")
  createdAt       DateTime     @default(now()) @map("created_at")
  updatedAt       DateTime     @updatedAt @map("updated_at")

  category        PostCategory? @relation(fields: [categoryId], references: [id])
  comments        Comment[]

  @@index([slug])
  @@index([status, publishedAt])
  @@map("posts")
}

model Comment {
  id        String    @id @default(cuid())
  postId    String    @map("post_id")
  name      String
  email     String
  content   String
  parentId  String?   @map("parent_id")
  isApproved Boolean  @default(false) @map("is_approved")
  createdAt DateTime  @default(now()) @map("created_at")

  post      Post      @relation(fields: [postId], references: [id], onDelete: Cascade)
  parent    Comment?  @relation("CommentReplies", fields: [parentId], references: [id])
  replies   Comment[] @relation("CommentReplies")

  @@map("comments")
}

// ============================================
// REVIEWS
// ============================================

model Review {
  id        String   @id @default(cuid())
  productId String   @map("product_id")
  userId    String   @map("user_id")
  orderId   String?  @map("order_id")
  rating    Int      // 1-5
  content   String?
  images    String[] @default([])
  isApproved Boolean @default(false) @map("is_approved")
  adminReply String?  @map("admin_reply")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id])

  @@unique([productId, userId, orderId])
  @@map("reviews")
}

// ============================================
// MARKETING
// ============================================

enum VoucherType {
  PERCENTAGE
  FIXED_AMOUNT
  FREE_SHIPPING
}

model Voucher {
  id              String      @id @default(cuid())
  code            String      @unique
  name            String
  description     String?
  type            VoucherType
  value           Decimal     @db.Decimal(12, 0)
  minOrderAmount  Decimal?    @map("min_order_amount") @db.Decimal(12, 0)
  maxDiscount     Decimal?    @map("max_discount") @db.Decimal(12, 0)
  usageLimit      Int?        @map("usage_limit")
  usedCount       Int         @default(0) @map("used_count")
  perUserLimit    Int         @default(1) @map("per_user_limit")
  startDate       DateTime    @map("start_date")
  endDate         DateTime    @map("end_date")
  isActive        Boolean     @default(true) @map("is_active")
  createdAt       DateTime    @default(now()) @map("created_at")

  orders          Order[]

  @@map("vouchers")
}

model FlashSale {
  id        String          @id @default(cuid())
  name      String
  startTime DateTime        @map("start_time")
  endTime   DateTime        @map("end_time")
  isActive  Boolean         @default(true) @map("is_active")
  createdAt DateTime        @default(now()) @map("created_at")

  items     FlashSaleItem[]

  @@map("flash_sales")
}

model FlashSaleItem {
  id          String    @id @default(cuid())
  flashSaleId String    @map("flash_sale_id")
  productId   String    @map("product_id")
  salePrice   Decimal   @map("sale_price") @db.Decimal(12, 0)
  quantity    Int
  soldCount   Int       @default(0) @map("sold_count")

  flashSale   FlashSale @relation(fields: [flashSaleId], references: [id], onDelete: Cascade)
  product     Product   @relation(fields: [productId], references: [id])

  @@unique([flashSaleId, productId])
  @@map("flash_sale_items")
}

model LoyaltyPoint {
  id          String   @id @default(cuid())
  userId      String   @map("user_id")
  points      Int
  type        String   // EARN, REDEEM, EXPIRE
  description String
  orderId     String?  @map("order_id")
  expiresAt   DateTime? @map("expires_at")
  createdAt   DateTime @default(now()) @map("created_at")

  user        User     @relation(fields: [userId], references: [id])

  @@index([userId])
  @@map("loyalty_points")
}

// ============================================
// CMS - SETTINGS & CONTENT
// ============================================

model Setting {
  id    String @id @default(cuid())
  group String // general, tracking, chat, contacts, seo, appearance
  key   String
  value Json
  updatedAt DateTime @updatedAt @map("updated_at")

  @@unique([group, key])
  @@map("settings")
}

model Page {
  id              String   @id @default(cuid())
  title           String
  slug            String   @unique
  content         String   @db.Text
  metaTitle       String?  @map("meta_title")
  metaDescription String?  @map("meta_description")
  isActive        Boolean  @default(true) @map("is_active")
  sortOrder       Int      @default(0) @map("sort_order")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  @@map("pages")
}

model Media {
  id        String   @id @default(cuid())
  filename  String
  url       String
  mimeType  String   @map("mime_type")
  size      Int      // bytes
  width     Int?
  height    Int?
  altText   String?  @map("alt_text")
  folder    String   @default("general")
  createdAt DateTime @default(now()) @map("created_at")

  @@map("media")
}

model Banner {
  id        String   @id @default(cuid())
  title     String
  image     String
  mobileImage String? @map("mobile_image")
  link      String?
  position  String   // hero, sidebar, popup
  sortOrder Int      @default(0) @map("sort_order")
  isActive  Boolean  @default(true) @map("is_active")
  startDate DateTime? @map("start_date")
  endDate   DateTime? @map("end_date")
  createdAt DateTime @default(now()) @map("created_at")

  @@map("banners")
}

model Menu {
  id        String     @id @default(cuid())
  name      String
  position  String     // header, footer, mobile
  items     Json       // Nested menu items array
  isActive  Boolean    @default(true) @map("is_active")
  updatedAt DateTime   @updatedAt @map("updated_at")

  @@unique([position])
  @@map("menus")
}

model Redirect {
  id        String   @id @default(cuid())
  fromPath  String   @unique @map("from_path")
  toPath    String   @map("to_path")
  type      Int      @default(301) // 301 or 302
  isActive  Boolean  @default(true) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at")

  @@map("redirects")
}

// ============================================
// NOTIFICATIONS LOG
// ============================================

model NotificationLog {
  id        String   @id @default(cuid())
  channel   String   // email, zalo, telegram, sms
  recipient String
  subject   String?
  content   String   @db.Text
  status    String   // sent, failed, pending
  metadata  Json?
  createdAt DateTime @default(now()) @map("created_at")

  @@index([channel, status])
  @@map("notification_logs")
}
```

---

## 5. PHASE 1 - MVP CORE

### Module 5.1: Authentication & Authorization

**Mô tả:** Hệ thống xác thực cho cả Admin/Staff (CMS) và Customer (Storefront).

**User Stories:**

| ID | Story | Priority |
|----|-------|----------|
| AUTH-01 | Admin đăng nhập bằng email/password | 🔴 |
| AUTH-02 | Customer đăng ký/đăng nhập bằng email | 🔴 |
| AUTH-03 | Customer đăng nhập bằng Google | 🟡 |
| AUTH-04 | Customer đăng nhập bằng Zalo | 🟡 |
| AUTH-05 | Quên mật khẩu / Reset password | 🔴 |
| AUTH-06 | Refresh token tự động | 🔴 |
| AUTH-07 | Admin phân quyền Staff (RBAC) | 🟡 |

**Technical Specs:**

```
Authentication Flow:
1. Login → POST /api/auth/login
2. Server validates credentials
3. Return { accessToken (15m), refreshToken (7d) }
4. accessToken stored in memory (Zustand)
5. refreshToken stored in httpOnly cookie
6. Auto refresh via interceptor khi accessToken expire

JWT Payload:
{
  sub: "user_id",
  email: "user@email.com",
  role: "ADMIN" | "STAFF" | "CUSTOMER",
  iat: timestamp,
  exp: timestamp
}

Password: bcrypt with salt rounds = 12
Rate Limit: 5 login attempts / 15 minutes per IP
```

---

### Module 5.2: CMS - Settings & Content Management

**Mô tả:** Backend CMS cho phép Admin quản lý toàn bộ cấu hình website mà không cần sửa code.

**5.2.1 General Settings**

```json
// Settings group: "general"
{
  "site_name": "PosCake Store",
  "site_description": "Mô tả ngắn website",
  "logo": "https://cdn.../logo.png",
  "logo_dark": "https://cdn.../logo-dark.png",
  "favicon": "https://cdn.../favicon.ico",
  "contact": {
    "phone": "0900 000 000",
    "hotline": "1800 1234",
    "email": "info@poscake.vn",
    "address": "123 Nguyễn Huệ, Q1, TP.HCM",
    "working_hours": "T2-T7: 8:00 - 21:00"
  },
  "social": {
    "facebook": "https://facebook.com/poscake",
    "zalo": "https://zalo.me/0900000000",
    "tiktok": "https://tiktok.com/@poscake",
    "youtube": "https://youtube.com/@poscake",
    "instagram": "https://instagram.com/poscake"
  }
}
```

**5.2.2 Tracking Scripts Settings**

```json
// Settings group: "tracking"
{
  "google_analytics_id": "G-XXXXXXXXXX",
  "google_tag_manager_id": "GTM-XXXXXXX",
  "facebook_pixel_id": "1234567890",
  "facebook_conversions_api_token": "EAAxxxxxx",
  "tiktok_pixel_id": "CXXXXXXXXX",
  "custom_head_scripts": "<script>...</script>",
  "custom_body_scripts": "<script>...</script>",
  "hotjar_id": "3456789"
}
```

**5.2.3 Chat Widget Settings**

```json
// Settings group: "chat"
{
  "zalo_chat": {
    "enabled": true,
    "oa_id": "1234567890"
  },
  "messenger_chat": {
    "enabled": true,
    "page_id": "123456789",
    "color": "#0084FF",
    "greeting": "Chào bạn! Cần hỗ trợ gì không?"
  },
  "tawkto": {
    "enabled": false,
    "property_id": "xxx",
    "widget_id": "xxx"
  },
  "ai_chatbot": {
    "enabled": false,
    "api_key": "sk-xxx",
    "system_prompt": "Bạn là trợ lý bán hàng...",
    "greeting_message": "Xin chào! Tôi có thể giúp gì cho bạn?"
  },
  "auto_reply": {
    "enabled": true,
    "message": "Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi trong 5 phút.",
    "outside_hours_message": "Chúng tôi sẽ liên hệ lại vào giờ làm việc (T2-T7, 8:00-21:00)"
  }
}
```

**5.2.4 Floating Contacts Settings**

```json
// Settings group: "contacts"
{
  "enabled": true,
  "position": "right",       // left | right
  "show_on_mobile": true,
  "items": [
    {
      "id": "phone",
      "type": "phone",
      "label": "Hotline",
      "value": "0900000000",
      "icon": "phone",
      "color": "#25D366",
      "enabled": true,
      "sort_order": 1
    },
    {
      "id": "zalo",
      "type": "zalo",
      "label": "Chat Zalo",
      "value": "0900000000",
      "icon": "message-circle",
      "color": "#0068FF",
      "enabled": true,
      "sort_order": 2
    },
    {
      "id": "messenger",
      "type": "messenger",
      "label": "Messenger",
      "value": "poscake",
      "icon": "facebook",
      "color": "#0084FF",
      "enabled": true,
      "sort_order": 3
    },
    {
      "id": "maps",
      "type": "link",
      "label": "Chỉ đường",
      "value": "https://maps.google.com/...",
      "icon": "map-pin",
      "color": "#EA4335",
      "enabled": true,
      "sort_order": 4
    }
  ]
}
```

**5.2.5 Appearance Settings**

```json
// Settings group: "appearance"
{
  "announcement_bar": {
    "enabled": true,
    "text": "🔥 Free ship đơn từ 500K | Giảm 10% cho khách hàng mới",
    "link": "/khuyen-mai",
    "bg_color": "#EF4444",
    "text_color": "#FFFFFF",
    "closable": true
  },
  "homepage_sections": [
    { "type": "hero_slider", "enabled": true, "sort_order": 1 },
    { "type": "category_grid", "enabled": true, "sort_order": 2 },
    { "type": "featured_products", "enabled": true, "sort_order": 3, "title": "Sản phẩm nổi bật" },
    { "type": "flash_sale", "enabled": true, "sort_order": 4 },
    { "type": "new_products", "enabled": true, "sort_order": 5, "title": "Hàng mới về" },
    { "type": "best_sellers", "enabled": true, "sort_order": 6, "title": "Bán chạy nhất" },
    { "type": "blog_posts", "enabled": true, "sort_order": 7, "title": "Bài viết mới" },
    { "type": "testimonials", "enabled": true, "sort_order": 8 },
    { "type": "brand_logos", "enabled": true, "sort_order": 9 },
    { "type": "newsletter", "enabled": true, "sort_order": 10 }
  ],
  "footer": {
    "columns": [
      {
        "title": "Về chúng tôi",
        "content": "PosCake - Shop uy tín...",
        "type": "text"
      },
      {
        "title": "Chính sách",
        "type": "links",
        "links": [
          { "label": "Chính sách đổi trả", "url": "/pages/chinh-sach-doi-tra" },
          { "label": "Chính sách bảo mật", "url": "/pages/chinh-sach-bao-mat" },
          { "label": "Điều khoản sử dụng", "url": "/pages/dieu-khoan-su-dung" }
        ]
      }
    ],
    "bct_badge": true,
    "dmca_badge": false,
    "copyright": "© 2026 PosCake. All rights reserved."
  }
}
```

**5.2.6 SEO Settings**

```json
// Settings group: "seo"
{
  "default_meta_title": "PosCake - Mua sắm online uy tín",
  "default_meta_description": "Shop online uy tín, giao hàng nhanh...",
  "og_image": "https://cdn.../og-image.jpg",
  "robots_txt": "User-agent: *\nAllow: /\nDisallow: /admin",
  "google_verification": "xxx",
  "schema_organization": {
    "name": "PosCake",
    "url": "https://poscake.vn",
    "logo": "https://cdn.../logo.png"
  }
}
```

**CMS Admin User Stories:**

| ID | Story | Priority |
|----|-------|----------|
| CMS-01 | Admin CRUD Banners (hero slider, popup) | 🔴 |
| CMS-02 | Admin CRUD Static Pages (WYSIWYG editor) | 🔴 |
| CMS-03 | Admin quản lý Media Library (upload, browse) | 🔴 |
| CMS-04 | Admin cấu hình tất cả Settings groups | 🔴 |
| CMS-05 | Admin CRUD Menus (header, footer, mobile) | 🔴 |
| CMS-06 | Admin quản lý 301 Redirects | 🟡 |
| CMS-07 | Admin xem/sửa SEO meta cho từng trang | 🟡 |
| CMS-08 | Admin bật/tắt Maintenance mode | 🟢 |

---

### Module 5.3: Product Management

**User Stories:**

| ID | Story | Priority |
|----|-------|----------|
| PROD-01 | Admin CRUD sản phẩm (tên, mô tả, giá, ảnh, SEO) | 🔴 |
| PROD-02 | Admin quản lý variants (size, color, SKU, giá riêng) | 🔴 |
| PROD-03 | Admin CRUD danh mục sản phẩm (nested tree) | 🔴 |
| PROD-04 | Admin CRUD thương hiệu | 🟡 |
| PROD-05 | Admin upload nhiều ảnh, kéo thả sắp xếp | 🔴 |
| PROD-06 | Admin import/export sản phẩm CSV | 🟡 |
| PROD-07 | Admin quản lý tồn kho (stock per variant) | 🔴 |
| PROD-08 | Đồng bộ sản phẩm từ Pancake POS | 🔴 |
| PROD-09 | Admin đánh dấu sản phẩm nổi bật/featured | 🟡 |
| PROD-10 | Admin quản lý tags sản phẩm | 🟢 |
| PROD-11 | Auto generate slug từ tên sản phẩm | 🔴 |
| PROD-12 | Auto convert ảnh sang WebP khi upload | 🟡 |

**Product Detail Structure:**

```
Product Form (Admin CMS)
├── Tab: Thông tin cơ bản
│   ├── Tên sản phẩm *
│   ├── Slug (auto-generate) *
│   ├── Mô tả ngắn
│   ├── Mô tả chi tiết (Rich Text Editor)
│   ├── Danh mục (select tree)
│   ├── Thương hiệu (select)
│   └── Tags (multi-select / creatable)
│
├── Tab: Giá & Kho
│   ├── Giá gốc (base_price) *
│   ├── Giá khuyến mãi (sale_price)
│   ├── SKU
│   ├── Barcode
│   ├── Số lượng tồn kho *
│   ├── Trọng lượng (gram)
│   └── Trạng thái (active/inactive)
│
├── Tab: Biến thể (Variants)
│   ├── Thuộc tính (Màu sắc, Size, ...)
│   ├── Tự động tạo combo variants
│   └── Mỗi variant: tên, SKU, giá, tồn kho
│
├── Tab: Hình ảnh
│   ├── Upload nhiều ảnh (drag & drop)
│   ├── Chọn ảnh chính
│   ├── Kéo thả sắp xếp thứ tự
│   └── Alt text cho SEO
│
├── Tab: SEO
│   ├── Meta Title
│   ├── Meta Description
│   └── Preview Google snippet
│
└── Tab: Liên kết
    └── Pancake Product ID (nếu đồng bộ)
```

---

### Module 5.4: Storefront UI

**5.4.1 Homepage**

```
Homepage Layout
├── <AnnouncementBar />     - Thanh thông báo khuyến mãi
├── <Header />
│   ├── Logo
│   ├── <MegaMenu />        - Menu đa cấp
│   ├── <SearchModal />      - Tìm kiếm overlay
│   ├── Account icon
│   └── Cart icon + count
│
├── <HeroSlider />          - Banner carousel từ CMS
├── <CategoryGrid />        - Lưới danh mục có hình
├── <FlashSale />           - Countdown + sản phẩm sale (nếu active)
├── <ProductCarousel />      - Sản phẩm nổi bật
├── <ProductCarousel />      - Hàng mới về
├── <ProductCarousel />      - Bán chạy nhất
├── <BlogPosts />           - 4 bài viết mới nhất
├── <Testimonials />        - Khách hàng nhận xét
├── <BrandLogos />          - Logo đối tác/thương hiệu
├── <Newsletter />          - Đăng ký nhận tin
│
├── <Footer />
│   ├── Multi-column content
│   ├── Payment method icons
│   ├── Shipping partner icons
│   ├── BCT badge
│   └── Social media links
│
├── <FloatingContacts />    - Nút liên hệ nổi
├── <ChatWidget />          - Chat widget
├── <BackToTop />           - Nút lên đầu trang
└── <FloatingCart />        - Mini cart nổi (mobile)
```

**5.4.2 Product Listing Page**

```
Category/Search Page
├── <Breadcrumbs />
├── Category title & description
├── Filter Sidebar
│   ├── Danh mục con
│   ├── Khoảng giá (range slider)
│   ├── Thương hiệu (checkbox)
│   ├── Rating (stars)
│   └── Tags
├── Sort Bar: Mới nhất | Giá tăng | Giá giảm | Bán chạy | Đánh giá
├── Product Grid (responsive: 2col mobile, 3-4col desktop)
│   └── <ProductCard />
│       ├── Image (hover = ảnh thứ 2)
│       ├── Name
│       ├── Price (gạch giá gốc nếu có sale)
│       ├── Rating stars
│       ├── "Đã bán X" badge
│       ├── Sale % badge
│       ├── Quick add to cart
│       └── Wishlist heart icon
└── <Pagination />
```

**5.4.3 Product Detail Page**

```
Product Detail
├── <Breadcrumbs />
├── Layout 2 columns
│   ├── Left: <ProductGallery />
│   │   ├── Main image (zoom on hover)
│   │   ├── Thumbnail carousel
│   │   └── Lightbox fullscreen
│   │
│   └── Right: Product Info
│       ├── Name
│       ├── Rating (X stars - Y đánh giá - Z đã bán)
│       ├── Price block (sale price, original, % off)
│       ├── Flash sale countdown (nếu có)
│       ├── <VariantSelector /> (color swatches, size buttons)
│       ├── Quantity selector
│       ├── Stock status ("Còn X sản phẩm")
│       ├── [Thêm vào giỏ] [Mua ngay] buttons
│       ├── Wishlist + Share buttons
│       ├── Cam kết: Chính hãng | Free ship | Đổi trả
│       └── SKU, Category, Tags
│
├── <ProductTabs />
│   ├── Tab: Mô tả chi tiết
│   ├── Tab: Thông số kỹ thuật
│   ├── Tab: Đánh giá (X reviews)
│   │   ├── Rating summary (bar chart)
│   │   ├── Review list
│   │   │   └── Avatar, name, rating, date, content, images
│   │   └── Write review form (nếu đã mua)
│   └── Tab: Hỏi đáp (Q&A)
│
├── <RelatedProducts />      - Sản phẩm liên quan
├── <RecentlyViewed />       - Đã xem gần đây
│
└── Schema Markup: Product, BreadcrumbList, AggregateRating
```

---

### Module 5.5: Cart & Checkout

**User Stories:**

| ID | Story | Priority |
|----|-------|----------|
| CART-01 | Thêm/xóa/cập nhật số lượng sản phẩm trong giỏ | 🔴 |
| CART-02 | Giỏ hàng persist (Zustand + localStorage fallback) | 🔴 |
| CART-03 | Mini cart drawer (slide from right) | 🔴 |
| CART-04 | Cart page đầy đủ | 🔴 |
| CART-05 | Áp dụng mã giảm giá (voucher) | 🔴 |
| CART-06 | Tính phí vận chuyển theo địa chỉ | 🟡 |
| CART-07 | Guest checkout (không cần đăng ký) | 🔴 |
| CART-08 | Checkout form validation | 🔴 |

**Cart State (Zustand):**

```typescript
interface CartItem {
  productId: string;
  variantId?: string;
  name: string;
  variantName?: string;
  image: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  maxQuantity: number; // stock limit
  sku?: string;
}

interface CartStore {
  items: CartItem[];
  voucherCode: string | null;
  voucherDiscount: number;
  
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, variantId: string | undefined, qty: number) => void;
  applyVoucher: (code: string) => Promise<void>;
  removeVoucher: () => void;
  clearCart: () => void;
  
  // Computed
  subtotal: number;
  totalItems: number;
  total: number;
}
```

**Checkout Flow:**

```
1. Cart Page
   ├── Review items
   ├── Apply voucher
   └── [Tiến hành thanh toán]
   
2. Checkout Page
   ├── Step 1: Thông tin giao hàng
   │   ├── Họ tên *
   │   ├── Số điện thoại *
   │   ├── Email
   │   ├── Tỉnh/Thành * (select)
   │   ├── Quận/Huyện * (select - dependent)
   │   ├── Phường/Xã * (select - dependent)
   │   ├── Địa chỉ chi tiết *
   │   └── Ghi chú đơn hàng
   │
   ├── Step 2: Phương thức vận chuyển
   │   ├── GHN Express (fee auto-calculated)
   │   ├── GHTK (fee auto-calculated)
   │   ├── Nhận tại cửa hàng (free)
   │   └── Estimated delivery date
   │
   ├── Step 3: Phương thức thanh toán
   │   ├── COD (Thanh toán khi nhận hàng)
   │   ├── SePay QR (Chuyển khoản ngân hàng)
   │   └── Chuyển khoản thủ công
   │
   ├── Order Summary Sidebar
   │   ├── Item list
   │   ├── Subtotal
   │   ├── Discount
   │   ├── Shipping fee
   │   └── Total
   │
   └── [Đặt hàng]

3. Order Confirmation
   ├── If COD → Thank you page + order details
   └── If SePay →
       ├── QR Code hiển thị
       ├── Thông tin chuyển khoản (STK, bank, nội dung CK)
       ├── Countdown timer (15 phút)
       ├── Auto-check payment status (polling / websocket)
       └── Khi nhận webhook SePay → redirect to Thank You page
```

---

### Module 5.6: Payment - SePay Integration

**Mô tả:** Tích hợp SePay để nhận thanh toán QR Banking, webhook tự động xác nhận.

**Flow:**

```
Customer                    PosCake                     SePay
   │                          │                           │
   │  1. Place order          │                           │
   │─────────────────────────▶│                           │
   │                          │  2. Create payment        │
   │                          │  (generate unique code)   │
   │  3. Show QR Code         │                           │
   │◀─────────────────────────│                           │
   │                          │                           │
   │  4. Customer scans QR    │                           │
   │  & transfers money       │                           │
   │──────────────────────────┼──────────────────────────▶│
   │                          │                           │
   │                          │  5. Webhook notification  │
   │                          │◀──────────────────────────│
   │                          │                           │
   │                          │  6. Verify & confirm      │
   │                          │  Update order status      │
   │  7. Payment confirmed    │                           │
   │◀─────────────────────────│                           │
   │                          │  8. Sync to Pancake POS   │
   │                          │─────────────────────────▶ │
```

**SePay Webhook Handler:**

```typescript
// POST /api/webhook/sepay
interface SepayWebhookPayload {
  id: number;
  gateway: string;
  transactionDate: string;
  accountNumber: string;
  subAccount: string | null;
  code: string;              // Nội dung chuyển khoản
  content: string;
  transferType: string;      // in
  description: string;
  transferAmount: number;
  referenceCode: string;
  accumulated: number;
}

// Processing Logic:
// 1. Verify webhook signature
// 2. Parse "code" field → extract order_number
// 3. Verify transferAmount >= order.total
// 4. Update order: paymentStatus = PAID, paidAt = now()
// 5. Add OrderTimeline entry
// 6. Send notification (email, Zalo, Telegram)
// 7. Sync to Pancake POS
// 8. Return 200 OK
```

**SePay Configuration (CMS Settings):**

```json
// Settings group: "payment"
{
  "sepay": {
    "enabled": true,
    "api_key": "sk_xxx",
    "bank_name": "Vietcombank",
    "account_number": "0123456789",
    "account_holder": "NGUYEN VAN A",
    "template": "compact",
    "prefix": "PC",                    // Payment code prefix
    "timeout_minutes": 15,
    "qr_logo": "https://cdn.../logo.png"
  },
  "cod": {
    "enabled": true,
    "max_amount": 5000000,
    "note": "Thanh toán khi nhận hàng"
  }
}
```

---

### Module 5.7: Order Management & Pancake POS Sync

**Order Status Flow:**

```
PENDING ──▶ CONFIRMED ──▶ PROCESSING ──▶ SHIPPING ──▶ DELIVERED
   │            │              │             │
   └────────────┴──────────────┴─────────────┘
                        │
                    CANCELLED ──▶ REFUNDED
```

**Admin Order Management:**

| ID | Story | Priority |
|----|-------|----------|
| ORD-01 | Admin xem danh sách đơn hàng (filter, search) | 🔴 |
| ORD-02 | Admin xem chi tiết đơn hàng + timeline | 🔴 |
| ORD-03 | Admin cập nhật trạng thái đơn hàng | 🔴 |
| ORD-04 | Admin in phiếu giao hàng (PDF) | 🟡 |
| ORD-05 | Auto-sync đơn hàng lên Pancake POS | 🔴 |
| ORD-06 | Nhận webhook đơn hàng từ Pancake POS | 🔴 |
| ORD-07 | Customer xem lịch sử đơn hàng | 🔴 |
| ORD-08 | Customer theo dõi trạng thái đơn | 🔴 |
| ORD-09 | Customer hủy đơn (nếu PENDING) | 🟡 |
| ORD-10 | Notification khi đơn hàng thay đổi trạng thái | 🟡 |

**Pancake POS Sync Flow:**

```
===== PosCake → Pancake POS =====

1. Đơn hàng mới tạo trên PosCake
2. Background Job: POST /api/v1/orders to Pancake POS
   Payload: {
     customer_name, phone, email,
     shipping_address,
     items: [{ product_id, variant_id, quantity, price }],
     payment_method, total, note
   }
3. Nhận pancake_order_id → lưu vào order
4. Khi status thay đổi → PUT /api/v1/orders/:id to Pancake

===== Pancake POS → PosCake =====

1. Pancake gửi webhook khi đơn hàng thay đổi
2. POST /api/webhook/pancake
3. Verify webhook signature
4. Find order by pancake_order_id
5. Update status, tracking_number
6. Add OrderTimeline entry
7. Notify customer

===== Inventory Sync =====

1. Cron job mỗi 15 phút hoặc webhook
2. GET /api/v1/products from Pancake POS
3. So sánh stock_quantity
4. Update local database nếu khác
5. Log sync history
```

**Pancake POS Configuration:**

```json
// Settings group: "pancake"
{
  "enabled": true,
  "api_url": "https://pos.pancake.vn/api/v1",
  "api_key": "pk_xxx",
  "shop_id": "shop_xxx",
  "webhook_secret": "whsec_xxx",
  "sync_inventory": true,
  "sync_interval_minutes": 15,
  "auto_create_order": true,
  "default_warehouse_id": "wh_xxx"
}
```

---

### Module 5.8: Blog System

**User Stories:**

| ID | Story | Priority |
|----|-------|----------|
| BLOG-01 | Admin CRUD bài viết (Rich Text Editor) | 🔴 |
| BLOG-02 | Admin CRUD danh mục blog | 🔴 |
| BLOG-03 | Upload ảnh trong editor + featured image | 🔴 |
| BLOG-04 | Auto generate slug, reading time | 🔴 |
| BLOG-05 | Blog listing page (pagination, filter by category) | 🔴 |
| BLOG-06 | Blog detail page (TOC, share, related) | 🔴 |
| BLOG-07 | Draft / Published / Archived status | 🔴 |
| BLOG-08 | Schedule publish (publishedAt future date) | 🟡 |
| BLOG-09 | Tags system | 🟡 |
| BLOG-10 | Comments (with moderation) | 🟢 |
| BLOG-11 | View count tracking | 🟡 |
| BLOG-12 | SEO meta per post | 🔴 |

**Blog Detail Page Layout:**

```
Blog Detail
├── <Breadcrumbs />
├── Featured Image (full-width)
├── Layout 2 columns (8:4)
│   ├── Main Content
│   │   ├── Category badge
│   │   ├── Title (H1)
│   │   ├── Author | Date | Reading time | View count
│   │   ├── <ShareButtons /> (Facebook, Zalo, Twitter, Copy)
│   │   ├── <TableOfContents /> (auto-generate từ headings)
│   │   ├── Article Content (rendered markdown/HTML)
│   │   ├── Tags
│   │   ├── <ShareButtons /> (bottom)
│   │   ├── <AuthorBox /> (avatar, name, bio)
│   │   └── <Comments />
│   │
│   └── Sidebar
│       ├── Search blog
│       ├── Categories list
│       ├── Recent Posts
│       ├── Popular Posts
│       └── Newsletter signup
│
├── <RelatedPosts /> (same category)
│
└── Schema Markup: Article, BreadcrumbList
```

---

### Module 5.9: SEO Foundation

**Automatic SEO Features:**

```typescript
// Dynamic Metadata per page (Next.js generateMetadata)

// Product page
export async function generateMetadata({ params }) {
  const product = await getProduct(params.slug);
  return {
    title: product.metaTitle || `${product.name} | PosCake`,
    description: product.metaDescription || product.shortDesc,
    openGraph: {
      title: product.name,
      description: product.shortDesc,
      images: [product.images[0]?.url],
      type: 'product',
    },
    other: {
      'product:price:amount': product.salePrice || product.basePrice,
      'product:price:currency': 'VND',
    },
  };
}

// Schema Markup (JSON-LD)
// Product Schema
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "...",
  "image": ["..."],
  "description": "...",
  "sku": "...",
  "brand": { "@type": "Brand", "name": "..." },
  "offers": {
    "@type": "Offer",
    "price": "...",
    "priceCurrency": "VND",
    "availability": "https://schema.org/InStock",
    "seller": { "@type": "Organization", "name": "PosCake" }
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.5",
    "reviewCount": "28"
  }
}

// Breadcrumb Schema
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [...]
}

// Article Schema (Blog)
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "...",
  "author": { "@type": "Person", "name": "..." },
  "datePublished": "...",
  "image": "..."
}
```

**Technical SEO Checklist:**

```
✅ SSR/SSG for all public pages (Next.js)
✅ Dynamic sitemap.xml (/sitemap.xml)
   ├── Products sitemap
   ├── Categories sitemap
   ├── Blog posts sitemap
   └── Static pages sitemap
✅ robots.txt (configurable from CMS)
✅ Canonical URLs (auto)
✅ Breadcrumbs (UI + Schema)
✅ Open Graph + Twitter Cards
✅ Meta title/description per page
✅ Image alt text
✅ WebP auto-conversion
✅ Lazy loading images
✅ 301 Redirects manager
✅ Structured Data (JSON-LD)
✅ Mobile-friendly responsive
✅ Core Web Vitals optimization
✅ Clean URL slugs (Vietnamese diacritics handled)
```

---

## 6. PHASE 2 - ENGAGEMENT & MARKETING

### Module 6.1: Tracking Implementation

**GA4 E-commerce Events:**

```typescript
// lib/tracking.ts

// Utility class for all tracking events
class TrackingService {
  
  // ===== GA4 Events =====
  
  static viewItem(product: Product) {
    gtag('event', 'view_item', {
      currency: 'VND',
      value: product.salePrice || product.basePrice,
      items: [{
        item_id: product.sku,
        item_name: product.name,
        item_category: product.category?.name,
        item_brand: product.brand?.name,
        price: product.salePrice || product.basePrice,
        quantity: 1,
      }],
    });
  }
  
  static addToCart(product: Product, variant?: Variant, qty: number) {
    gtag('event', 'add_to_cart', {
      currency: 'VND',
      value: (variant?.price || product.basePrice) * qty,
      items: [{
        item_id: variant?.sku || product.sku,
        item_name: product.name,
        item_variant: variant?.name,
        price: variant?.price || product.basePrice,
        quantity: qty,
      }],
    });
  }
  
  static beginCheckout(cart: CartStore) {
    gtag('event', 'begin_checkout', {
      currency: 'VND',
      value: cart.subtotal,
      items: cart.items.map(item => ({
        item_id: item.sku,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
    });
  }
  
  static purchase(order: Order) {
    gtag('event', 'purchase', {
      transaction_id: order.orderNumber,
      currency: 'VND',
      value: order.total,
      shipping: order.shippingFee,
      tax: 0,
      items: order.items.map(item => ({
        item_id: item.sku,
        item_name: item.productName,
        price: item.price,
        quantity: item.quantity,
      })),
    });
  }

  // ===== Facebook Pixel Events =====
  
  static fbViewContent(product: Product) {
    fbq('track', 'ViewContent', {
      content_ids: [product.sku],
      content_type: 'product',
      content_name: product.name,
      content_category: product.category?.name,
      value: product.salePrice || product.basePrice,
      currency: 'VND',
    });
  }
  
  static fbAddToCart(product: Product, variant?: Variant, qty: number) {
    fbq('track', 'AddToCart', {
      content_ids: [variant?.sku || product.sku],
      content_type: 'product',
      content_name: product.name,
      value: (variant?.price || product.basePrice) * qty,
      currency: 'VND',
    });
  }
  
  static fbInitiateCheckout(cart: CartStore) {
    fbq('track', 'InitiateCheckout', {
      content_ids: cart.items.map(i => i.sku),
      content_type: 'product',
      num_items: cart.totalItems,
      value: cart.subtotal,
      currency: 'VND',
    });
  }
  
  static fbPurchase(order: Order) {
    fbq('track', 'Purchase', {
      content_ids: order.items.map(i => i.sku),
      content_type: 'product',
      num_items: order.items.length,
      value: order.total,
      currency: 'VND',
    });
  }

  // ===== TikTok Pixel Events =====
  
  static ttViewContent(product: Product) {
    ttq.track('ViewContent', {
      content_id: product.sku,
      content_name: product.name,
      content_type: 'product',
      value: product.salePrice || product.basePrice,
      currency: 'VND',
    });
  }
  
  // ... AddToCart, InitiateCheckout, Purchase similar pattern
}
```

**Server-Side Facebook Conversions API:**

```typescript
// Backend: POST events to Facebook for accurate tracking
// POST https://graph.facebook.com/v18.0/{pixel_id}/events

interface ServerEvent {
  event_name: string;
  event_time: number;
  action_source: 'website';
  user_data: {
    em?: string;      // hashed email
    ph?: string;      // hashed phone
    client_ip_address: string;
    client_user_agent: string;
    fbc?: string;     // fb click id
    fbp?: string;     // fb browser id
  };
  custom_data: {
    currency: 'VND';
    value: number;
    content_ids: string[];
    content_type: 'product';
  };
  event_source_url: string;
  event_id: string;  // deduplication with browser pixel
}
```

---

### Module 6.2: Customer Reviews

| ID | Story | Priority |
|----|-------|----------|
| REV-01 | Customer viết đánh giá (1-5 sao + text + ảnh) | 🔴 |
| REV-02 | Chỉ cho phép review nếu đã mua và giao hàng thành công | 🔴 |
| REV-03 | Admin duyệt/từ chối review | 🔴 |
| REV-04 | Admin trả lời review | 🟡 |
| REV-05 | Hiển thị rating summary trên product page | 🔴 |
| REV-06 | Filter reviews theo số sao | 🟡 |
| REV-07 | "Hữu ích" button (upvote review) | 🟢 |
| REV-08 | Email nhắc review sau khi nhận hàng | 🟡 |

---

### Module 6.3: Vouchers & Loyalty

**Voucher Types:**

```
1. PERCENTAGE  - Giảm X% (max discount cap)
2. FIXED_AMOUNT - Giảm X VND
3. FREE_SHIPPING - Miễn phí vận chuyển

Conditions:
- Min order amount
- Date range (start - end)
- Usage limit (total)
- Per user limit
- Specific products/categories (future)
```

**Loyalty Points System:**

```
Earn Points:
- Mua hàng: 1% giá trị đơn hàng = X điểm
- Viết review: +50 điểm
- Đăng ký tài khoản: +100 điểm
- Sinh nhật: +200 điểm

Redeem Points:
- 1000 điểm = 10,000 VND discount
- Đổi voucher

Tiers:
- Bạc: 0 - 999 điểm
- Vàng: 1000 - 4999 điểm (thêm 1.5x points)
- Kim cương: 5000+ điểm (thêm 2x points + free ship)

Expiry: Points expire after 12 months
```

---

### Module 6.4: Notifications

**Notification Events:**

```
Customer Notifications:
├── Xác nhận đơn hàng mới         → Email + Zalo
├── Thanh toán thành công          → Email + Zalo
├── Đơn hàng đang giao            → Email + Zalo + SMS
├── Đơn hàng đã giao              → Email + Zalo
├── Đơn hàng bị hủy               → Email + Zalo
├── Nhắc viết review (sau 3 ngày) → Email
├── Sinh nhật (voucher)            → Email + Zalo
├── Flash sale sắp diễn ra         → Email
├── Sản phẩm hết hàng → có hàng   → Email
└── Welcome email (đăng ký)        → Email

Admin Notifications:
├── Đơn hàng mới                   → Telegram Bot
├── Thanh toán SePay thành công     → Telegram Bot
├── Đơn hàng bị hủy               → Telegram Bot
├── Review mới cần duyệt          → Telegram Bot
├── Tồn kho thấp (<5 sản phẩm)   → Telegram Bot
└── Lỗi sync Pancake POS          → Telegram Bot
```

**Email Templates (Resend):**

```
email-templates/
├── order-confirmation.tsx    # React Email template
├── payment-success.tsx
├── shipping-update.tsx
├── delivery-confirmation.tsx
├── order-cancelled.tsx
├── review-reminder.tsx
├── welcome.tsx
├── password-reset.tsx
├── birthday-voucher.tsx
└── newsletter.tsx
```

---

## 7. PHASE 3 - ADVANCED & OPTIMIZATION

### Module 7.1: Flash Sale

```
Flash Sale Feature:
├── Admin: Create flash sale (name, start, end, products, prices, quantity)
├── Storefront: Countdown timer component
├── Real-time stock update (sold X / total Y)
├── Progress bar hiển thị % đã bán
├── Homepage section: Flash Sale widget
├── Auto disable khi hết giờ hoặc hết hàng
└── Cache invalidation khi flash sale start/end
```

### Module 7.2: Upsell & Cross-sell

```
Strategies:
├── Product Page:
│   ├── "Mua kèm giảm giá" (Bundle)
│   ├── "Khách hàng cũng mua" (Cross-sell based on order history)
│   └── "Nâng cấp lên" (Higher-tier variant)
│
├── Cart Page:
│   ├── "Mua thêm X để được free ship"
│   ├── Suggested add-ons
│   └── "Tiết kiệm X% khi mua combo"
│
└── Post-Purchase:
    └── Thank you page upsell offer
```

### Module 7.3: Analytics Dashboard (Admin)

```
Dashboard Widgets:
├── Revenue Chart (line - daily/weekly/monthly)
├── Orders Count (bar chart by status)
├── Top 10 Products (by revenue, by quantity)
├── Customer Stats (new vs returning)
├── Conversion Funnel (Visit → Cart → Checkout → Purchase)
├── Abandoned Cart Rate
├── Average Order Value (AOV)
├── Revenue by Category (pie chart)
├── Revenue by Payment Method
├── Geographic Distribution (by province)
├── Recent Orders (real-time feed)
└── Date Range Picker (filter tất cả widgets)

Data Source:
- Aggregate from orders, order_items tables
- Cache results in Redis (refresh mỗi 5 phút)
- Use Recharts for visualization
```

### Module 7.4: Shipping Integration

```
GHN (Giao Hàng Nhanh) API:
├── GET /master-data/province   → Danh sách tỉnh/thành
├── GET /master-data/district   → Danh sách quận/huyện
├── GET /master-data/ward       → Danh sách phường/xã
├── POST /v2/shipping-order/fee → Tính phí vận chuyển
├── POST /v2/shipping-order/create → Tạo đơn giao hàng
├── GET /v2/shipping-order/detail  → Chi tiết đơn
└── Webhook: Cập nhật trạng thái giao hàng

GHTK (Giao Hàng Tiết Kiệm) API:
├── POST /services/shipment/fee  → Tính phí
├── POST /services/shipment/order → Tạo đơn
├── GET /services/shipment/v2/:label → Tracking
└── Webhook: Cập nhật trạng thái

Address Picker Component:
├── Province select → auto load districts
├── District select → auto load wards
├── Ward select
├── Cache address data in Redis
└── Vietnamese address validation
```

### Module 7.5: AI Chatbot

```
AI Chatbot Flow:
├── Frontend: Chat bubble UI (bottom-right)
├── Greeting: "Xin chào! Tôi có thể giúp gì cho bạn?"
├── Capabilities:
│   ├── Tư vấn sản phẩm (search products, recommend)
│   ├── Tra cứu đơn hàng (by order number)
│   ├── Hỏi về chính sách (đổi trả, vận chuyển)
│   ├── Hỗ trợ kỹ thuật (hướng dẫn mua hàng)
│   └── Thu thập lead (tên, SĐT, nhu cầu)
│
├── Backend:
│   ├── Claude API integration
│   ├── System prompt + product context
│   ├── Function calling: searchProducts, getOrder, getPolicy
│   └── Fallback: "Để tôi chuyển bạn đến nhân viên hỗ trợ"
│
└── CMS Config:
    ├── On/Off toggle
    ├── System prompt editor
    ├── Greeting message
    ├── Available hours
    └── Max messages per session
```

---

## 8. API ENDPOINTS

### 8.1 Authentication

```
POST   /api/auth/register          - Đăng ký
POST   /api/auth/login             - Đăng nhập
POST   /api/auth/refresh           - Refresh token
POST   /api/auth/forgot-password   - Quên mật khẩu
POST   /api/auth/reset-password    - Reset mật khẩu
POST   /api/auth/google            - Login Google
POST   /api/auth/zalo              - Login Zalo
GET    /api/auth/me                - Thông tin user hiện tại
PUT    /api/auth/me                - Cập nhật profile
PUT    /api/auth/change-password   - Đổi mật khẩu
POST   /api/auth/logout            - Logout
```

### 8.2 Products (Public)

```
GET    /api/products               - Danh sách SP (filter, sort, paginate)
GET    /api/products/:slug         - Chi tiết SP theo slug
GET    /api/products/featured      - SP nổi bật
GET    /api/products/best-sellers  - SP bán chạy
GET    /api/products/new-arrivals  - SP mới
GET    /api/products/:id/reviews   - Reviews của SP
GET    /api/products/search?q=     - Tìm kiếm SP
GET    /api/categories             - Danh sách danh mục (tree)
GET    /api/categories/:slug       - SP theo danh mục
GET    /api/brands                 - Danh sách thương hiệu
```

### 8.3 Products (Admin)

```
POST   /api/admin/products               - Tạo SP
PUT    /api/admin/products/:id            - Cập nhật SP
DELETE /api/admin/products/:id            - Xóa SP
POST   /api/admin/products/:id/images     - Upload ảnh SP
DELETE /api/admin/products/:id/images/:imgId - Xóa ảnh
PUT    /api/admin/products/:id/images/reorder - Sắp xếp ảnh
POST   /api/admin/products/:id/variants   - Tạo variant
PUT    /api/admin/products/:id/variants/:vid - Cập nhật variant
DELETE /api/admin/products/:id/variants/:vid - Xóa variant
POST   /api/admin/products/import         - Import CSV
GET    /api/admin/products/export          - Export CSV
POST   /api/admin/categories              - Tạo danh mục
PUT    /api/admin/categories/:id          - Cập nhật danh mục
DELETE /api/admin/categories/:id          - Xóa danh mục
POST   /api/admin/brands                  - Tạo thương hiệu
PUT    /api/admin/brands/:id              - Cập nhật
DELETE /api/admin/brands/:id              - Xóa
```

### 8.4 Cart & Checkout

```
POST   /api/cart/validate          - Validate cart items (check stock, prices)
POST   /api/vouchers/apply         - Áp dụng mã giảm giá
POST   /api/checkout               - Tạo đơn hàng
GET    /api/checkout/:orderNumber/payment-status - Check payment status
```

### 8.5 Orders

```
GET    /api/orders                 - Lịch sử đơn hàng (Customer)
GET    /api/orders/:orderNumber    - Chi tiết đơn (Customer)
POST   /api/orders/:id/cancel      - Hủy đơn (Customer)
POST   /api/orders/:id/review      - Viết review (Customer)

GET    /api/admin/orders           - Tất cả đơn hàng (Admin, filter)
GET    /api/admin/orders/:id       - Chi tiết đơn (Admin)
PUT    /api/admin/orders/:id/status - Cập nhật trạng thái
POST   /api/admin/orders/:id/note  - Thêm ghi chú
GET    /api/admin/orders/:id/print  - In phiếu giao hàng
```

### 8.6 Blog

```
GET    /api/posts                  - Danh sách bài viết (public)
GET    /api/posts/:slug            - Chi tiết bài viết
GET    /api/posts/categories       - Danh mục blog
GET    /api/posts/:id/comments     - Comments

POST   /api/admin/posts            - Tạo bài viết
PUT    /api/admin/posts/:id        - Cập nhật
DELETE /api/admin/posts/:id        - Xóa
PUT    /api/admin/posts/:id/publish - Publish/Unpublish
GET    /api/admin/comments         - Tất cả comments
PUT    /api/admin/comments/:id/approve - Duyệt comment
DELETE /api/admin/comments/:id     - Xóa comment
```

### 8.7 CMS

```
GET    /api/admin/settings/:group           - Get settings by group
PUT    /api/admin/settings/:group           - Update settings group
GET    /api/admin/pages                     - Danh sách pages
POST   /api/admin/pages                     - Tạo page
PUT    /api/admin/pages/:id                 - Cập nhật
DELETE /api/admin/pages/:id                 - Xóa
GET    /api/admin/media                     - Media library
POST   /api/admin/media/upload              - Upload file(s)
DELETE /api/admin/media/:id                 - Xóa file
POST   /api/admin/banners                   - Tạo banner
PUT    /api/admin/banners/:id               - Cập nhật
DELETE /api/admin/banners/:id               - Xóa
PUT    /api/admin/banners/reorder           - Sắp xếp
PUT    /api/admin/menus/:position           - Cập nhật menu
GET    /api/admin/redirects                 - Danh sách redirects
POST   /api/admin/redirects                 - Tạo redirect
DELETE /api/admin/redirects/:id             - Xóa redirect
```

### 8.8 Marketing

```
GET    /api/admin/vouchers         - Danh sách vouchers
POST   /api/admin/vouchers         - Tạo voucher
PUT    /api/admin/vouchers/:id     - Cập nhật
DELETE /api/admin/vouchers/:id     - Xóa
GET    /api/admin/flash-sales      - Danh sách Flash Sales
POST   /api/admin/flash-sales      - Tạo Flash Sale
PUT    /api/admin/flash-sales/:id  - Cập nhật
DELETE /api/admin/flash-sales/:id  - Xóa

GET    /api/flash-sales/active     - Flash Sale đang diễn ra (public)
```

### 8.9 Customer Account

```
GET    /api/account/addresses      - Danh sách địa chỉ
POST   /api/account/addresses      - Thêm địa chỉ
PUT    /api/account/addresses/:id  - Cập nhật
DELETE /api/account/addresses/:id  - Xóa
GET    /api/account/wishlist       - Wishlist
POST   /api/account/wishlist/:productId  - Thêm wishlist
DELETE /api/account/wishlist/:productId  - Xóa wishlist
GET    /api/account/loyalty        - Loyalty points history
GET    /api/account/loyalty/balance - Số điểm hiện tại
```

### 8.10 Reviews (Admin)

```
GET    /api/admin/reviews          - Tất cả reviews (filter by status)
PUT    /api/admin/reviews/:id/approve  - Duyệt review
PUT    /api/admin/reviews/:id/reject   - Từ chối review
PUT    /api/admin/reviews/:id/reply    - Trả lời review
DELETE /api/admin/reviews/:id          - Xóa review
```

### 8.11 Shipping

```
GET    /api/shipping/provinces     - Danh sách tỉnh/thành
GET    /api/shipping/districts/:provinceId  - Quận/huyện
GET    /api/shipping/wards/:districtId      - Phường/xã
POST   /api/shipping/calculate-fee          - Tính phí vận chuyển
GET    /api/shipping/track/:trackingNumber  - Tra cứu vận đơn
```

### 8.12 Analytics (Admin)

```
GET    /api/admin/analytics/overview       - Tổng quan (revenue, orders, customers)
GET    /api/admin/analytics/revenue        - Doanh thu theo thời gian
GET    /api/admin/analytics/top-products   - SP bán chạy
GET    /api/admin/analytics/orders-by-status - Đơn hàng theo trạng thái
GET    /api/admin/analytics/customers      - Customer analytics
GET    /api/admin/analytics/conversion     - Conversion funnel
```

### 8.13 Webhooks (Inbound)

```
POST   /api/webhook/sepay          - SePay payment notification
POST   /api/webhook/pancake        - Pancake POS events
POST   /api/webhook/ghn            - GHN shipping status
POST   /api/webhook/ghtk           - GHTK shipping status
```

### 8.14 Public Pages & SEO

```
GET    /api/pages/:slug            - Nội dung static page
GET    /api/menus/:position        - Menu data
GET    /api/banners/:position      - Banners data
GET    /api/settings/public        - Public settings (logo, contact, social, etc.)

GET    /sitemap.xml                - Dynamic sitemap
GET    /robots.txt                 - Robots.txt
```

---

## 9. TÍCH HỢP BÊN THỨ 3

### 9.1 Tổng hợp API Keys cần thiết

```env
# .env.example

# ===== Database =====
DATABASE_URL=postgresql://user:pass@localhost:5432/poscake
REDIS_URL=redis://localhost:6379

# ===== Auth =====
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
ZALO_APP_ID=xxx
ZALO_APP_SECRET=xxx

# ===== SePay =====
SEPAY_API_KEY=sk_xxx
SEPAY_BANK_NAME=Vietcombank
SEPAY_ACCOUNT_NUMBER=0123456789
SEPAY_ACCOUNT_HOLDER=NGUYEN VAN A
SEPAY_WEBHOOK_SECRET=whsec_xxx

# ===== Pancake POS =====
PANCAKE_API_URL=https://pos.pancake.vn/api/v1
PANCAKE_API_KEY=pk_xxx
PANCAKE_SHOP_ID=shop_xxx
PANCAKE_WEBHOOK_SECRET=whsec_xxx

# ===== Shipping =====
GHN_TOKEN=xxx
GHN_SHOP_ID=xxx
GHTK_TOKEN=xxx

# ===== Storage =====
CF_R2_ACCESS_KEY=xxx
CF_R2_SECRET_KEY=xxx
CF_R2_BUCKET=poscake-media
CF_R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com
CF_R2_PUBLIC_URL=https://cdn.poscake.vn

# ===== Email =====
RESEND_API_KEY=re_xxx
EMAIL_FROM=noreply@poscake.vn

# ===== Notifications =====
TELEGRAM_BOT_TOKEN=xxx
TELEGRAM_CHAT_ID=xxx
ZALO_OA_ACCESS_TOKEN=xxx

# ===== Tracking =====
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
NEXT_PUBLIC_FB_PIXEL_ID=1234567890
FB_CONVERSIONS_API_TOKEN=EAAxxxxxx
NEXT_PUBLIC_TIKTOK_PIXEL_ID=xxx

# ===== AI Chatbot =====
ANTHROPIC_API_KEY=sk-ant-xxx

# ===== App =====
NEXT_PUBLIC_APP_URL=https://poscake.vn
NEXT_PUBLIC_API_URL=https://api.poscake.vn
NODE_ENV=production
```

---

## 10. UI/UX WIREFRAMES & USER FLOWS

### 10.1 Customer Purchase Flow

```
┌─────────┐    ┌──────────┐    ┌─────────────┐    ┌──────────┐
│ Homepage │───▶│ Category │───▶│   Product   │───▶│   Cart   │
│          │    │ Listing  │    │   Detail    │    │          │
└─────────┘    └──────────┘    └─────────────┘    └────┬─────┘
                                                       │
                    ┌──────────────────────────────────┘
                    ▼
             ┌─────────────┐     ┌──────────────┐
             │  Checkout   │────▶│  Payment     │
             │  (address,  │     │  (COD/SePay) │
             │  shipping)  │     └──────┬───────┘
             └─────────────┘            │
                                        ▼
                                 ┌──────────────┐
                    ┌────────────│  Confirmation │
                    │            │  (Thank you)  │
                    │            └──────────────┘
                    ▼
             ┌─────────────┐
             │  Order      │
             │  Tracking   │
             └─────────────┘
```

### 10.2 Admin CMS Flow

```
┌──────────────────────────────────────────────────────┐
│                    Admin Dashboard                    │
├──────────┬───────────┬──────────┬───────────────────┤
│          │           │          │                     │
▼          ▼           ▼          ▼                     ▼
Products  Orders      Blog      Marketing           Settings
├─ List   ├─ List    ├─ List   ├─ Vouchers          ├─ General
├─ Create ├─ Detail  ├─ Create ├─ Flash Sales       ├─ Tracking
├─ Edit   ├─ Status  ├─ Edit   ├─ Loyalty           ├─ Chat
├─ Variants│─ Print  ├─ Category│                    ├─ Contacts
├─ Images │          ├─ Comments│  Customers          ├─ Payment
├─ Category│          │         ├─ List              ├─ Shipping
└─ Brands │  Reviews │  Pages   ├─ Detail            ├─ SEO
          │  ├─ List │  ├─ List ├─ Addresses         ├─ Appearance
          │  ├─ Approve├─ Create│                    └─ Advanced
          │  └─ Reply └─ Edit  │  Analytics
          │                    │  ├─ Revenue
          │  Media             │  ├─ Top Products
          │  ├─ Library        │  ├─ Customers
          │  └─ Upload         │  └─ Conversion
          │
          │  Menus
          │  ├─ Header
          │  ├─ Footer
          │  └─ Mobile
          │
          │  Redirects
          │  └─ Manage
```

### 10.3 Responsive Breakpoints

```
Mobile:    < 640px   (sm)  - 1 column product grid, hamburger menu
Tablet:    640-1024px (md) - 2 column grid, collapsible sidebar
Desktop:   > 1024px  (lg)  - 3-4 column grid, full mega menu
```

---

## 11. BẢO MẬT & PERFORMANCE

### 11.1 Security Checklist

```
Authentication:
☐ bcrypt password hashing (salt rounds: 12)
☐ JWT with short expiry (15min access, 7d refresh)
☐ httpOnly secure cookies for refresh token
☐ CSRF protection
☐ Rate limiting (login: 5/15min, API: 100/min)

Input Validation:
☐ Zod schema validation on all endpoints
☐ SQL injection prevention (Prisma parameterized queries)
☐ XSS prevention (sanitize HTML input, CSP headers)
☐ File upload validation (type, size, dimensions)

Infrastructure:
☐ HTTPS everywhere (Let's Encrypt)
☐ CORS configuration (whitelist domains)
☐ Helmet.js security headers
☐ Environment variables (never commit .env)
☐ Webhook signature verification (SePay, Pancake, GHN)

Data:
☐ Database backups (daily automated)
☐ Audit log for admin actions
☐ PII handling compliance
☐ Soft delete for critical data
```

### 11.2 Performance Optimization

```
Frontend:
☐ Next.js SSG for product pages (ISR revalidate: 60s)
☐ SSR for dynamic pages (cart, checkout, account)
☐ Image optimization (next/image, WebP, lazy load)
☐ Code splitting (dynamic imports)
☐ Prefetch critical routes
☐ Bundle analysis & tree shaking
☐ Service Worker for offline (PWA)

Backend:
☐ Redis caching (products, categories, settings, menus)
☐ Database query optimization (indexes, eager loading)
☐ Pagination (cursor-based for large datasets)
☐ Response compression (gzip/brotli)
☐ BullMQ for async jobs (email, sync, notifications)
☐ Connection pooling (Prisma)

CDN & Assets:
☐ Cloudflare CDN for static assets
☐ Cloudflare R2 for media files
☐ Cache headers (immutable for hashed assets)
☐ WebP auto-conversion on upload

Monitoring:
☐ Error tracking (Sentry)
☐ Uptime monitoring
☐ Core Web Vitals monitoring
☐ API response time logging
```

---

## 12. DEPLOYMENT & DEVOPS

### 12.1 Docker Setup

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: poscake
      POSTGRES_USER: poscake_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    environment:
      - DATABASE_URL=postgresql://poscake_user:${DB_PASSWORD}@postgres:5432/poscake
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
    depends_on:
      - postgres
      - redis
    ports:
      - "4000:4000"

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    environment:
      - NEXT_PUBLIC_API_URL=http://api:4000
    depends_on:
      - api
    ports:
      - "3000:3000"

  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - web
      - api
    ports:
      - "80:80"
      - "443:443"

volumes:
  postgres_data:
  redis_data:
```

### 12.2 CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to VPS
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /opt/poscake
            git pull origin main
            docker compose -f docker-compose.prod.yml up -d --build
            docker compose exec api npx prisma migrate deploy
```

---

## 13. TIMELINE & MILESTONES

### Phase 1 - MVP Core (Tuần 1-10)

```
Tuần 1-2: Foundation
├── Project setup (monorepo, Docker, CI/CD)
├── Database schema + Prisma setup + seed data
├── Auth module (register, login, JWT, guards)
├── Admin layout + sidebar navigation
└── Basic storefront layout (header, footer)

Tuần 3-4: CMS & Products
├── CMS Settings module (all groups)
├── Media Library (upload, browse, delete)
├── Product CRUD (full form with variants, images)
├── Category CRUD (nested tree)
├── Brand CRUD
└── Product listing admin (DataTable, filter, search)

Tuần 5-6: Storefront UI
├── Homepage (all sections, dynamic from CMS)
├── Product listing page (filter, sort, pagination)
├── Product detail page (gallery, tabs, variants)
├── Search functionality
├── Breadcrumbs, SEO meta, Schema markup
└── Responsive design (mobile, tablet, desktop)

Tuần 7-8: Cart, Checkout, Payment
├── Cart (add, remove, update, persist)
├── Checkout form (address, shipping, payment)
├── SePay QR integration
├── SePay webhook handler
├── Order creation flow
├── Order confirmation page
└── Customer account (orders, profile)

Tuần 9-10: Blog & POS Sync
├── Blog CRUD (admin)
├── Blog listing & detail (storefront)
├── Pancake POS sync (orders)
├── Pancake POS sync (inventory)
├── Pancake webhooks
├── Sitemap, robots.txt
├── Testing & bug fixes
└── Deploy MVP to production
```

### Phase 2 - Engagement (Tuần 11-16)

```
Tuần 11-12: Tracking & Widgets
├── GA4 implementation (all e-commerce events)
├── Facebook Pixel (browser + Conversions API)
├── TikTok Pixel
├── Google Tag Manager setup
├── Chat widget integration (Zalo, Messenger, Tawk.to)
├── Floating contacts (configurable from CMS)
└── Back to top + Floating cart

Tuần 13-14: Reviews & Loyalty
├── Review system (submit, moderate, display)
├── Rating summary on product page
├── Voucher system (CRUD, apply at checkout)
├── Loyalty points (earn, redeem)
├── Membership tiers
└── Email templates (order confirmation, etc.)

Tuần 15-16: Notifications & Polish
├── Email notifications (Resend)
├── Telegram Bot notifications (admin)
├── Zalo OA notifications
├── Newsletter subscription
├── Static pages (policies, about, contact)
├── Performance optimization
└── Security audit
```

### Phase 3 - Advanced (Tuần 17-22)

```
Tuần 17-18: Marketing
├── Flash Sale (CRUD, countdown, homepage widget)
├── Upsell/Cross-sell components
├── Abandoned cart recovery
├── Bundle/Combo products
└── Referral/Affiliate basic

Tuần 19-20: Analytics & Shipping
├── Admin dashboard (revenue, orders, products charts)
├── Customer analytics (RFM)
├── Conversion funnel
├── GHN integration (fee, create order, tracking)
├── GHTK integration
└── Address picker with shipping fee calculation

Tuần 21-22: AI & Optimization
├── AI Chatbot (Claude API, product search, FAQ)
├── Search optimization (Meilisearch hoặc PG full-text)
├── PWA setup
├── Core Web Vitals optimization
├── Load testing & scaling
├── Documentation
└── Final QA & Launch
```

---

## APPENDIX

### A. Vietnamese-Specific Considerations

```
1. Currency: VND (no decimals) - Decimal(12,0) in DB
2. Phone format: 0XXXXXXXXX (10 digits)
3. Address hierarchy: Province → District → Ward → Address
4. Popular banks: Vietcombank, MB Bank, Techcombank, ACB
5. Payment culture: COD still dominant (~60%), QR growing fast
6. Social channels: Zalo > Facebook > TikTok
7. SEO: Vietnamese diacritics in slugs (convert to ASCII)
8. Timezone: Asia/Ho_Chi_Minh (UTC+7)
9. Business registration: Bộ Công Thương badge required
10. Popular shipping: GHN, GHTK, Viettel Post, J&T
```

### B. Admin Role Permissions Matrix

```
Feature              │ Admin │ Staff │ Customer │ Guest
─────────────────────┼───────┼───────┼──────────┼──────
Dashboard            │  ✅   │  ✅   │    ❌    │  ❌
Product CRUD         │  ✅   │  ✅   │    ❌    │  ❌
Order Management     │  ✅   │  ✅   │    ❌    │  ❌
Customer Management  │  ✅   │  👁️   │    ❌    │  ❌
Blog CRUD            │  ✅   │  ✅   │    ❌    │  ❌
CMS Settings         │  ✅   │  ❌   │    ❌    │  ❌
Marketing            │  ✅   │  ❌   │    ❌    │  ❌
Analytics            │  ✅   │  👁️   │    ❌    │  ❌
Staff Management     │  ✅   │  ❌   │    ❌    │  ❌
Browse Products      │  ✅   │  ✅   │    ✅    │  ✅
Add to Cart          │  ✅   │  ✅   │    ✅    │  ✅
Checkout             │  ✅   │  ✅   │    ✅    │  ✅
View Orders (own)    │  ✅   │  ✅   │    ✅    │  ❌
Write Reviews        │  ✅   │  ✅   │    ✅    │  ❌
Wishlist             │  ✅   │  ✅   │    ✅    │  ❌
Account Settings     │  ✅   │  ✅   │    ✅    │  ❌

👁️ = View only
```

---

**END OF DOCUMENT**

*Tài liệu này là living document, sẽ được cập nhật theo tiến độ phát triển.*
