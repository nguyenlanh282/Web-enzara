"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiClient, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  ShoppingCart,
  CreditCard,
  TrendingUp,
  Star,
  ToggleLeft,
  ToggleRight,
  MapPin,
  Eye,
  Plus,
  Minus,
} from "lucide-react";

interface Address {
  id: string;
  fullName: string;
  phone: string;
  address: string;
  ward: string;
  district: string;
  province: string;
  isDefault: boolean;
}

interface OrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
}

interface LoyaltyRecord {
  id: string;
  points: number;
  type: string;
  description: string;
  createdAt: string;
}

interface CustomerDetail {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  avatar: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  addresses: Address[];
  orders: OrderSummary[];
  stats: {
    totalOrders: number;
    totalSpent: number;
    avgOrderValue: number;
  };
  loyalty: {
    balance: number;
    totalEarned: number;
    totalRedeemed: number;
    tier: string;
    nextTier: string | null;
    pointsToNextTier: number;
  };
  loyaltyHistory: LoyaltyRecord[];
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

const TIER_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  Bac: { label: "Bac", bg: "bg-neutral-100", text: "text-neutral-700" },
  Vang: { label: "Vang", bg: "bg-amber-100", text: "text-amber-800" },
  "Kim Cuong": { label: "Kim Cuong", bg: "bg-sky-100", text: "text-sky-800" },
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "Cho xac nhan",
  CONFIRMED: "Da xac nhan",
  PROCESSING: "Dang xu ly",
  SHIPPING: "Dang giao",
  DELIVERED: "Da giao",
  CANCELLED: "Da huy",
  REFUNDED: "Da hoan tien",
};

const LOYALTY_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  EARN: { label: "Tich diem", color: "text-green-600" },
  REDEEM: { label: "Doi diem", color: "text-red-600" },
  ADMIN_ADJUST: { label: "Dieu chinh", color: "text-blue-600" },
  EXPIRE: { label: "Het han", color: "text-neutral-500" },
};

