# Phase 04 - Cart, Checkout & Orders

## Context Links

- [Master Plan](./plan.md)
- [Previous: Products & Storefront](./phase-03-products-and-storefront.md)
- [Next: Blog & SEO](./phase-05-blog-and-seo.md)
- [PRD Module 5.5: Cart & Checkout](../Web-enzara-prd.md)
- [PRD Module 5.6: SePay Integration](../Web-enzara-prd.md)
- [PRD Module 5.7: Orders & Pancake POS](../Web-enzara-prd.md)

## Overview

| Field | Value |
|-------|-------|
| **Date** | 2026-02-08 |
| **Priority** | Critical |
| **Status** | Pending |
| **Estimated** | 2 weeks |
| **Depends on** | Phase 03 (Products & Storefront) |
| **Blocks** | Phase 05 (Blog & SEO) -- only loosely |

## Key Insights

- Cart is client-side (Zustand + localStorage persist) -- no server-side cart model needed for MVP
- Guest checkout supported -- no account required to place an order
- Checkout is a single-page multi-section form, not multi-step wizard (better conversion for VN market)
- SePay payment: generate unique transfer code (prefix + order number), show VietQR code, poll for webhook confirmation
- COD is the default payment method (still dominant in Vietnam)
- Pancake POS sync via BullMQ background job -- order creation + status updates
- Vietnamese address hierarchy: Province -> District -> Ward (cascading selects)
- Order numbers: `ENZ-{YYYYMMDD}-{4-digit sequence}` (e.g., `ENZ-20260208-0001`)

## Requirements

### Cart
- CART-01: Add/remove/update quantity in cart
- CART-02: Persist cart across browser sessions (Zustand + localStorage)
- CART-03: Slide-out CartDrawer from header cart icon
- CART-04: Full cart page at `/cart`
- CART-05: Apply voucher code (validate against backend)
- CART-07: Guest checkout (no login required)

### Checkout
- CART-08: Checkout form with validation (Vietnamese address fields)
- Shipping info: name, phone, email, province/district/ward (cascading), address, note
- Payment method selection: COD or SePay QR
- Order summary sidebar

### SePay Payment
- Generate unique payment code per order
- Display VietQR code with bank details
- 15-minute payment timeout with countdown
- Webhook handler for payment confirmation
- Auto-update order status on successful payment

### Orders
- ORD-01: Admin order list with filters (status, date range, search)
- ORD-02: Admin order detail with timeline
- ORD-03: Admin status updates
- ORD-05: Auto-sync to Pancake POS on order creation
- ORD-06: Receive Pancake POS webhooks for status updates
- ORD-07: Customer order history in account page
- ORD-08: Customer order tracking page

## Architecture

### Cart (Client-side)

```
apps/web/src/stores/cartStore.ts     # Zustand store with persist middleware
apps/web/src/hooks/useCart.ts        # Cart hook with computed values
apps/web/src/components/storefront/cart/
├── CartDrawer.tsx                   # Slide-out drawer (Sheet component)
├── CartItem.tsx                     # Single item row
└── CartSummary.tsx                  # Subtotal, discount, total
apps/web/src/app/(storefront)/cart/page.tsx    # Full cart page
```

### Checkout (Frontend + Backend)

```
apps/web/src/app/(storefront)/checkout/page.tsx  # Checkout page
apps/web/src/components/storefront/checkout/
├── CheckoutForm.tsx                # Main checkout form
├── ShippingForm.tsx                # Address fields with cascading selects
├── PaymentMethodSelector.tsx       # COD / SePay QR radio
├── OrderSummary.tsx                # Right sidebar summary
├── SepayQR.tsx                     # QR code display + countdown
└── OrderConfirmation.tsx           # Thank-you page content
```

### Orders Module (NestJS)

```
apps/api/src/modules/orders/
├── orders.module.ts
├── orders.controller.ts            # Admin: list, detail, status update
├── orders-public.controller.ts     # Customer: create, history, tracking
├── orders.service.ts               # Order business logic
├── dto/
│   ├── create-order.dto.ts
│   ├── order-filter.dto.ts
│   └── update-order-status.dto.ts
└── helpers/
    └── order-number.generator.ts   # ENZ-YYYYMMDD-XXXX format
```

