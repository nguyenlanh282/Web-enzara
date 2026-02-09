"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Package, ShoppingBag } from "lucide-react";
import { SepayQR } from "@/components/storefront/checkout/SepayQR";
import { Breadcrumbs } from "@/components/storefront/shared/Breadcrumbs";
import { TrackingService } from "@/lib/tracking";
import { apiClient } from "@/lib/api";

function ConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const orderNumber = searchParams.get("order");
  const method = searchParams.get("method") as "COD" | "SEPAY_QR" | null;

  useEffect(() => {
    if (!orderNumber) {
      router.replace("/");
    }
  }, [orderNumber, router]);

  // Track purchase event for completed orders
  useEffect(() => {
    if (orderNumber && method) {
      // For COD, track immediately. For SEPAY_QR, the SepayQR component will track after payment confirmation
      if (method === "COD") {
        // Fetch order details and track
        apiClient
          .get<any>(`/orders/${orderNumber}`)
          .then((order) => {
            if (order) {
              TrackingService.purchase({
                orderNumber: order.orderNumber,
                total: order.totalAmount,
                shippingFee: order.shippingFee || 0,
                items:
                  order.items?.map((item: any) => ({
                    sku: item.sku,
                    productName: item.productName,
                    price: item.price,
                    quantity: item.quantity,
                  })) || [],
              });
            }
          })
          .catch(() => {});
      }
    }
  }, [orderNumber, method]);

  if (!orderNumber) {
    return null;
  }

  if (method === "SEPAY_QR") {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Breadcrumbs
          items={[
            { label: "Gio hang", href: "/cart" },
            { label: "Thanh toan", href: "/checkout" },
            { label: "Xac nhan" },
          ]}
        />

        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-700/10 mb-4">
              <Package className="h-8 w-8 text-primary-700" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-neutral-900">
              Thanh toan don hang
            </h1>
            <p className="mt-2 text-sm text-neutral-500 font-body">
              Ma don hang:{" "}
              <span className="font-semibold text-neutral-900">
                {orderNumber}
              </span>
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-neutral-200 p-6">
            <SepayQR orderNumber={orderNumber} />
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-sm text-primary-700 hover:text-primary-800 font-medium underline underline-offset-4"
            >
              <ShoppingBag className="h-4 w-4" />
              Tiep tuc mua sam
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // COD confirmation (default)
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs
        items={[
          { label: "Gio hang", href: "/cart" },
          { label: "Thanh toan", href: "/checkout" },
          { label: "Xac nhan" },
        ]}
      />

      <div className="max-w-lg mx-auto text-center py-12">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>

        <h1 className="text-2xl font-heading font-bold text-neutral-900">
          Dat hang thanh cong!
        </h1>

        <p className="mt-3 text-neutral-600 font-body">
          Don hang cua ban da duoc dat thanh cong!
        </p>

        <div className="mt-6 inline-block bg-neutral-50 rounded-xl px-6 py-4">
          <p className="text-sm text-neutral-500 font-body">Ma don hang</p>
          <p className="text-xl font-heading font-bold text-primary-700 mt-1">
            {orderNumber}
          </p>
        </div>

        <div className="mt-8 bg-neutral-50 rounded-xl p-5 text-left text-sm font-body space-y-2">
          <p className="text-neutral-600">
            <span className="font-medium text-neutral-900">
              Phuong thuc thanh toan:
            </span>{" "}
            Thanh toan khi nhan hang (COD)
          </p>
          <p className="text-neutral-600">
            <span className="font-medium text-neutral-900">
              Thoi gian giao hang du kien:
            </span>{" "}
            2-5 ngay lam viec
          </p>
          <p className="text-neutral-400 text-xs mt-2">
            Chung toi se lien he voi ban qua dien thoai truoc khi giao hang.
          </p>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/products"
            className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl bg-primary-700 text-white font-medium hover:bg-primary-800 transition-colors"
          >
            <ShoppingBag className="h-4 w-4" />
            Tiep tuc mua sam
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary-700 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return <ConfirmationContent />;
}
