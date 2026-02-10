"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Breadcrumbs } from "@/components/storefront/shared/Breadcrumbs";
import {
  Loader2,
  AlertCircle,
  Package,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
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
  createdAt: string;
  items: OrderItem[];
}

interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  totalPages: number;
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

function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  async function fetchOrders() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      });
      const response = await apiClient.get<OrdersResponse>(
        `/orders/my?${params}`
      );
      setOrders(response.orders || []);
      setTotalPages(response.totalPages || 1);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Khong the tai danh sach don hang");
      }
    } finally {
      setLoading(false);
    }
  }

  function getTotalItems(order: Order): number {
    if (order.items && order.items.length > 0) {
      return order.items.reduce((sum, item) => sum + item.quantity, 0);
    }
    return 0;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-2">
      <Breadcrumbs
        items={[
          { label: "Tai khoan", href: "/account" },
          { label: "Don hang" },
        ]}
      />

      <h1 className="text-2xl font-heading font-bold text-neutral-900 mb-6">
        Don hang cua toi
      </h1>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-primary-700 animate-spin" />
        </div>
      ) : error ? (
        <div className="flex items-center justify-center gap-2 py-12 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <span className="font-body">{error}</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-6 py-16 text-neutral-400">
          <ShoppingBag className="h-24 w-24 stroke-1" />
          <h2 className="text-xl font-heading font-bold text-neutral-900">
            Ban chua co don hang nao
          </h2>
          <p className="text-neutral-500 font-body text-center max-w-md">
            Hay bat dau mua sam de tao don hang dau tien cua ban.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center justify-center h-12 px-8 rounded-xl bg-primary-700 text-white font-medium hover:bg-primary-800 transition-colors"
          >
            Mua sam ngay
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {orders.map((order) => {
              const orderStatus = ORDER_STATUS_CONFIG[order.status];
              const paymentStatus = PAYMENT_STATUS_CONFIG[order.paymentStatus];
              const itemCount = getTotalItems(order);

              return (
                <Link
                  key={order.id}
                  href={`/account/orders/${order.orderNumber}`}
                  className="block bg-white rounded-xl border border-neutral-200 p-5 hover:border-primary-700/30 hover:shadow-sm transition-all"
                >
                  {/* Header row */}
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <Package className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                      <span className="font-body font-semibold text-primary-700">
                        {order.orderNumber}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {orderStatus && (
                        <span
                          className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-body font-medium",
                            orderStatus.bg,
                            orderStatus.text
                          )}
                        >
                          {orderStatus.label}
                        </span>
                      )}
                      {paymentStatus && (
                        <span
                          className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-body font-medium",
                            paymentStatus.bg,
                            paymentStatus.text
                          )}
                        >
                          {paymentStatus.label}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Details row */}
                  <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-4 text-neutral-500 font-body">
                      <span>{formatDate(order.createdAt)}</span>
                      {itemCount > 0 && (
                        <span>{itemCount} san pham</span>
                      )}
                    </div>
                    <span className="font-body font-semibold text-neutral-900">
                      {formatVND(order.total)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between py-6">
              <div className="font-body text-sm text-neutral-600">
                Trang {currentPage} / {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-neutral-300 rounded-lg hover:border-primary-700 hover:text-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Trang truoc"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-2 border border-neutral-300 rounded-lg hover:border-primary-700 hover:text-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Trang sau"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function OrderHistoryPageRoute() {
  return <OrderHistoryPage />;
}