### Payments Module (NestJS)

```
apps/api/src/modules/payments/
├── payments.module.ts
├── payments.controller.ts          # SePay config
├── payments.service.ts             # Payment processing logic
└── sepay/
    ├── sepay.service.ts            # QR generation, webhook processing
    └── sepay-webhook.controller.ts # POST /api/webhook/sepay
```

### Pancake POS Module (NestJS)

```
apps/api/src/modules/pancake/
├── pancake.module.ts
├── pancake.service.ts              # API client for Pancake POS
├── pancake-sync.service.ts         # Order/inventory sync logic
├── pancake-webhook.controller.ts   # POST /api/webhook/pancake
└── jobs/
    ├── sync-order.job.ts           # BullMQ job: push order to Pancake
    ├── sync-status.job.ts          # BullMQ job: update status
    └── sync-inventory.job.ts       # BullMQ job: periodic inventory sync
```

## Related Code Files

### Frontend
- `apps/web/src/stores/cartStore.ts`
- `apps/web/src/app/(storefront)/cart/page.tsx`
- `apps/web/src/app/(storefront)/checkout/page.tsx`
- `apps/web/src/components/storefront/cart/CartDrawer.tsx`
- `apps/web/src/components/storefront/checkout/CheckoutForm.tsx`
- `apps/web/src/components/storefront/checkout/SepayQR.tsx`
- `apps/web/src/app/(storefront)/account/orders/page.tsx`
- `apps/web/src/app/(storefront)/account/orders/[id]/page.tsx`

### Backend
- `apps/api/src/modules/orders/orders.controller.ts`
- `apps/api/src/modules/orders/orders.service.ts`
- `apps/api/src/modules/payments/sepay/sepay.service.ts`
- `apps/api/src/modules/payments/sepay/sepay-webhook.controller.ts`
- `apps/api/src/modules/pancake/pancake.service.ts`
- `apps/api/src/modules/pancake/pancake-sync.service.ts`
- `apps/api/src/modules/pancake/pancake-webhook.controller.ts`

### Admin
- `apps/web/src/app/admin/orders/page.tsx`
- `apps/web/src/app/admin/orders/[id]/page.tsx`
- `apps/web/src/components/admin/orders/OrderDetail.tsx`
- `apps/web/src/components/admin/orders/OrderTimeline.tsx`

## Implementation Steps

### 1. Build Cart Store (Zustand)

```typescript
// apps/web/src/stores/cartStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CartItem {
  productId: string;
  variantId?: string;
  name: string;
  variantName?: string;
  image: string;
  price: number;          // current price (sale or base)
  originalPrice?: number; // base price for strikethrough
  quantity: number;
  maxQuantity: number;    // stock limit
  sku?: string;
}

interface CartState {
  items: CartItem[];
  voucherCode: string | null;
  voucherDiscount: number;

  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, variantId: string | undefined, qty: number) => void;
  applyVoucher: (code: string) => Promise<boolean>;
  removeVoucher: () => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      voucherCode: null,
      voucherDiscount: 0,

      addItem: (item) => {
        const items = get().items;
        const existing = items.find(
          i => i.productId === item.productId && i.variantId === item.variantId
        );
        if (existing) {
          const newQty = Math.min(existing.quantity + (item.quantity || 1), item.maxQuantity);
          set({ items: items.map(i =>
            i.productId === item.productId && i.variantId === item.variantId
              ? { ...i, quantity: newQty } : i
          )});
        } else {
          set({ items: [...items, { ...item, quantity: item.quantity || 1 }] });
        }
      },

      removeItem: (productId, variantId) => {
        set({ items: get().items.filter(
          i => !(i.productId === productId && i.variantId === variantId)
        )});
      },

      updateQuantity: (productId, variantId, qty) => {
        if (qty <= 0) return get().removeItem(productId, variantId);
        set({ items: get().items.map(i =>
          i.productId === productId && i.variantId === variantId
            ? { ...i, quantity: Math.min(qty, i.maxQuantity) } : i
        )});
      },

      applyVoucher: async (code) => {
        // Call POST /api/vouchers/validate { code, subtotal }
        // Returns { valid, discount, message }
        // Set voucherCode and voucherDiscount on success
        return true;
      },

      removeVoucher: () => set({ voucherCode: null, voucherDiscount: 0 }),
      clearCart: () => set({ items: [], voucherCode: null, voucherDiscount: 0 }),
    }),
    { name: "enzara-cart" } // localStorage key
  )
);

// Computed selectors (outside store for SSR safety)
export const selectSubtotal = (state: CartState) =>
  state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

export const selectTotalItems = (state: CartState) =>
  state.items.reduce((sum, i) => sum + i.quantity, 0);

export const selectTotal = (state: CartState) =>
  selectSubtotal(state) - state.voucherDiscount;
```

