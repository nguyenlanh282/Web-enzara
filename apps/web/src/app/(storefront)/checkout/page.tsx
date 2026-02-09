"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient, ApiError } from "@/lib/api";
import { TrackingService } from "@/lib/tracking";
import {
  useCartStore,
  selectSubtotal,
  selectTotal,
} from "@/stores/cartStore";
import { Breadcrumbs } from "@/components/storefront/shared/Breadcrumbs";
import { ShippingForm } from "@/components/storefront/checkout/ShippingForm";
import type { CheckoutFormData } from "@/components/storefront/checkout/ShippingForm";
import { PaymentMethodSelector } from "@/components/storefront/checkout/PaymentMethodSelector";
import { VoucherInput } from "@/components/storefront/checkout/VoucherInput";
import { OrderSummary } from "@/components/storefront/checkout/OrderSummary";
import { LoyaltyRedemption } from "@/components/storefront/checkout/LoyaltyRedemption";

const checkoutSchema = z.object({
  shippingName: z.string().min(2, "Vui long nhap ho ten"),
  shippingPhone: z
    .string()
    .regex(/^(0[3-9])\d{8}$/, "So dien thoai khong hop le"),
  shippingEmail: z
    .string()
    .email("Email khong hop le")
    .optional()
    .or(z.literal("")),
  shippingProvince: z.string().min(1, "Vui long chon tinh/thanh"),
  shippingDistrict: z.string().min(1, "Vui long chon quan/huyen"),
  shippingWard: z.string().min(1, "Vui long chon phuong/xa"),
  shippingAddress: z.string().min(5, "Vui long nhap dia chi chi tiet"),
  note: z.string().optional(),
  paymentMethod: z.enum(["COD", "SEPAY_QR"]),
});

type CheckoutSchema = z.infer<typeof checkoutSchema>;

interface OrderResponse {
  id: string;
  orderNumber: string;
}

const FREE_SHIPPING_THRESHOLD = 500000;
const SHIPPING_FEE = 30000;

export default function CheckoutPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(0);

  const items = useCartStore((s) => s.items);
  const voucherCode = useCartStore((s) => s.voucherCode);
  const clearCart = useCartStore((s) => s.clearCart);
  const subtotal = useCartStore(selectSubtotal);
  const total = useCartStore(selectTotal);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Track begin_checkout
  useEffect(() => {
    if (mounted && items.length > 0) {
      TrackingService.beginCheckout(
        total,
        items.map((item) => ({
          sku: item.sku,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        }))
      );
    }
  }, [mounted, items, total]);

  // Redirect to cart if empty (after hydration)
  useEffect(() => {
    if (mounted && items.length === 0) {
      router.replace("/cart");
    }
  }, [mounted, items.length, router]);

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      shippingName: "",
      shippingPhone: "",
      shippingEmail: "",
      shippingProvince: "",
      shippingDistrict: "",
      shippingWard: "",
      shippingAddress: "",
      note: "",
      paymentMethod: "COD",
    },
  });

  const onSubmit = async (data: CheckoutSchema) => {
    setSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        items: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
        })),
        shippingName: data.shippingName,
        shippingPhone: data.shippingPhone,
        shippingEmail: data.shippingEmail || undefined,
        shippingProvince: data.shippingProvince,
        shippingDistrict: data.shippingDistrict,
        shippingWard: data.shippingWard,
        shippingAddress: data.shippingAddress,
        note: data.note || undefined,
        paymentMethod: data.paymentMethod,
        voucherCode: voucherCode || undefined,
        pointsToRedeem: loyaltyPoints || undefined,
      };

      const response = await apiClient.post<OrderResponse>(
        "/orders",
        payload
      );

      clearCart();
      router.push(
        `/checkout/confirmation?order=${encodeURIComponent(response.orderNumber)}&method=${data.paymentMethod}`
      );
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(err.message);
      } else {
        setSubmitError("Da co loi xay ra. Vui long thu lai.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Don't render until hydrated
  if (!mounted) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-neutral-200 rounded w-1/3" />
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-10 bg-neutral-200 rounded" />
              <div className="h-10 bg-neutral-200 rounded" />
              <div className="h-10 bg-neutral-200 rounded" />
            </div>
            <div className="mt-8 lg:mt-0">
              <div className="h-60 bg-neutral-200 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Empty cart guard (already redirecting but show nothing)
  if (items.length === 0) {
    return null;
  }

  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const grandTotal = Math.max(0, total + shippingFee - loyaltyDiscount);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs
        items={[
          { label: "Gio hang", href: "/cart" },
          { label: "Thanh toan" },
        ]}
      />

      <h1 className="text-2xl font-heading font-bold text-neutral-900 mb-6">
        Thanh toan
      </h1>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Left column -- form */}
          <div className="lg:col-span-2 space-y-8">
            <ShippingForm form={form} />
            <PaymentMethodSelector form={form} />

            <VoucherInput />

            <LoyaltyRedemption
              onPointsChange={(p, d) => {
                setLoyaltyPoints(p);
                setLoyaltyDiscount(d);
              }}
            />

            {/* Submit error */}
            {submitError && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-600 font-body">{submitError}</p>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={submitting}
              className={cn(
                "w-full h-12 rounded-xl text-white font-medium transition-colors flex items-center justify-center gap-2",
                submitting
                  ? "bg-primary-700/70 cursor-not-allowed"
                  : "bg-primary-700 hover:bg-primary-800"
              )}
            >
              {submitting && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {submitting
                ? "Dang xu ly..."
                : `Dat hang (${new Intl.NumberFormat("vi-VN").format(grandTotal)}\u0111)`}
            </button>
          </div>

          {/* Right column -- order summary */}
          <div className="mt-8 lg:mt-0">
            <OrderSummary loyaltyDiscount={loyaltyDiscount} />
          </div>
        </div>
      </form>
    </div>
  );
}