export default function CustomerDetailPage() {
  const params = useParams();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingStatus, setTogglingStatus] = useState(false);

  // Loyalty adjustment form
  const [adjustPoints, setAdjustPoints] = useState("");
  const [adjustDescription, setAdjustDescription] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [adjustSuccess, setAdjustSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  async function fetchCustomer() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<CustomerDetail>(
        `/admin/customers/${customerId}`,
      );
      setCustomer(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Khong the tai thong tin khach hang");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleStatus() {
    if (!customer) return;
    setTogglingStatus(true);
    try {
      const result = await apiClient.patch<{ id: string; isActive: boolean }>(
        `/admin/customers/${customer.id}/status`,
      );
      setCustomer((prev) =>
        prev ? { ...prev, isActive: result.isActive } : prev,
      );
    } catch (err) {
      if (err instanceof ApiError) {
        alert(err.message);
      }
    } finally {
      setTogglingStatus(false);
    }
  }

  async function handleAdjustPoints() {
    if (!customer) return;
    const points = parseInt(adjustPoints, 10);
    if (isNaN(points) || points === 0) {
      setAdjustError("Vui long nhap so diem hop le (khac 0)");
      return;
    }
    if (!adjustDescription.trim()) {
      setAdjustError("Vui long nhap ly do dieu chinh");
      return;
    }

    setAdjusting(true);
    setAdjustError(null);
    setAdjustSuccess(null);
    try {
      await apiClient.post("/admin/loyalty/adjust", {
        userId: customer.id,
        points,
        description: adjustDescription.trim(),
      });
      setAdjustSuccess(
        `Da ${points > 0 ? "cong" : "tru"} ${Math.abs(points)} diem thanh cong`,
      );
      setAdjustPoints("");
      setAdjustDescription("");
      // Refresh customer data
      fetchCustomer();
    } catch (err) {
      if (err instanceof ApiError) {
        setAdjustError(err.message);
      } else {
        setAdjustError("Khong the dieu chinh diem");
      }
    } finally {
      setAdjusting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary-700 animate-spin" />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center gap-2 py-12 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <span className="font-body">{error || "Khong tim thay khach hang"}</span>
        </div>
      </div>
    );
  }

  const tierConfig = TIER_CONFIG[customer.loyalty.tier] || TIER_CONFIG["Bac"];

  // Progress bar calculation
  let progressPercent = 0;
  if (customer.loyalty.nextTier) {
    const currentThreshold = customer.loyalty.tier === "Bac" ? 0 : customer.loyalty.tier === "Vang" ? 1000 : 5000;
    const nextThreshold = customer.loyalty.nextTier === "Vang" ? 1000 : 5000;
    const range = nextThreshold - currentThreshold;
    const progress = customer.loyalty.totalEarned - currentThreshold;
    progressPercent = Math.min(100, Math.round((progress / range) * 100));
  } else {
    progressPercent = 100;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Back + Header */}
      <div className="flex items-start gap-4">
        <Link
          href="/admin/customers"
          className="p-2 text-neutral-600 hover:text-primary-700 hover:bg-neutral-100 rounded-lg transition-colors mt-1"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-4">
            {customer.avatar ? (
              <img
                src={customer.avatar}
                alt={customer.fullName}
                className="w-14 h-14 rounded-full object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="font-heading text-xl font-bold text-primary-700">
                  {customer.fullName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h1 className="font-heading text-2xl font-bold text-neutral-900">
                {customer.fullName}
              </h1>
              <p className="font-body text-neutral-500">{customer.email}</p>
              <p className="font-body text-sm text-neutral-400">
                Tham gia: {formatDate(customer.createdAt)}
                {customer.lastLoginAt && (
                  <> | Dang nhap gan nhat: {formatDate(customer.lastLoginAt)}</>
                )}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={handleToggleStatus}
          disabled={togglingStatus}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl font-body text-sm transition-colors",
            customer.isActive
              ? "bg-green-50 text-green-700 hover:bg-green-100"
              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200",
            togglingStatus && "opacity-50",
          )}
        >
          {customer.isActive ? (
            <ToggleRight className="w-5 h-5" />
          ) : (
            <ToggleLeft className="w-5 h-5" />
          )}
          {customer.isActive ? "Hoat dong" : "Da khoa"}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
            </div>
            <span className="font-body text-sm text-neutral-500">Tong don hang</span>
          </div>
          <p className="font-heading text-2xl font-bold text-neutral-900">
            {customer.stats.totalOrders}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 rounded-lg">
              <CreditCard className="w-5 h-5 text-green-600" />
            </div>
            <span className="font-body text-sm text-neutral-500">Tong chi tieu</span>
          </div>
          <p className="font-heading text-2xl font-bold text-neutral-900">
            {formatVND(customer.stats.totalSpent)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <span className="font-body text-sm text-neutral-500">
              Gia tri TB/don
            </span>
          </div>
          <p className="font-heading text-2xl font-bold text-neutral-900">
            {formatVND(customer.stats.avgOrderValue)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Star className="w-5 h-5 text-amber-600" />
            </div>
            <span className="font-body text-sm text-neutral-500">Diem tich luy</span>
          </div>
          <p className="font-heading text-2xl font-bold text-neutral-900">
            {customer.loyalty.balance.toLocaleString("vi-VN")}
          </p>
        </div>
      </div>

      {/* Tier + Progress */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="font-body text-sm text-neutral-600">Hang thanh vien:</span>
            <span
              className={cn(
                "inline-flex items-center px-3 py-1 rounded-full text-sm font-body font-medium",
                tierConfig.bg,
                tierConfig.text,
              )}
            >
              {tierConfig.label}
            </span>
          </div>
          {customer.loyalty.nextTier && (
            <span className="font-body text-sm text-neutral-500">
              Con {customer.loyalty.pointsToNextTier.toLocaleString("vi-VN")} diem den hang{" "}
              {customer.loyalty.nextTier}
            </span>
          )}
        </div>
        <div className="w-full bg-neutral-100 rounded-full h-2.5">
          <div
            className={cn(
              "h-2.5 rounded-full transition-all",
              customer.loyalty.tier === "Kim Cuong"
                ? "bg-sky-500"
                : customer.loyalty.tier === "Vang"
                  ? "bg-amber-500"
                  : "bg-neutral-400",
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="font-body text-xs text-neutral-400">
            Tong tich: {customer.loyalty.totalEarned.toLocaleString("vi-VN")} diem
          </span>
          <span className="font-body text-xs text-neutral-400">
            Da doi: {customer.loyalty.totalRedeemed.toLocaleString("vi-VN")} diem
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-200">
            <h2 className="font-heading text-lg font-semibold text-neutral-900">
              Don hang gan day
            </h2>
          </div>
          {customer.orders.length === 0 ? (
            <div className="p-5 text-center text-neutral-500 font-body">
              Chua co don hang
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-4 py-2 text-left font-body text-sm font-semibold text-neutral-700">
                      Ma don
                    </th>
                    <th className="px-4 py-2 text-left font-body text-sm font-semibold text-neutral-700">
                      Trang thai
                    </th>
                    <th className="px-4 py-2 text-right font-body text-sm font-semibold text-neutral-700">
                      Tong tien
                    </th>
                    <th className="px-4 py-2 text-right font-body text-sm font-semibold text-neutral-700">
                      Ngay
                    </th>
                    <th className="px-4 py-2 text-right font-body text-sm font-semibold text-neutral-700" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {customer.orders.map((order) => (
                    <tr key={order.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-2">
                        <span className="font-body text-sm font-medium text-primary-700">
                          {order.orderNumber}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <span className="font-body text-sm text-neutral-600">
                          {ORDER_STATUS_LABELS[order.status] || order.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <span className="font-body text-sm font-medium text-neutral-900">
                          {formatVND(order.total)}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <span className="font-body text-xs text-neutral-500">
                          {formatDate(order.createdAt)}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="p-1 text-neutral-400 hover:text-primary-700 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Loyalty History + Adjustment */}
        <div className="space-y-6">
          {/* Adjustment Form */}
          <div className="bg-white rounded-xl border border-neutral-200 p-5">
            <h2 className="font-heading text-lg font-semibold text-neutral-900 mb-4">
              Dieu chinh diem tich luy
            </h2>
            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const current = parseInt(adjustPoints, 10) || 0;
                    setAdjustPoints(String(Math.abs(current)));
                  }}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1.5 rounded-lg font-body text-sm transition-colors",
                    !adjustPoints.startsWith("-")
                      ? "bg-green-100 text-green-700"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200",
                  )}
                >
                  <Plus className="w-4 h-4" /> Cong diem
                </button>
                <button
                  onClick={() => {
                    const current = parseInt(adjustPoints, 10) || 0;
                    setAdjustPoints(String(-Math.abs(current || 1)));
                  }}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1.5 rounded-lg font-body text-sm transition-colors",
                    adjustPoints.startsWith("-")
                      ? "bg-red-100 text-red-700"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200",
                  )}
                >
                  <Minus className="w-4 h-4" /> Tru diem
                </button>
              </div>
              <input
                type="number"
                placeholder="So diem..."
                value={adjustPoints}
                onChange={(e) => setAdjustPoints(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
              />
              <input
                type="text"
                placeholder="Ly do dieu chinh..."
                value={adjustDescription}
                onChange={(e) => setAdjustDescription(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
              />
              {adjustError && (
                <p className="font-body text-sm text-red-600">{adjustError}</p>
              )}
              {adjustSuccess && (
                <p className="font-body text-sm text-green-600">{adjustSuccess}</p>
              )}
              <button
                onClick={handleAdjustPoints}
                disabled={adjusting}
                className="w-full px-4 py-2 bg-primary-700 text-white rounded-xl font-body hover:bg-primary-800 transition-colors disabled:opacity-50"
              >
                {adjusting ? "Dang xu ly..." : "Dieu chinh diem"}
              </button>
            </div>
          </div>

          {/* Loyalty History */}
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-200">
              <h2 className="font-heading text-lg font-semibold text-neutral-900">
                Lich su tich diem
              </h2>
            </div>
            {customer.loyaltyHistory.length === 0 ? (
              <div className="p-5 text-center text-neutral-500 font-body">
                Chua co lich su
              </div>
            ) : (
              <div className="divide-y divide-neutral-200 max-h-[400px] overflow-y-auto">
                {customer.loyaltyHistory.map((record) => {
                  const typeConfig = LOYALTY_TYPE_LABELS[record.type] || {
                    label: record.type,
                    color: "text-neutral-600",
                  };
                  return (
                    <div
                      key={record.id}
                      className="px-5 py-3 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "font-body text-sm font-medium",
                              typeConfig.color,
                            )}
                          >
                            {typeConfig.label}
                          </span>
                        </div>
                        <p className="font-body text-xs text-neutral-500 mt-0.5">
                          {record.description}
                        </p>
                        <p className="font-body text-xs text-neutral-400 mt-0.5">
                          {formatDate(record.createdAt)}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "font-body font-semibold text-sm",
                          record.points > 0
                            ? "text-green-600"
                            : "text-red-600",
                        )}
                      >
                        {record.points > 0 ? "+" : ""}
                        {record.points.toLocaleString("vi-VN")}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Addresses */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-200">
          <h2 className="font-heading text-lg font-semibold text-neutral-900">
            Dia chi
          </h2>
        </div>
        {customer.addresses.length === 0 ? (
          <div className="p-5 text-center text-neutral-500 font-body">
            Chua co dia chi
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
            {customer.addresses.map((addr) => (
              <div
                key={addr.id}
                className={cn(
                  "border rounded-xl p-4",
                  addr.isDefault
                    ? "border-primary-700 bg-primary-50"
                    : "border-neutral-200",
                )}
              >
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-body font-medium text-neutral-900">
                        {addr.fullName}
                      </span>
                      {addr.isDefault && (
                        <span className="font-body text-xs text-primary-700 bg-primary-100 px-1.5 py-0.5 rounded">
                          Mac dinh
                        </span>
                      )}
                    </div>
                    <p className="font-body text-sm text-neutral-500 mt-0.5">
                      {addr.phone}
                    </p>
                    <p className="font-body text-sm text-neutral-600 mt-1">
                      {addr.address}, {addr.ward}, {addr.district}, {addr.province}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