### 2. Build Cart UI Components

**2.1 CartDrawer:**

- Triggered by cart icon click in Header
- Uses shadcn/ui Sheet component (slides from right)
- Lists CartItem components with quantity +/- controls
- Shows subtotal at bottom
- "Xem gio hang" button -> navigates to `/cart`
- "Thanh toan" button -> navigates to `/checkout`
- Empty state: "Gio hang cua ban dang trong"

**2.2 Cart Page (`/cart`):**

- Full-width table/list of cart items
- Each row: image, name + variant, unit price, quantity selector, row total, remove button
- Voucher input with "Ap dung" button
- Cart summary: subtotal, voucher discount, total
- "Tiep tuc mua sam" + "Tien hanh thanh toan" buttons
- Responsive: table on desktop, stacked cards on mobile

### 3. Build Checkout Page

**3.1 Checkout form layout:**

Single-page with sections (not wizard steps). Left column: form. Right column: order summary (sticky).

```tsx
// apps/web/src/app/(storefront)/checkout/page.tsx
export default function CheckoutPage() {
  const cart = useCartStore();
  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
  });

  // Redirect to /cart if empty
  if (cart.items.length === 0) redirect("/cart");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <ShippingForm form={form} />
        <PaymentMethodSelector form={form} />
        <Button type="submit" onClick={form.handleSubmit(onSubmit)}>
          Dat hang
        </Button>
      </div>
      <OrderSummary items={cart.items} voucher={cart.voucherDiscount} />
    </div>
  );
}
```

**3.2 Checkout Zod schema:**

```typescript
const checkoutSchema = z.object({
  shippingName: z.string().min(2, "Vui long nhap ho ten"),
  shippingPhone: z.string().regex(/^(0[3-9])\d{8}$/, "So dien thoai khong hop le"),
  shippingEmail: z.string().email().optional().or(z.literal("")),
  shippingProvince: z.string().min(1, "Vui long chon tinh/thanh"),
  shippingDistrict: z.string().min(1, "Vui long chon quan/huyen"),
  shippingWard: z.string().min(1, "Vui long chon phuong/xa"),
  shippingAddress: z.string().min(5, "Vui long nhap dia chi chi tiet"),
  note: z.string().optional(),
  paymentMethod: z.enum(["COD", "SEPAY_QR"]),
});
```

**3.3 Vietnamese address cascading selects:**

Use Vietnam administrative divisions data (provinces -> districts -> wards). Options:
- Embed static JSON (~500KB, can be lazy-loaded)
- Or use a free API like `provinces.open-api.vn`

Each select depends on the previous. React Hook Form `watch` + `useEffect` to reset child fields when parent changes.

### 4. Build Order Creation Backend

**4.1 Create order endpoint:**

```
POST /api/orders
Body: {
  items: [{ productId, variantId, quantity }],
  shippingName, shippingPhone, shippingEmail,
  shippingProvince, shippingDistrict, shippingWard, shippingAddress,
  note,
  paymentMethod: "COD" | "SEPAY_QR",
  voucherCode?: string,
}
```

**4.2 Order creation flow (service):**

