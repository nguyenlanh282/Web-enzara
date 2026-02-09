"use client";

import { useState } from "react";
import { apiClient, ApiError } from "@/lib/api";
import {
  Search,
  Package,
  CheckCircle2,
  Circle,
  Truck,
  ClipboardCheck,
  Clock,
  XCircle,
  MapPin,
  CreditCard,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";

interface OrderTracking {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
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
  createdAt: string;
  items: Array<{
    id: string;
    productName: string;
    variantName?: string;
    quantity: number;
    price: number;
    total: number;
  }>;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Cho xu ly",
  CONFIRMED: "Da xac nhan",
  PROCESSING: "Dang chuan bi",
  SHIPPING: "Dang giao hang",
  DELIVERED: "Da giao hang",
  CANCELLED: "Da huy",
};

const STATUS_FLOW = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPING", "DELIVERED"];

const STATUS_ICONS: Record<string, React.ReactNode> = {
  PENDING: <Clock className="h-5 w-5" />,
  CONFIRMED: <ClipboardCheck className="h-5 w-5" />,
  PROCESSING: <Package className="h-5 w-5" />,
  SHIPPING: <Truck className="h-5 w-5" />,
  DELIVERED: <CheckCircle2 className="h-5 w-5" />,
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  COD: "Thanh toan khi nhan hang (COD)",
  BANK_TRANSFER: "Chuyen khoan ngan hang",
  MOMO: "Vi MoMo",
  ZALOPAY: "ZaloPay",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Chua thanh toan",
  PAID: "Da thanh toan",
  FAILED: "Thanh toan that bai",
  REFUNDED: "Da hoan tien",
};

function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
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

export function TrackingForm() {
  const [orderNumber, setOrderNumber] = useState("");
  const [tracking, setTracking] = useState<OrderTracking | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = orderNumber.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setError("");
    setTracking(null);

    try {
      const data = await apiClient.get<OrderTracking>(
        `/orders/${trimmed}/tracking`
      );
      setTracking(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError("Khong tim thay don hang");
      } else {
        setError("Da co loi xay ra. Vui long thu lai sau.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Search form */}
      <form
        onSubmit={handleSubmit}
        className="max-w-xl mx-auto flex flex-col sm:flex-row gap-3"
      >
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
          <input
            type="text"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="Nhap ma don hang (VD: ENZ-20260209-XXXXX)"
            className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg font-body focus:outline-none focus:ring-2 focus:ring-primary-700 focus:border-transparent"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !orderNumber.trim()}
          className="px-6 py-3 bg-primary-700 text-white font-body font-semibold rounded-lg hover:bg-primary-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Dang tra cuu..." : "Tra cuu"}
        </button>
      </form>

      {/* Error message */}
      {error && (
        <div className="max-w-xl mx-auto mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 font-body text-center">
          <XCircle className="h-5 w-5 inline-block mr-2" />
          {error}
        </div>
      )}

      {/* Tracking result */}
      {tracking && <TrackingResult tracking={tracking} />}
    </div>
  );
}

function TrackingResult({ tracking }: { tracking: OrderTracking }) {
  const isCancelled = tracking.status === "CANCELLED";
  const currentStepIndex = STATUS_FLOW.indexOf(tracking.status);

  return (
    <div className="max-w-3xl mx-auto mt-10 space-y-8">
      {/* Order header */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm text-neutral-500 font-body">Ma don hang</p>
            <p className="text-lg font-heading font-bold text-neutral-900">
              {tracking.orderNumber}
            </p>
            <p className="text-sm text-neutral-500 font-body mt-1">
              Ngay dat: {formatDate(tracking.createdAt)}
            </p>
          </div>
          <StatusBadge status={tracking.status} />
        </div>
      </div>

      {/* Status timeline */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <h3 className="text-lg font-heading font-semibold text-neutral-900 mb-6">
          Trang thai don hang
        </h3>

        {isCancelled ? (
          <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
            <XCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
            <div>
              <p className="font-body font-semibold text-red-700">Da huy</p>
              <p className="text-sm text-red-600 font-body">
                Don hang da bi huy
              </p>
            </div>
          </div>
        ) : (
          <div className="relative">
            {STATUS_FLOW.map((status, index) => {
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const isFuture = index > currentStepIndex;
              const isLast = index === STATUS_FLOW.length - 1;

              return (
                <div key={status} className="flex gap-4">
                  {/* Icon column */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                        isCompleted
                          ? "bg-green-100 border-green-500 text-green-600"
                          : isCurrent
                            ? "bg-primary-50 border-primary-700 text-primary-700"
                            : "bg-neutral-100 border-neutral-300 text-neutral-400"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        STATUS_ICONS[status] || <Circle className="h-5 w-5" />
                      )}
                    </div>
                    {!isLast && (
                      <div
                        className={`w-0.5 h-10 ${
                          isCompleted ? "bg-green-500" : isCurrent ? "bg-primary-700" : "bg-neutral-300"
                        }`}
                      />
                    )}
                  </div>

                  {/* Text column */}
                  <div className={`pb-6 ${isLast ? "pb-0" : ""}`}>
                    <p
                      className={`font-body font-semibold ${
                        isCompleted
                          ? "text-green-700"
                          : isCurrent
                            ? "text-primary-700"
                            : "text-neutral-400"
                      }`}
                    >
                      {STATUS_LABELS[status] || status}
                    </p>
                    {isCurrent && (
                      <p className="text-sm text-neutral-500 font-body mt-0.5">
                        Trang thai hien tai
                      </p>
                    )}
                    {isFuture && (
                      <p className="text-sm text-neutral-400 font-body mt-0.5">
                        Chua hoan thanh
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Order items */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <h3 className="text-lg font-heading font-semibold text-neutral-900 mb-4 flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-primary-700" />
          San pham
        </h3>
        <div className="divide-y divide-neutral-100">
          {tracking.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
            >
              <div className="flex-1 min-w-0">
                <p className="font-body font-medium text-neutral-900 truncate">
                  {item.productName}
                </p>
                {item.variantName && (
                  <p className="text-sm text-neutral-500 font-body">
                    {item.variantName}
                  </p>
                )}
                <p className="text-sm text-neutral-500 font-body">
                  {formatPrice(item.price)} x {item.quantity}
                </p>
              </div>
              <p className="font-body font-semibold text-neutral-900 ml-4">
                {formatPrice(item.total)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Shipping address */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <h3 className="text-lg font-heading font-semibold text-neutral-900 mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary-700" />
          Dia chi nhan hang
        </h3>
        <div className="font-body text-neutral-700 space-y-1">
          <p className="font-semibold">{tracking.shippingName}</p>
          <p>{tracking.shippingPhone}</p>
          <p>
            {tracking.shippingAddress}
            {tracking.shippingWard && `, ${tracking.shippingWard}`}
            {tracking.shippingDistrict && `, ${tracking.shippingDistrict}`}
            {tracking.shippingProvince && `, ${tracking.shippingProvince}`}
          </p>
        </div>
      </div>

      {/* Payment and total */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <h3 className="text-lg font-heading font-semibold text-neutral-900 mb-4 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary-700" />
          Thanh toan
        </h3>
        <div className="space-y-3 font-body">
          <div className="flex justify-between text-neutral-600">
            <span>Phuong thuc</span>
            <span className="font-medium text-neutral-900">
              {PAYMENT_METHOD_LABELS[tracking.paymentMethod] ||
                tracking.paymentMethod}
            </span>
          </div>
          <div className="flex justify-between text-neutral-600">
            <span>Trang thai thanh toan</span>
            <PaymentStatusBadge status={tracking.paymentStatus} />
          </div>
          <hr className="border-neutral-200" />
          <div className="flex justify-between text-neutral-600">
            <span>Tam tinh</span>
            <span>{formatPrice(tracking.subtotal)}</span>
          </div>
          {tracking.discountAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Giam gia</span>
              <span>-{formatPrice(tracking.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-neutral-600">
            <span>Phi van chuyen</span>
            <span>
              {tracking.shippingFee > 0
                ? formatPrice(tracking.shippingFee)
                : "Mien phi"}
            </span>
          </div>
          <hr className="border-neutral-200" />
          <div className="flex justify-between text-lg font-semibold text-neutral-900">
            <span>Tong cong</span>
            <span className="text-primary-700">
              {formatPrice(tracking.total)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-300",
    CONFIRMED: "bg-blue-100 text-blue-800 border-blue-300",
    PROCESSING: "bg-indigo-100 text-indigo-800 border-indigo-300",
    SHIPPING: "bg-purple-100 text-purple-800 border-purple-300",
    DELIVERED: "bg-green-100 text-green-800 border-green-300",
    CANCELLED: "bg-red-100 text-red-800 border-red-300",
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-body font-semibold border ${
        colorMap[status] || "bg-neutral-100 text-neutral-800 border-neutral-300"
      }`}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function PaymentStatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    PENDING: "text-yellow-700",
    PAID: "text-green-700",
    FAILED: "text-red-700",
    REFUNDED: "text-blue-700",
  };

  return (
    <span className={`font-medium ${colorMap[status] || "text-neutral-700"}`}>
      {PAYMENT_STATUS_LABELS[status] || status}
    </span>
  );
}
