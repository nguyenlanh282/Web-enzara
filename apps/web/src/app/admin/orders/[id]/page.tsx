"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { OrderTimeline } from "@/components/admin/orders/OrderTimeline";
import { OrderInvoice } from "@/components/admin/orders/OrderInvoice";
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  Send,
  RefreshCw,
  Printer,
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
  createdBy?: string;
  createdAt: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customer?: { fullName: string; email: string; phone: string };
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
  shippingEmail?: string;
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

const ALL_ORDER_STATUSES: Array<Order["status"]> = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPING",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status update form
  const [newStatus, setNewStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusSuccess, setStatusSuccess] = useState<string | null>(null);

  // Add note form
  const [noteText, setNoteText] = useState("");
  const [noteAdding, setNoteAdding] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);
  const [noteSuccess, setNoteSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  async function fetchOrder() {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<Order>(`/admin/orders/${orderId}`);
      setOrder(response);
      setNewStatus(response.status);
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

  async function handleStatusUpdate() {
    if (!newStatus || !order) return;
    if (newStatus === order.status && !statusNote.trim()) return;

    setStatusUpdating(true);
    setStatusError(null);
    setStatusSuccess(null);
    try {
      await apiClient.put(`/admin/orders/${orderId}/status`, {
        status: newStatus,
        note: statusNote.trim() || undefined,
      });
      setStatusSuccess("Cap nhat trang thai thanh cong");
      setStatusNote("");
      await fetchOrder();
    } catch (err) {
      if (err instanceof ApiError) {
        setStatusError(err.message);
      } else {
        setStatusError("Khong the cap nhat trang thai");
      }
    } finally {
      setStatusUpdating(false);
    }
  }

  async function handleAddNote() {
    if (!noteText.trim()) return;

    setNoteAdding(true);
    setNoteError(null);
    setNoteSuccess(null);
    try {
      await apiClient.post(`/admin/orders/${orderId}/timeline`, {
        note: noteText.trim(),
      });
      setNoteSuccess("Them ghi chu thanh cong");
      setNoteText("");
      await fetchOrder();
    } catch (err) {
      if (err instanceof ApiError) {
        setNoteError(err.message);
      } else {
        setNoteError("Khong the them ghi chu");
      }
    } finally {
      setNoteAdding(false);
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
      <div className="p-6 space-y-4">
        <button
          onClick={() => router.push("/admin/orders")}
          className="inline-flex items-center gap-2 font-body text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lai danh sach
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

  return (
    <>
    <div className="p-6 space-y-6 no-print">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/admin/orders")}
          className="inline-flex items-center gap-2 font-body text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lai danh sach
        </button>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 rounded-xl font-body text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
        >
          <Printer className="w-4 h-4" />
          In hoa don
        </button>
      </div>

      {/* Order header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-neutral-900">
            Don hang #{order.orderNumber}
          </h1>
          <p className="font-body text-neutral-600 mt-1">
            Ngay tao: {formatDate(order.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-3">
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

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer info */}
          <div className="bg-white rounded-xl border border-neutral-200 p-5">
            <h2 className="font-heading text-lg font-semibold text-neutral-900 mb-4">
              Thong tin khach hang
            </h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-body text-sm text-neutral-500 w-24">
                  Ho ten:
                </span>
                <span className="font-body text-sm text-neutral-900">
                  {order.customer?.fullName || "-"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-body text-sm text-neutral-500 w-24">
                  SDT:
                </span>
                <span className="font-body text-sm text-neutral-900">
                  {order.customer?.phone || "-"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-body text-sm text-neutral-500 w-24">
                  Email:
                </span>
                <span className="font-body text-sm text-neutral-900">
                  {order.customer?.email || "-"}
                </span>
              </div>
            </div>
          </div>

          {/* Shipping address */}
          <div className="bg-white rounded-xl border border-neutral-200 p-5">
            <h2 className="font-heading text-lg font-semibold text-neutral-900 mb-4">
              Dia chi giao hang
            </h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-body text-sm text-neutral-500 w-24">
                  Nguoi nhan:
                </span>
                <span className="font-body text-sm text-neutral-900">
                  {order.shippingName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-body text-sm text-neutral-500 w-24">
                  SDT:
                </span>
                <span className="font-body text-sm text-neutral-900">
                  {order.shippingPhone}
                </span>
              </div>
              {order.shippingEmail && (
                <div className="flex items-center gap-2">
                  <span className="font-body text-sm text-neutral-500 w-24">
                    Email:
                  </span>
                  <span className="font-body text-sm text-neutral-900">
                    {order.shippingEmail}
                  </span>
                </div>
              )}
              <div className="flex items-start gap-2">
                <span className="font-body text-sm text-neutral-500 w-24 flex-shrink-0">
                  Dia chi:
                </span>
                <span className="font-body text-sm text-neutral-900">
                  {order.shippingAddress}, {order.shippingWard},{" "}
                  {order.shippingDistrict}, {order.shippingProvince}
                </span>
              </div>
              {order.trackingNumber && (
                <div className="flex items-center gap-2">
                  <span className="font-body text-sm text-neutral-500 w-24">
                    Ma van don:
                  </span>
                  <span className="font-body text-sm text-neutral-900 font-medium">
                    {order.trackingNumber}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="font-body text-sm text-neutral-500 w-24">
                  Thanh toan:
                </span>
                <span className="font-body text-sm text-neutral-900">
                  {PAYMENT_METHOD_LABELS[order.paymentMethod] ||
                    order.paymentMethod}
                </span>
              </div>
            </div>
          </div>

          {/* Order items */}
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <div className="p-5 border-b border-neutral-200">
              <h2 className="font-heading text-lg font-semibold text-neutral-900">
                San pham
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-body font-semibold text-neutral-900">
                      San pham
                    </th>
                    <th className="px-4 py-3 text-left font-body font-semibold text-neutral-900">
                      SKU
                    </th>
                    <th className="px-4 py-3 text-right font-body font-semibold text-neutral-900">
                      Don gia
                    </th>
                    <th className="px-4 py-3 text-right font-body font-semibold text-neutral-900">
                      SL
                    </th>
                    <th className="px-4 py-3 text-right font-body font-semibold text-neutral-900">
                      Thanh tien
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {order.items.map((item) => (
                    <tr key={item.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-body font-medium text-neutral-900">
                            {item.productName}
                          </div>
                          {item.variantName && (
                            <div className="font-body text-sm text-neutral-500">
                              {item.variantName}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-body text-sm text-neutral-600">
                          {item.sku || "-"}
                        </span>
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
          {/* Status update card */}
          <div className="bg-white rounded-xl border border-neutral-200 p-5">
            <h2 className="font-heading text-lg font-semibold text-neutral-900 mb-4">
              Cap nhat trang thai
            </h2>
            <div className="space-y-3">
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-200 rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary-700"
              >
                {ALL_ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {ORDER_STATUS_CONFIG[s]?.label || s}
                  </option>
                ))}
              </select>
              <textarea
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="Ghi chu (tuy chon)..."
                rows={3}
                className="w-full px-3 py-2 border border-neutral-200 rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary-700 resize-none"
              />
              {statusError && (
                <p className="font-body text-sm text-red-600">{statusError}</p>
              )}
              {statusSuccess && (
                <p className="font-body text-sm text-green-600">
                  {statusSuccess}
                </p>
              )}
              <button
                onClick={handleStatusUpdate}
                disabled={statusUpdating}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-700 text-white rounded-xl font-body font-medium hover:bg-primary-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {statusUpdating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Cap nhat
              </button>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl border border-neutral-200 p-5">
            <h2 className="font-heading text-lg font-semibold text-neutral-900 mb-4">
              Lich su trang thai
            </h2>
            <OrderTimeline entries={order.timeline || []} />
          </div>

          {/* Add note */}
          <div className="bg-white rounded-xl border border-neutral-200 p-5">
            <h2 className="font-heading text-lg font-semibold text-neutral-900 mb-4">
              Them ghi chu
            </h2>
            <div className="space-y-3">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Nhap ghi chu..."
                rows={3}
                className="w-full px-3 py-2 border border-neutral-200 rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary-700 resize-none"
              />
              {noteError && (
                <p className="font-body text-sm text-red-600">{noteError}</p>
              )}
              {noteSuccess && (
                <p className="font-body text-sm text-green-600">
                  {noteSuccess}
                </p>
              )}
              <button
                onClick={handleAddNote}
                disabled={noteAdding || !noteText.trim()}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-700 text-white rounded-xl font-body font-medium hover:bg-primary-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {noteAdding ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Them ghi chu
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Print-only invoice */}
    <OrderInvoice order={order} />
    </>
  );
}