```typescript
async createOrder(dto: CreateOrderDto, userId?: string) {
  return this.prisma.$transaction(async (tx) => {
    // 1. Validate all cart items exist and have sufficient stock
    const products = await this.validateAndLockStock(tx, dto.items);

    // 2. Calculate prices (use DB prices, NOT client-sent prices)
    const { subtotal, items } = this.calculatePrices(products, dto.items);

    // 3. Validate voucher if provided
    let discount = 0;
    if (dto.voucherCode) {
      discount = await this.validateVoucher(tx, dto.voucherCode, subtotal);
    }

    // 4. Calculate shipping fee (flat fee for MVP, API in Phase 3)
    const shippingFee = subtotal >= 500000 ? 0 : 30000; // Free ship >= 500K

    // 5. Generate order number: ENZ-YYYYMMDD-XXXX
    const orderNumber = await this.generateOrderNumber(tx);

    // 6. Create order + order items
    const order = await tx.order.create({
      data: {
        orderNumber,
        customerId: userId || null,
        status: "PENDING",
        paymentStatus: dto.paymentMethod === "COD" ? "PENDING" : "PENDING",
        paymentMethod: dto.paymentMethod,
        subtotal, discountAmount: discount, shippingFee,
        total: subtotal - discount + shippingFee,
        voucherId: voucher?.id,
        shippingName: dto.shippingName,
        shippingPhone: dto.shippingPhone,
        shippingEmail: dto.shippingEmail,
        shippingAddress: dto.shippingAddress,
        shippingWard: dto.shippingWard,
        shippingDistrict: dto.shippingDistrict,
        shippingProvince: dto.shippingProvince,
        note: dto.note,
        items: { create: items },
        timeline: { create: { status: "PENDING", note: "Don hang da duoc tao" } },
      },
      include: { items: true },
    });

    // 7. Decrement stock
    await this.decrementStock(tx, dto.items);

    // 8. Update voucher usage count
    if (voucher) {
      await tx.voucher.update({
        where: { id: voucher.id },
        data: { usedCount: { increment: 1 } },
      });
    }

    // 9. Queue Pancake POS sync job
    await this.pancakeSyncQueue.add("sync-order", { orderId: order.id });

    // 10. Queue notification (email/Telegram)
    await this.notificationQueue.add("order-created", { orderId: order.id });

    return order;
  });
}
```

**4.3 Order number generation:**

```typescript
async generateOrderNumber(tx: PrismaTransactionClient): Promise<string> {
  const today = format(new Date(), "yyyyMMdd");
  const prefix = `ENZ-${today}-`;

  // Find today's highest order number
  const lastOrder = await tx.order.findFirst({
    where: { orderNumber: { startsWith: prefix } },
    orderBy: { orderNumber: "desc" },
  });

  const sequence = lastOrder
    ? parseInt(lastOrder.orderNumber.split("-").pop()!) + 1
    : 1;

  return `${prefix}${String(sequence).padStart(4, "0")}`;
}
```

### 5. Build SePay Payment Integration

**5.1 SePay QR generation:**

After order creation with `paymentMethod: SEPAY_QR`, generate a VietQR URL:

