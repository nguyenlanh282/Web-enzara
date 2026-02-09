# Phase 02 - Authentication & CMS Foundation

## Context Links

- [Master Plan](./plan.md)
- [Previous: Project Setup](./phase-01-project-setup.md)
- [Next: Products & Storefront](./phase-03-products-and-storefront.md)
- [PRD Module 5.1: Auth](../Web-enzara-prd.md)
- [PRD Module 5.2: CMS](../Web-enzara-prd.md)

## Overview

| Field | Value |
|-------|-------|
| **Date** | 2026-02-08 |
| **Priority** | Critical |
| **Status** | Pending |
| **Estimated** | 1.5 weeks |
| **Depends on** | Phase 01 (Project Setup) |
| **Blocks** | Phase 03 (Products), Phase 04 (Cart/Checkout) |

## Key Insights

- JWT auth with access token (15min) in memory + refresh token (7d) in httpOnly cookie
- Three roles: ADMIN, STAFF, CUSTOMER -- RBAC via NestJS guards
- CMS uses key-value `Setting` model grouped by function (general, tracking, chat, contacts, seo, appearance)
- Media Library uploads to Cloudflare R2 with Sharp for WebP conversion
- Static Pages use Tiptap rich-text editor stored as HTML
- Admin layout: collapsible sidebar with role-based menu items

## Requirements

### Authentication (AUTH)
- AUTH-01: Admin login with email/password (Critical)
- AUTH-02: Customer register/login with email (Critical)
- AUTH-05: Forgot password / reset flow (Critical)
- AUTH-06: Auto refresh token via interceptor (Critical)
- AUTH-03: Google OAuth login (Medium -- defer if needed)
- AUTH-07: RBAC staff permissions (Medium)

### CMS (CMS)
- CMS-04: Settings CRUD for all groups (Critical)
- CMS-03: Media Library -- upload, browse, delete (Critical)
- CMS-02: Static Pages CRUD with WYSIWYG (Critical)
- CMS-01: Banner CRUD (Critical)
- CMS-05: Menu management (Critical)
- CMS-06: 301 Redirects management (Medium)

## Architecture

### Auth Flow

```
Login Request
  POST /api/auth/login { email, password }
    |
    v
  Validate credentials (bcrypt compare)
    |
    v
  Generate JWT pair:
    - accessToken (15min) -> returned in response body
    - refreshToken (7d) -> set as httpOnly secure cookie
    |
    v
  Client stores accessToken in Zustand (memory only)
    |
    v
  On 401 -> POST /api/auth/refresh (cookie sent auto)
    -> New accessToken returned
    -> Retry original request
```

### Auth Module Structure (NestJS)

```
apps/api/src/modules/auth/
├── auth.module.ts
├── auth.controller.ts          # login, register, refresh, logout, forgot-password
├── auth.service.ts             # business logic
├── guards/
│   ├── jwt-auth.guard.ts       # validates accessToken
│   └── roles.guard.ts          # checks user role
├── strategies/
│   └── jwt.strategy.ts         # Passport JWT strategy
├── decorators/
│   ├── current-user.decorator.ts   # @CurrentUser() param decorator
│   └── roles.decorator.ts         # @Roles(UserRole.ADMIN)
└── dto/
    ├── login.dto.ts
    ├── register.dto.ts
    ├── forgot-password.dto.ts
    └── reset-password.dto.ts
```

### CMS Module Structure (NestJS)

```
apps/api/src/modules/cms/
├── cms.module.ts
├── settings.controller.ts      # GET/PUT /api/settings/:group
├── settings.service.ts
├── pages.controller.ts         # CRUD /api/pages
├── pages.service.ts
├── media.controller.ts         # POST upload, GET list, DELETE
├── media.service.ts            # R2 upload + Sharp processing
├── banners.controller.ts       # CRUD /api/banners
├── banners.service.ts
├── menus.controller.ts         # CRUD /api/menus
├── menus.service.ts
├── redirects.controller.ts     # CRUD /api/redirects
└── redirects.service.ts
```

### Admin Frontend Structure

