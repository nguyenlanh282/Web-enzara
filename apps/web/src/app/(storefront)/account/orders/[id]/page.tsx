"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Breadcrumbs } from "@/components/storefront/shared/Breadcrumbs";
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  MapPin,
  Truck,
  CreditCard,
  XCircle,
} from "lucide-react";

interface OrderItem {
  id: string;
  productName: string;
  variantName?: string;
  sku?: string;
  price: number;
  quantity: number;
  total: number;
}

interface TimelineEntry {
  id: string;
  status: string;
  note?: string;
  createdAt: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status:
    | "PENDING"
    | "CONFIRMED"
    | "PROCESSING"
    | "SHIPPING"
    | "DELIVERED"
    | "CANCELLED"
    | "REFUNDED";
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  paymentMethod: "COD" | "SEPAY_QR" | "BANK_TRANSFER";
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  total: number;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingWard: string;
  shippingDistrict: string;
  shippingProvince: string;
  trackingNumber?: string;
  note?: string;
  createdAt: string;
  items: OrderItem[];
  timeline: TimelineEntry[];
}

function formatVND(value: number): string {
  return new Intl.NumberFormat("vi-VN").format(value) + "đ";
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const ORDER_STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  PENDING: { label: "Cho xac nhan", bg: "bg-yellow-100", text: "text-yellow-800" },
  CONFIRMED: { label: "Da xac nhan", bg: "bg-blue-100", text: "text-blue-800" },
  PROCESSING: { label: "Dang xu ly", bg: "bg-indigo-100", text: "text-indigo-800" },
  SHIPPING: { label: "Dang giao", bg: "bg-purple-100", text: "text-purple-800" },
  DELIVERED: { label: "Da giao", bg: "bg-green-100", text: "text-green-800" },
  CANCELLED: { label: "Da huy", bg: "bg-red-100", text: "text-red-800" },
  REFUNDED: { label: "Da hoan tien", bg: "bg-orange-100", text: "text-orange-800" },
};

const PAYMENT_STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  PENDING: { label: "Chua thanh toan", bg: "bg-yellow-100", text: "text-yellow-800" },
  PAID: { label: "Da thanh toan", bg: "bg-green-100", text: "text-green-800" },
  FAILED: { label: "That bai", bg: "bg-red-100", text: "text-red-800" },
  REFUNDED: { label: "Da hoan tien", bg: "bg-orange-100", text: "text-orange-800" },
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  COD: "Thanh toan khi nhan hang",
  SEPAY_QR: "Chuyen khoan QR",
  BANK_TRANSFER: "Chuyen khoan ngan hang",
};

const TIMELINE_STATUS_LABELS: Record<string, string> = {
  PENDING: "Tao don hang",
  CONFIRMED: "Xac nhan don hang",
  PROCESSING: "Dang xu ly",
  SHIPPING: "Dang giao hang",
  DELIVERED: "Da giao hang",
  CANCELLED: "Da huy",
  REFUNDED: "Da hoan tien",
  PAYMENT_CONFIRMED: "Thanh toan thanh cong",
};

const TIMELINE_DOT_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-500",
  CONFIRMED: "bg-blue-500",
  PROCESSING: "bg-indigo-500",
  SHIPPING: "bg-purple-500",
  DELIVERED: "bg-green-500",
  CANCELLED: "bg-red-500",
  REFUNDED: "bg-orange-500",
  PAYMENT_CONFIRMED: "bg-green-500",
};