```typescript
// apps/api/src/modules/payments/sepay/sepay.service.ts
generateQRUrl(order: Order): string {
  const settings = this.settingsService.getGroup("payment");
  const { bank_name, account_number, account_holder, prefix } = settings.sepay;

  // Payment code: prefix + order number (e.g., "PC ENZ-20260208-0001")
  const transferContent = `${prefix} ${order.orderNumber}`;

  // VietQR URL format
  return `https://qr.sepay.vn/img?acc=${account_number}&bank=${bank_name}&amount=${order.total}&des=${encodeURIComponent(transferContent)}`;
}
```

**5.2 SePay webhook handler:**

```typescript
// POST /api/webhook/sepay
@Post("webhook/sepay")
async handleSepayWebhook(@Body() payload: SepayWebhookPayload, @Headers() headers) {
  // 1. Verify webhook authenticity (API key in header or signature)
  this.sepayService.verifyWebhook(headers, payload);

  // 2. Extract order number from transfer content
  const orderNumber = this.sepayService.extractOrderNumber(payload.content);
  if (!orderNumber) return { success: false, message: "Invalid content" };

  // 3. Find order
  const order = await this.ordersService.findByOrderNumber(orderNumber);
  if (!order) return { success: false, message: "Order not found" };

  // 4. Verify amount matches
  if (payload.transferAmount < Number(order.total)) {
    return { success: false, message: "Insufficient amount" };
  }

  // 5. Update order payment status
  await this.ordersService.confirmPayment(order.id, {
    sepayTxId: String(payload.id),
    paidAt: new Date(),
  });

  // 6. Add timeline entry
  await this.ordersService.addTimeline(order.id, "PAYMENT_CONFIRMED", "Thanh toan thanh cong qua SePay");

  // 7. Queue notifications + Pancake sync
  await this.notificationQueue.add("payment-confirmed", { orderId: order.id });

  return { success: true };
}
```

**5.3 SePay QR frontend component:**

```tsx
// apps/web/src/components/storefront/checkout/SepayQR.tsx
// - Displays QR code image from VietQR URL
// - Shows bank account details: bank name, account number, holder, transfer content
// - 15-minute countdown timer
// - Polls GET /api/orders/:id/payment-status every 5 seconds
// - On payment confirmed: show success animation, redirect to thank-you page
// - On timeout: show "Da het han" message with retry option
```

### 6. Build Order Confirmation Page

```tsx
// apps/web/src/app/(storefront)/checkout/confirmation/page.tsx
// Route: /checkout/confirmation?order=ENZ-20260208-0001
// - If COD: show thank-you message + order details + estimated delivery
// - If SEPAY_QR: show SepayQR component with polling
// - Order summary (items, total, shipping address)
// - "Tiep tuc mua sam" button
// - Clear cart after successful order
```

### 7. Build Admin Order Management

**7.1 Order list page:**

```
apps/web/src/app/admin/orders/page.tsx
- DataTable with columns: order number, customer, total, payment status, order status, date
- Filters: status dropdown, payment status, date range picker, search (order number/phone)
- Color-coded status badges
- Click row -> navigate to order detail
```

**7.2 Order detail page:**

```
apps/web/src/app/admin/orders/[id]/page.tsx
- Order header: number, date, status badges
- Customer info card: name, phone, email
- Shipping address card
- Items table: product, variant, price, qty, total
- Order summary: subtotal, discount, shipping, total
- OrderTimeline: vertical timeline of status changes
- Actions: update status dropdown, add note, print invoice
```

**7.3 Admin order endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/orders` | List orders (paginated, filtered) |
| GET | `/api/admin/orders/:id` | Order detail with items + timeline |
| PUT | `/api/admin/orders/:id/status` | Update order status |
| POST | `/api/admin/orders/:id/timeline` | Add timeline note |

### 8. Build Customer Order Pages

**8.1 Order history:**

```
apps/web/src/app/(storefront)/account/orders/page.tsx
- List of customer's orders (paginated)
- Each row: order number, date, status badge, total
- Click -> order detail
- Requires authentication
```

**8.2 Order tracking:**

```
apps/web/src/app/(storefront)/account/orders/[id]/page.tsx
- Order detail view (read-only)
- Visual timeline of status progression
- Items list
- "Huy don" button if status is PENDING
- Tracking number link (when available)
```

### 9. Build Pancake POS Sync

**9.1 Sync order to Pancake POS (BullMQ job):**

```typescript
// apps/api/src/modules/pancake/jobs/sync-order.job.ts
@Processor("pancake-sync")
export class SyncOrderProcessor {
  @Process("sync-order")
  async handleSyncOrder(job: Job<{ orderId: string }>) {
    const order = await this.ordersService.findById(job.data.orderId);

    const pancakePayload = {
      customer_name: order.shippingName,
      phone: order.shippingPhone,
      email: order.shippingEmail,
      shipping_address: this.formatAddress(order),
      items: order.items.map(item => ({
        product_id: item.product.pancakeId,
        variant_id: item.variant?.pancakeId,
        quantity: item.quantity,
        price: Number(item.price),
      })),
      payment_method: order.paymentMethod,
      total: Number(order.total),
      note: order.note,
    };

    const result = await this.pancakeService.createOrder(pancakePayload);
    await this.ordersService.update(order.id, { pancakeOrderId: result.id });
  }
}
```

**9.2 Pancake POS webhook handler:**

```typescript
// POST /api/webhook/pancake
// - Verify webhook signature
// - Find order by pancakeOrderId
// - Update order status based on Pancake event
// - Update tracking number if provided
// - Add OrderTimeline entry
// - Notify customer of status change
```