```
apps/web/src/
├── app/admin/
│   ├── layout.tsx              # Admin shell (sidebar + header + auth guard)
│   ├── dashboard/page.tsx      # Dashboard placeholder
│   ├── settings/
│   │   ├── general/page.tsx    # Site name, logo, contact, social
│   │   ├── payment/page.tsx    # SePay config, COD settings
│   │   ├── seo/page.tsx        # Default SEO, schema, robots
│   │   ├── appearance/page.tsx # Announcement bar, homepage sections, footer
│   │   ├── tracking/page.tsx   # GA4, Pixel, GTM, custom scripts
│   │   ├── chat/page.tsx       # Zalo, Messenger, Tawk.to
│   │   └── contacts/page.tsx   # Floating contacts config
│   ├── pages/
│   │   ├── page.tsx            # Page listing
│   │   └── [id]/page.tsx       # Page editor (Tiptap)
│   ├── media/page.tsx          # Media library grid
│   ├── banners/
│   │   ├── page.tsx            # Banner listing
│   │   └── [id]/page.tsx       # Banner form
│   └── menus/page.tsx          # Menu builder (drag-drop nested)
│
├── components/admin/
│   ├── layout/
│   │   ├── AdminSidebar.tsx    # Collapsible sidebar with nav groups
│   │   ├── AdminHeader.tsx     # Top bar with user menu
│   │   └── AdminLayout.tsx     # Wrapper component
│   └── shared/
│       ├── DataTable.tsx       # Reusable table with sorting/filtering
│       ├── RichTextEditor.tsx  # Tiptap wrapper
│       ├── MediaPicker.tsx     # Modal to pick from Media Library
│       ├── ImageUpload.tsx     # Drag-drop upload component
│       └── FormBuilder.tsx     # Dynamic form from config
│
├── lib/
│   ├── api.ts                  # Axios/fetch wrapper with auth interceptor
│   └── auth.ts                 # Token management utilities
│
├── stores/
│   └── authStore.ts            # Zustand: user, accessToken, login/logout
│
└── hooks/
    └── useAuth.ts              # Auth hook wrapping authStore
```

## Related Code Files

### Backend (NestJS)
- `apps/api/src/modules/auth/auth.controller.ts`
- `apps/api/src/modules/auth/auth.service.ts`
- `apps/api/src/modules/auth/guards/jwt-auth.guard.ts`
- `apps/api/src/modules/auth/guards/roles.guard.ts`
- `apps/api/src/modules/auth/strategies/jwt.strategy.ts`
- `apps/api/src/modules/cms/settings.controller.ts`
- `apps/api/src/modules/cms/media.controller.ts`
- `apps/api/src/modules/cms/media.service.ts`
- `apps/api/src/modules/cms/pages.controller.ts`

### Frontend (Next.js)
- `apps/web/src/app/admin/layout.tsx`
- `apps/web/src/stores/authStore.ts`
- `apps/web/src/lib/api.ts`
- `apps/web/src/components/admin/layout/AdminSidebar.tsx`
- `apps/web/src/components/admin/shared/RichTextEditor.tsx`
- `apps/web/src/components/admin/shared/MediaPicker.tsx`

## Implementation Steps

### 1. Build Auth Backend (NestJS)

**1.1 Create JWT strategy:**

```typescript
// apps/api/src/modules/auth/strategies/jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: { sub: string; role: UserRole }) {
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) throw new UnauthorizedException();
    return { id: user.id, email: user.email, role: user.role };
  }
}
```

**1.2 Create auth service with login, register, refresh, forgot-password:**

- `login()`: validate email/password with bcrypt, generate token pair
- `register()`: create user with CUSTOMER role, hash password, send verification email
- `refreshToken()`: validate refresh token from cookie, issue new access token
- `forgotPassword()`: generate reset token, send email via Resend
- `resetPassword()`: validate reset token, update password

**1.3 Auth controller endpoints:**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | Public | Login, return accessToken + set refreshToken cookie |
| POST | `/api/auth/register` | Public | Register customer account |
| POST | `/api/auth/refresh` | Cookie | Refresh accessToken |
| POST | `/api/auth/logout` | JWT | Clear refreshToken cookie |
| POST | `/api/auth/forgot-password` | Public | Send reset email |
| POST | `/api/auth/reset-password` | Public | Reset with token |
| GET | `/api/auth/me` | JWT | Get current user profile |

**1.4 Guards and decorators:**

```typescript
// RolesGuard -- checks @Roles() decorator against user.role
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<UserRole[]>("roles", context.getHandler());
    if (!roles) return true;
    const { user } = context.switchToHttp().getRequest();
    return roles.includes(user.role);
  }
}

// Usage in controllers:
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.STAFF)
```

**1.5 Rate limiting:**

```typescript
// 5 login attempts per 15 minutes per IP
@Throttle({ default: { ttl: 900000, limit: 5 } })
@Post("login")
async login(@Body() dto: LoginDto) { ... }
```

### 2. Build Auth Frontend

**2.1 Create authStore (Zustand):**