export function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderNumber = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderNumber]);

  async function fetchOrder() {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<Order>(
        `/orders/${orderNumber}/tracking`
      );
      setOrder(response);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Khong the tai thong tin don hang");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelOrder() {
    if (!order) return;

    const confirmed = window.confirm(
      "Ban co chac chan muon huy don hang nay? Hanh dong nay khong the hoan tac."
    );
    if (!confirmed) return;

    setCancelling(true);
    setCancelError(null);
    try {
      await apiClient.put(`/orders/${order.id}/cancel`, {});
      await fetchOrder();
    } catch (err) {
      if (err instanceof ApiError) {
        setCancelError(err.message);
      } else {
        setCancelError("Khong the huy don hang");
      }
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-primary-700 animate-spin" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 space-y-4">
        <button
          onClick={() => router.push("/account/orders")}
          className="inline-flex items-center gap-2 font-body text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lai danh sach don hang
        </button>
        <div className="flex items-center justify-center gap-2 py-12 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <span className="font-body">{error || "Khong tim thay don hang"}</span>
        </div>
      </div>
    );
  }

  const orderStatusConfig = ORDER_STATUS_CONFIG[order.status];
  const paymentStatusConfig = PAYMENT_STATUS_CONFIG[order.paymentStatus];

  const sortedTimeline = [...(order.timeline || [])].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-2">
      <Breadcrumbs
        items={[
          { label: "Tai khoan", href: "/account" },
          { label: "Don hang", href: "/account/orders" },
          { label: order.orderNumber },
        ]}
      />

      {/* Back button */}
      <button
        onClick={() => router.push("/account/orders")}
        className="inline-flex items-center gap-2 font-body text-sm text-neutral-600 hover:text-neutral-900 transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lai danh sach don hang
      </button>

      {/* Order header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-neutral-900">
            Don hang #{order.orderNumber}
          </h1>
          <p className="font-body text-neutral-600 mt-1">
            Ngay tao: {formatDate(order.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {orderStatusConfig && (
            <span
              className={cn(
                "inline-flex items-center px-3 py-1 rounded-full text-sm font-body font-medium",
                orderStatusConfig.bg,
                orderStatusConfig.text
              )}
            >
              {orderStatusConfig.label}
            </span>
          )}
          {paymentStatusConfig && (
            <span
              className={cn(
                "inline-flex items-center px-3 py-1 rounded-full text-sm font-body font-medium",
                paymentStatusConfig.bg,
                paymentStatusConfig.text
              )}
            >
              {paymentStatusConfig.label}
            </span>
          )}
        </div>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order items */}
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <div className="p-5 border-b border-neutral-200">
              <h2 className="font-heading text-lg font-semibold text-neutral-900">
                San pham
              </h2>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-body font-semibold text-neutral-900 text-sm">
                      San pham
                    </th>
                    <th className="px-4 py-3 text-right font-body font-semibold text-neutral-900 text-sm">
                      Don gia
                    </th>
                    <th className="px-4 py-3 text-right font-body font-semibold text-neutral-900 text-sm">
                      SL
                    </th>
                    <th className="px-4 py-3 text-right font-body font-semibold text-neutral-900 text-sm">
                      Thanh tien
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {order.items.map((item) => (
                    <tr key={item.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-body font-medium text-neutral-900 text-sm">
                            {item.productName}
                          </div>
                          {item.variantName && (
                            <div className="font-body text-xs text-neutral-500 mt-0.5">
                              {item.variantName}
                            </div>
                          )}
                          {item.sku && (
                            <div className="font-body text-xs text-neutral-400 mt-0.5">
                              SKU: {item.sku}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-body text-sm text-neutral-900">
                          {formatVND(item.price)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-body text-sm text-neutral-900">
                          {item.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-body text-sm font-medium text-neutral-900">
                          {formatVND(item.total)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile items */}
            <div className="md:hidden divide-y divide-neutral-100">
              {order.items.map((item) => (
                <div key={item.id} className="p-4">
                  <div className="font-body font-medium text-neutral-900 text-sm">
                    {item.productName}
                  </div>
                  {item.variantName && (
                    <div className="font-body text-xs text-neutral-500 mt-0.5">
                      {item.variantName}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-body text-sm text-neutral-500">
                      {formatVND(item.price)} x {item.quantity}
                    </span>
                    <span className="font-body text-sm font-medium text-neutral-900">
                      {formatVND(item.total)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Order summary */}
            <div className="border-t border-neutral-200 p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-body text-sm text-neutral-600">
                  Tam tinh
                </span>
                <span className="font-body text-sm text-neutral-900">
                  {formatVND(order.subtotal)}
                </span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="font-body text-sm text-neutral-600">
                    Giam gia
                  </span>
                  <span className="font-body text-sm text-red-600">
                    -{formatVND(order.discountAmount)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="font-body text-sm text-neutral-600">
                  Phi van chuyen
                </span>
                <span className="font-body text-sm text-neutral-900">
                  {order.shippingFee > 0
                    ? formatVND(order.shippingFee)
                    : "Mien phi"}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-neutral-200">
                <span className="font-body font-semibold text-neutral-900">
                  Tong cong
                </span>
                <span className="font-body font-semibold text-lg text-primary-700">
                  {formatVND(order.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Note */}
          {order.note && (
            <div className="bg-white rounded-xl border border-neutral-200 p-5">
              <h2 className="font-heading text-lg font-semibold text-neutral-900 mb-2">
                Ghi chu don hang
              </h2>
              <p className="font-body text-sm text-neutral-700">{order.note}</p>
            </div>
          )}
        </div>

        {/* Right column - 1/3 */}
        <div className="space-y-6">
          {/* Shipping address */}
          <div className="bg-white rounded-xl border border-neutral-200 p-5">
            <h2 className="font-heading text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-neutral-400" />
              Dia chi giao hang
            </h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-body text-sm text-neutral-500 w-20 flex-shrink-0">
                  Nguoi nhan:
                </span>
                <span className="font-body text-sm text-neutral-900 font-medium">
                  {order.shippingName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-body text-sm text-neutral-500 w-20 flex-shrink-0">
                  SDT:
                </span>
                <span className="font-body text-sm text-neutral-900">
                  {order.shippingPhone}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-body text-sm text-neutral-500 w-20 flex-shrink-0">
                  Dia chi:
                </span>
                <span className="font-body text-sm text-neutral-900">
                  {order.shippingAddress}, {order.shippingWard},{" "}
                  {order.shippingDistrict}, {order.shippingProvince}
                </span>
              </div>
            </div>
          </div>

          {/* Payment & Tracking info */}
          <div className="bg-white rounded-xl border border-neutral-200 p-5">
            <h2 className="font-heading text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-neutral-400" />
              Thanh toan
            </h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-body text-sm text-neutral-500 w-24 flex-shrink-0">
                  Phuong thuc:
                </span>
                <span className="font-body text-sm text-neutral-900">
                  {PAYMENT_METHOD_LABELS[order.paymentMethod] ||
                    order.paymentMethod}
                </span>
              </div>
              {order.trackingNumber && (
                <div className="flex items-center gap-2 pt-2 mt-2 border-t border-neutral-100">
                  <Truck className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                  <span className="font-body text-sm text-neutral-500">
                    Ma van don:
                  </span>
                  <span className="font-body text-sm text-neutral-900 font-medium">
                    {order.trackingNumber}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl border border-neutral-200 p-5">
            <h2 className="font-heading text-lg font-semibold text-neutral-900 mb-4">
              Lich su don hang
            </h2>
            {sortedTimeline.length === 0 ? (
              <p className="font-body text-sm text-neutral-500">
                Chua co lich su trang thai.
              </p>
            ) : (
              <div className="relative">
                {sortedTimeline.map((entry, index) => {
                  const isLast = index === sortedTimeline.length - 1;
                  const dotColor =
                    TIMELINE_DOT_COLORS[entry.status] || "bg-neutral-400";
                  const label =
                    TIMELINE_STATUS_LABELS[entry.status] || entry.status;

                  return (
                    <div
                      key={entry.id}
                      className="relative flex gap-4 pb-6 last:pb-0"
                    >
                      {/* Vertical line */}
                      {!isLast && (
                        <div className="absolute left-[9px] top-5 bottom-0 w-0.5 bg-neutral-200" />
                      )}

                      {/* Dot */}
                      <div className="relative z-10 flex-shrink-0 mt-1">
                        <div
                          className={cn(
                            "w-[18px] h-[18px] rounded-full border-2 border-white shadow-sm",
                            dotColor
                          )}
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="font-body font-medium text-sm text-neutral-900">
                          {label}
                        </p>
                        {entry.note && (
                          <p className="font-body text-sm text-neutral-600 mt-0.5">
                            {entry.note}
                          </p>
                        )}
                        <span className="font-body text-xs text-neutral-400 mt-1 block">
                          {formatDate(entry.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cancel order button */}
          {order.status === "PENDING" && (
            <div className="bg-white rounded-xl border border-neutral-200 p-5">
              {cancelError && (
                <div className="mb-3 p-3 rounded-lg bg-red-50 text-red-600 text-sm font-body">
                  {cancelError}
                </div>
              )}
              <button
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-red-300 text-red-600 rounded-xl font-body font-medium hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelling ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                Huy don hang
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OrderDetailPageRoute() {
  return <OrderDetailPage />;
}
