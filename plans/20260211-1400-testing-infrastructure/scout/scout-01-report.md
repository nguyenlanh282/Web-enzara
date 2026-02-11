# Scout Report - Testing Infrastructure

## API Layer (apps/api/)

### Services (28 total)
| Service | Path |
|---------|------|
| AuthService | `apps/api/src/modules/auth/auth.service.ts` |
| OrdersService | `apps/api/src/modules/orders/orders.service.ts` |
| PaymentsService | `apps/api/src/modules/payments/payments.service.ts` |
| SepayService | `apps/api/src/modules/payments/sepay/sepay.service.ts` |
| ProductsService | `apps/api/src/modules/products/products.service.ts` |
| CategoriesService | `apps/api/src/modules/products/categories.service.ts` |
| BrandsService | `apps/api/src/modules/products/brands.service.ts` |
| VouchersService | `apps/api/src/modules/marketing/vouchers.service.ts` |
| FlashSalesService | `apps/api/src/modules/marketing/flash-sales.service.ts` |
| LoyaltyService | `apps/api/src/modules/loyalty/loyalty.service.ts` |
| ReviewsService | `apps/api/src/modules/reviews/reviews.service.ts` |
| WishlistService | `apps/api/src/modules/wishlist/wishlist.service.ts` |
| GhnShippingService | `apps/api/src/modules/shipping/ghn.service.ts` |
| EmailService | `apps/api/src/modules/notifications/email.service.ts` |
| NotificationsService | `apps/api/src/modules/notifications/notifications.service.ts` |
| TelegramService | `apps/api/src/modules/notifications/telegram.service.ts` |
| AdminNotificationsService | `apps/api/src/modules/notifications/admin-notifications.service.ts` |
| PostsService | `apps/api/src/modules/blog/posts.service.ts` |
| CommentsService | `apps/api/src/modules/blog/comments.service.ts` |
| AnalyticsService | `apps/api/src/modules/analytics/analytics.service.ts` |
| PancakeService | `apps/api/src/modules/pancake/pancake.service.ts` |
| SettingsService | `apps/api/src/modules/cms/settings.service.ts` |
| PagesService | `apps/api/src/modules/cms/pages.service.ts` |
| MenusService | `apps/api/src/modules/cms/menus.service.ts` |
| BannersService | `apps/api/src/modules/cms/banners.service.ts` |
| MediaService | `apps/api/src/modules/cms/media.service.ts` |
| RedirectsService | `apps/api/src/modules/cms/redirects.service.ts` |
| AdminCustomersService | `apps/api/src/modules/admin-customers/admin-customers.service.ts` |

### Controllers (36 total)
Key controllers for integration testing:
- `auth.controller.ts` - Login, register, verify
- `orders.controller.ts` + `orders-public.controller.ts` - Order CRUD
- `products.controller.ts` + `products-public.controller.ts` - Product CRUD
- `sepay-webhook.controller.ts` - Payment webhook
- `shipping.controller.ts` - GHN shipping
- `vouchers.controller.ts` - Voucher validation

### Shared Providers
- `apps/api/src/common/services/prisma.service.ts` - PrismaService (extends PrismaClient)
- `apps/api/src/common/services/cache.service.ts` - CacheService
- `apps/api/src/common/services/cache-invalidation.service.ts` - CacheInvalidationService
- `apps/api/src/common/filters/http-exception.filter.ts` - AllExceptionsFilter
- `apps/api/src/common/interceptors/http-cache.interceptor.ts` - HttpCacheInterceptor
- `apps/api/src/common/cache.module.ts` - CacheModule
- `apps/api/src/modules/auth/guards/jwt-auth.guard.ts` - JwtAuthGuard
- `apps/api/src/modules/auth/guards/roles.guard.ts` - RolesGuard

### App Module
- 19 feature modules imported
- Global providers: PrismaService, ThrottlerGuard

---

## Web Layer (apps/web/)

### Zustand Stores (4 total)
- `stores/cartStore.ts` - useCartStore (persist, selectSubtotal, selectTotalItems, selectTotal)
- `stores/authStore.ts` - useAuthStore (User, AuthState, AuthActions)
- `stores/toastStore.ts` - useToastStore
- `stores/recentlyViewedStore.ts` - useRecentlyViewedStore (persist)

### Key Components
- `components/storefront/header/Header.tsx`
- `components/storefront/header/CartIconWithBadge.tsx`
- `components/storefront/header/SearchModal.tsx`
- `components/storefront/header/LanguageSwitcher.tsx`
- `components/storefront/product/ProductCard.tsx`
- `components/storefront/checkout/PaymentMethodSelector.tsx`
- `components/storefront/checkout/SepayQR.tsx`
- `components/storefront/checkout/LoyaltyRedemption.tsx`
- `components/storefront/checkout/VoucherInput.tsx`
- `components/storefront/checkout/OrderSummary.tsx`
- `components/storefront/checkout/ShippingForm.tsx`

### Utility Files
- `lib/utils.ts` - cn() class merger
- `lib/api.ts` - apiClient REST client, ApiError
- `lib/api-server.ts` - fetchAPI server-side, settingsToRecord
- `lib/seo.ts` - generatePageMetadata, JSON-LD helpers
- `lib/tracking.ts` - TrackingService (GA4, FB Pixel, TikTok)

### Path Aliases
- `@/*` → `./src/*`

---

## Shared Packages

### packages/utils
- `src/currency.ts` - formatVND, formatVNDCompact
- `src/slug.ts` - generateSlug (Vietnamese text)

### packages/types
- `src/index.ts` - ApiResponse, PaginatedResponse, ProductListItem, CartItem, CartState

### packages/ui
- `src/index.ts` - cn() function

---

## Config Files

### turbo.json
- Pipeline: build, dev, lint, clean, db:generate, db:push
- **No test pipeline configured**

### CI (.github/workflows/ci.yml)
- Triggers: push/PR to main
- Node 22, pnpm@9, ubuntu-latest
- Steps: checkout, setup, install, lint, build
- **No test step**

### TSConfig
- Web: target ES2017, jsx preserve, moduleResolution bundler
- API: target ES2021, module commonjs, decorators enabled
- No root tsconfig.base.json

---

## Current State
- **0 test files** in entire codebase
- **0 test configs** (no vitest/jest/playwright configs)
- **@nestjs/testing ^10.4.0** already in API devDeps
- Empty `apps/api/test/` directory exists