```typescript
// apps/web/src/stores/authStore.ts
interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<string | null>;
  setUser: (user: User | null) => void;
}
```

**2.2 Create API client with auto-refresh interceptor:**

```typescript
// apps/web/src/lib/api.ts
// Axios instance with:
// - baseURL from NEXT_PUBLIC_API_URL
// - Request interceptor: attach Bearer token from authStore
// - Response interceptor: on 401, call refreshToken(), retry request
// - Prevent infinite refresh loops with isRefreshing flag
```

**2.3 Create login/register pages:**

- `apps/web/src/app/(storefront)/auth/login/page.tsx`
- `apps/web/src/app/(storefront)/auth/register/page.tsx`
- `apps/web/src/app/(storefront)/auth/forgot-password/page.tsx`
- `apps/web/src/app/admin/login/page.tsx` -- admin-specific login

Forms use React Hook Form + Zod for validation.

### 3. Build Admin Layout

**3.1 Admin sidebar navigation:**

```typescript
// Sidebar nav items grouped by section
const adminNav = [
  {
    label: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard",
  },
  {
    label: "San pham", icon: Package,
    children: [
      { label: "Tat ca san pham", href: "/admin/products" },
      { label: "Danh muc", href: "/admin/categories" },
      { label: "Thuong hieu", href: "/admin/brands" },
    ],
  },
  {
    label: "Don hang", icon: ShoppingCart, href: "/admin/orders",
  },
  {
    label: "Blog", icon: FileText,
    children: [
      { label: "Bai viet", href: "/admin/blog" },
      { label: "Danh muc blog", href: "/admin/blog/categories" },
    ],
  },
  {
    label: "Noi dung", icon: Layers,
    children: [
      { label: "Trang tinh", href: "/admin/pages" },
      { label: "Banner", href: "/admin/banners" },
      { label: "Menu", href: "/admin/menus" },
      { label: "Media", href: "/admin/media" },
    ],
  },
  {
    label: "Cai dat", icon: Settings,
    children: [
      { label: "Chung", href: "/admin/settings/general" },
      { label: "Thanh toan", href: "/admin/settings/payment" },
      { label: "SEO", href: "/admin/settings/seo" },
      { label: "Giao dien", href: "/admin/settings/appearance" },
    ],
  },
];
```

**3.2 Admin layout with auth guard:**

```tsx
// apps/web/src/app/admin/layout.tsx
// - Check auth on mount, redirect to /admin/login if not authenticated
// - Check role is ADMIN or STAFF
// - Render AdminSidebar + AdminHeader + children
// - TanStack QueryClientProvider for admin queries
```

### 4. Build CMS Settings Backend

**4.1 Settings endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/settings/:group` | Get all settings for a group |
| PUT | `/api/settings/:group` | Upsert settings for a group |

Settings groups: `general`, `tracking`, `chat`, `contacts`, `seo`, `appearance`, `payment`, `pancake`.

**4.2 Settings service:**

```typescript
// Upsert pattern: for each key in the payload,
// upsert Setting { group, key, value }
async updateGroup(group: string, data: Record<string, any>) {
  const operations = Object.entries(data).map(([key, value]) =>
    this.prisma.setting.upsert({
      where: { group_key: { group, key } },
      update: { value: value as any },
      create: { group, key, value: value as any },
    })
  );
  await this.prisma.$transaction(operations);
}
```

### 5. Build Media Library

**5.1 Media upload endpoint:**

```typescript
// POST /api/media/upload (multipart/form-data)
// 1. Receive file via Multer
// 2. Process with Sharp: resize, convert to WebP, generate thumbnail
// 3. Upload original + WebP + thumbnail to Cloudflare R2
// 4. Save Media record in DB (filename, url, mimeType, size, width, height)
// 5. Return Media object with public URL
```

**5.2 R2 storage service:**

```typescript
// apps/api/src/modules/cms/storage.service.ts
// Uses @aws-sdk/client-s3 with R2-compatible endpoint
// Methods: upload(buffer, key, contentType), delete(key), getSignedUrl(key)
```

**5.3 Media Library frontend:**

- Grid view of uploaded media with lazy loading
- Drag-and-drop upload zone
- Folder organization (general, products, blog, banners)
- Delete with confirmation
- MediaPicker modal for use in other forms (select image from library)

### 6. Build Static Pages CRUD

**6.1 Pages backend:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pages` | List all pages (admin) |
| GET | `/api/pages/:slug` | Get page by slug (public) |
| POST | `/api/pages` | Create page |
| PUT | `/api/pages/:id` | Update page |
| DELETE | `/api/pages/:id` | Delete page |