**9.3 Inventory sync (periodic):**

```typescript
// Scheduled job: every 15 minutes
// - Fetch all products from Pancake POS API
// - Compare stock quantities with local DB
// - Update local stock where different
// - Log sync results
```

### 10. Build Notification Triggers

Queue notifications for key events (implementation is fire-and-forget via BullMQ):

| Event | Channel | Recipient |
|-------|---------|-----------|
| Order created | Email, Telegram | Customer, Admin |
| Payment confirmed | Email | Customer |
| Order status changed | Email | Customer |
| Order cancelled | Email | Customer |
| New order alert | Telegram | Admin group |

Actual email/Telegram sending deferred to basic implementation in this phase, full notification system in Phase 2.

## Todo List

- [ ] Build Zustand cartStore with persist middleware
- [ ] Build CartDrawer component (Sheet slide-out)
- [ ] Build CartItem component with quantity controls
- [ ] Build CartSummary component
- [ ] Build full cart page at `/cart`
- [ ] Build checkout page layout (form + order summary)
- [ ] Build ShippingForm with Vietnamese address cascading selects
- [ ] Build PaymentMethodSelector (COD / SePay QR)
- [ ] Build checkout Zod validation schema
- [ ] Create orders module (NestJS)
- [ ] Implement order creation service with stock validation + transaction
- [ ] Implement order number generator (ENZ-YYYYMMDD-XXXX)
- [ ] Build SePay QR URL generation service
- [ ] Build SePay webhook handler with payment confirmation
- [ ] Build SepayQR frontend component with countdown + polling
- [ ] Build order confirmation page
- [ ] Build Pancake POS API client service
- [ ] Build Pancake order sync BullMQ job
- [ ] Build Pancake webhook handler
- [ ] Build inventory sync scheduled job
- [ ] Build admin order list page (DataTable with filters)
- [ ] Build admin order detail page with timeline
- [ ] Build admin order status update UI
- [ ] Build customer order history page
- [ ] Build customer order tracking page
- [ ] Build customer order cancellation (PENDING status only)
- [ ] Queue email/Telegram notifications for order events
- [ ] Build voucher validation endpoint (for cart apply)

## Success Criteria

1. User can add products to cart, see cart badge update in header
2. Cart persists across page reloads and browser restarts
3. CartDrawer slides open with correct items and quantities
4. Checkout form validates Vietnamese phone numbers and address hierarchy
5. COD order: creates order, shows confirmation page, syncs to Pancake POS
6. SePay order: shows QR code, polls for payment, confirms on webhook
7. Admin can view all orders, filter by status, and update status
8. Order timeline shows full history of status changes
9. Customer can view their order history and track order status
10. Pancake POS receives order data within 30 seconds of creation
11. Stock decrements correctly on order creation

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| SePay webhook missed/delayed | High | Implement manual payment verification; retry logic; admin override |
| Cart hydration mismatch (SSR vs client) | Medium | Use `useEffect` for cart rendering; show skeleton on server |
| Race condition on stock decrement | High | Prisma transaction with `SELECT FOR UPDATE` equivalent |
| Pancake POS API downtime | Medium | BullMQ retry with exponential backoff; manual sync option |
| Order number collision under high concurrency | Low | Database-level sequence or `findFirst + increment` within transaction |
| Vietnamese address data outdated | Low | Use well-maintained address API or regularly updated JSON |

## Security Considerations

- **Never trust client-side prices**: order creation recalculates all prices from database
- **Stock validation in transaction**: prevents overselling
- **SePay webhook verification**: validate API key/signature before processing
- **Pancake webhook signature**: verify HMAC before processing
- **Order access control**: customers can only view their own orders
- **Rate limiting on order creation**: prevent spam orders (10 per IP per hour)
- **Payment code uniqueness**: order numbers are unique, preventing duplicate payments
- **CSRF protection**: checkout form uses CSRF tokens via Next.js API routes
- **PCI compliance**: no credit card data touches our servers (SePay handles payment)

## Next Steps

After this phase completes, proceed to [Phase 05 - Blog & SEO](./phase-05-blog-and-seo.md).
