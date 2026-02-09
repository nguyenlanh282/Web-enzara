"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Loader2,
  AlertCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";

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
  total: number;
  createdAt: string;
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

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter, paymentStatusFilter, startDate, endDate]);

  async function fetchOrders() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      });
      if (searchQuery) {
        params.append("search", searchQuery);
      }
      if (statusFilter) {
        params.append("status", statusFilter);
      }
      if (paymentStatusFilter) {
        params.append("paymentStatus", paymentStatusFilter);
      }
      if (startDate) {
        params.append("startDate", startDate);
      }
      if (endDate) {
        params.append("endDate", endDate);
      }
      const response = await apiClient.get<{
        orders: Order[];
        total: number;
        page: number;
        totalPages: number;
      }>(`/admin/orders?${params}`);
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

  function handleSearch() {
    setCurrentPage(1);
    fetchOrders();
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      handleSearch();
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-neutral-900">
          Quan ly don hang
        </h1>
        <p className="font-body text-neutral-600 mt-1">
          Quan ly va theo doi trang thai don hang
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[240px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Tim theo ma don hang hoac SDT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
          >
            <option value="">Tat ca trang thai</option>
            <option value="PENDING">Cho xac nhan</option>
            <option value="CONFIRMED">Da xac nhan</option>
            <option value="PROCESSING">Dang xu ly</option>
            <option value="SHIPPING">Dang giao</option>
            <option value="DELIVERED">Da giao</option>
            <option value="CANCELLED">Da huy</option>
            <option value="REFUNDED">Da hoan tien</option>
          </select>

          {/* Payment status filter */}
          <select
            value={paymentStatusFilter}
            onChange={(e) => {
              setPaymentStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
          >
            <option value="">Tat ca thanh toan</option>
            <option value="PENDING">Chua thanh toan</option>
            <option value="PAID">Da thanh toan</option>
            <option value="FAILED">That bai</option>
            <option value="REFUNDED">Da hoan tien</option>
          </select>
        </div>

        {/* Date range */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="font-body text-sm text-neutral-600">Tu:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-neutral-200 rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary-700"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="font-body text-sm text-neutral-600">Den:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-neutral-200 rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary-700"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary-700 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center gap-2 py-12 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <span className="font-body">{error}</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
            <AlertCircle className="w-12 h-12 mb-2" />
            <p className="font-body">Khong co don hang nao</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-body font-semibold text-neutral-900">
                      Ma don
                    </th>
                    <th className="px-4 py-3 text-left font-body font-semibold text-neutral-900">
                      Khach hang
                    </th>
                    <th className="px-4 py-3 text-right font-body font-semibold text-neutral-900">
                      Tong tien
                    </th>
                    <th className="px-4 py-3 text-left font-body font-semibold text-neutral-900">
                      Thanh toan
                    </th>
                    <th className="px-4 py-3 text-left font-body font-semibold text-neutral-900">
                      Trang thai
                    </th>
                    <th className="px-4 py-3 text-left font-body font-semibold text-neutral-900">
                      Ngay tao
                    </th>
                    <th className="px-4 py-3 text-right font-body font-semibold text-neutral-900">
                      Thao tac
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {orders.map((order) => {
                    const orderStatus = ORDER_STATUS_CONFIG[order.status];
                    const paymentStatus =
                      PAYMENT_STATUS_CONFIG[order.paymentStatus];

                    return (
                      <tr
                        key={order.id}
                        className="hover:bg-neutral-50 cursor-pointer"
                        onClick={() =>
                          router.push(`/admin/orders/${order.id}`)
                        }
                      >
                        <td className="px-4 py-3">
                          <span className="font-body font-medium text-primary-700">
                            {order.orderNumber}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-body font-medium text-neutral-900">
                              {order.customer?.fullName || "-"}
                            </div>
                            <div className="font-body text-sm text-neutral-500">
                              {order.customer?.phone || ""}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-body font-medium text-neutral-900">
                            {formatVND(order.total)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
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
                        </td>
                        <td className="px-4 py-3">
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
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-body text-sm text-neutral-600">
                            {formatDate(order.createdAt)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/admin/orders/${order.id}`}
                              className="p-2 text-neutral-600 hover:text-primary-700 hover:bg-neutral-100 rounded-lg transition-colors"
                              title="Xem chi tiet"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200">
                <div className="font-body text-sm text-neutral-600">
                  Trang {currentPage} / {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.max(1, p - 1))
                    }
                    disabled={currentPage === 1}
                    className="p-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="p-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