**6.2 Page editor frontend:**

- Form fields: title, slug (auto-generated from title), metaTitle, metaDescription
- Tiptap rich-text editor for content body
- isActive toggle
- Preview button opens page in new tab

### 7. Build Banner CRUD

**7.1 Banner management:**

- Desktop + mobile image upload (separate fields)
- Link URL, position (hero/sidebar/popup), sort order
- Active/inactive toggle
- Date range scheduling (startDate, endDate)
- Drag-and-drop reordering

### 8. Build Menu Management

**8.1 Menu builder:**

- Nested drag-and-drop tree for menu items
- Each item: label, URL/page-link, open-in-new-tab toggle
- Positions: header, footer, mobile
- Items stored as JSON array in Menu model

### 9. Build Settings UI Pages

Create admin settings forms for each group:
- General: site name, description, logo upload, contact info, social links
- Payment: SePay config (API key, bank details, QR settings), COD settings
- SEO: default meta tags, OG image, robots.txt, Google verification
- Appearance: announcement bar config, homepage section ordering, footer columns

Each settings page loads current values on mount, submits via `PUT /api/settings/:group`.

### 10. Build Shared Admin Components

- `DataTable` -- uses TanStack Table with sorting, filtering, pagination
- `RichTextEditor` -- Tiptap with toolbar (bold, italic, headings, lists, links, images)
- `ImageUpload` -- drag-drop zone, preview, progress bar
- `MediaPicker` -- modal wrapping Media Library for selecting existing images

## Todo List

- [ ] Create JWT strategy for Passport.js
- [ ] Implement auth service (login, register, refresh, forgot/reset password)
- [ ] Create auth controller with all endpoints
- [ ] Implement JwtAuthGuard and RolesGuard
- [ ] Add rate limiting to login endpoint
- [ ] Create Zustand authStore with token management
- [ ] Build API client with auto-refresh interceptor
- [ ] Create login page (storefront + admin)
- [ ] Create register page (storefront)
- [ ] Create forgot/reset password pages
- [ ] Build AdminSidebar component with nav groups
- [ ] Build AdminHeader component with user menu
- [ ] Build admin layout.tsx with auth guard
- [ ] Implement settings service (get/upsert by group)
- [ ] Create settings controller
- [ ] Build settings UI for general, payment, SEO, appearance
- [ ] Implement R2 storage service for media uploads
- [ ] Implement media service with Sharp processing
- [ ] Build Media Library page (grid, upload, delete)
- [ ] Build MediaPicker modal component
- [ ] Implement pages CRUD backend
- [ ] Build page editor with Tiptap
- [ ] Implement banner CRUD backend
- [ ] Build banner management UI
- [ ] Implement menu CRUD backend
- [ ] Build menu builder with nested drag-drop
- [ ] Build DataTable shared component
- [ ] Build RichTextEditor (Tiptap wrapper)
- [ ] Build ImageUpload component

## Success Criteria

1. Admin can log in at `/admin/login` and see the dashboard
2. Customer can register and log in at `/auth/login`
3. Token auto-refresh works -- user stays logged in across page reloads
4. Unauthorized users redirected away from `/admin/*` routes
5. Admin can update all settings groups and see changes reflected
6. Media Library: upload images, view grid, select via MediaPicker
7. Static pages: create, edit with rich text, view on storefront at `/pages/:slug`
8. Banners: CRUD with image upload and scheduling
9. Menus: build nested menu trees, save and retrieve

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Refresh token race condition (multiple tabs) | Medium | Queue refresh requests, use single refresh promise |
| R2 upload timeout on slow connections | Medium | Client-side compression before upload; chunked upload for large files |
| Tiptap bundle size (200KB) | Low | Dynamic import `next/dynamic` with SSR disabled |
| XSS via rich-text content | High | Sanitize HTML output with DOMPurify before rendering |

## Security Considerations

- Passwords hashed with bcrypt (salt rounds = 12)
- Refresh tokens stored in httpOnly, secure, sameSite=strict cookies
- Access tokens never in localStorage -- memory only (Zustand)
- Rate limiting: 5 login attempts per 15 minutes per IP
- CORS restricted to `FRONTEND_URL` origin
- File upload: validate MIME types, max file size (5MB images)
- Rich-text output sanitized with DOMPurify to prevent stored XSS
- Admin routes protected by both JWT guard and Roles guard
- R2 credentials stored in environment variables, never exposed to frontend

## Next Steps

After this phase completes, proceed to [Phase 03 - Products & Storefront](./phase-03-products-and-storefront.md).
