"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { apiClient, ApiError } from "@/lib/api";
import {
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  FileText,
  Image,
  Settings,
  ArrowUp,
  ArrowDown,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { PieLabelRenderProps } from "recharts";

// ────────────────────────────────────────
// Types
// ────────────────────────────────────────

interface OverviewData {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
  ordersChange: number;
  revenueChange: number;
  customersChange: number;
}

interface RevenueChartItem {
  date: string;
  revenue: number;
  orders: number;
}

interface OrdersByStatusItem {
  status: string;
  count: number;
}

interface TopProductItem {
  productId: string;
  productName: string;
  totalRevenue: number;
  totalQuantity: number;
  image?: string;
}

interface RecentOrderItem {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

interface RevenueByCategoryItem {
  categoryName: string;
  revenue: number;
}

// ────────────────────────────────────────
// Constants
// ────────────────────────────────────────

const CHART_COLORS = {
  primary: "#4A7C59",
  secondary: "#D4A574",
  accent: "#8B5E3C",
  success: "#16a34a",
  warning: "#d97706",
  danger: "#dc2626",
  info: "#2563eb",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#d97706",
  CONFIRMED: "#2563eb",
  PROCESSING: "#7c3aed",
  SHIPPING: "#0891b2",
  DELIVERED: "#16a34a",
  CANCELLED: "#dc2626",
  REFUNDED: "#6b7280",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Cho xac nhan",
  CONFIRMED: "Da xac nhan",
  PROCESSING: "Dang xu ly",
  SHIPPING: "Dang giao",
  DELIVERED: "Da giao",
  CANCELLED: "Da huy",
  REFUNDED: "Da hoan tien",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Chua thanh toan",
  PAID: "Da thanh toan",
  FAILED: "That bai",
  REFUNDED: "Da hoan tien",
};

const CATEGORY_COLORS = [
  "#4A7C59",
  "#D4A574",
  "#8B5E3C",
  "#2563eb",
  "#7c3aed",
  "#0891b2",
  "#d97706",
  "#dc2626",
];

const DATE_RANGE_OPTIONS = [
  { label: "7 ngay", days: 7 },
  { label: "30 ngay", days: 30 },
  { label: "90 ngay", days: 90 },
  { label: "12 thang", days: 365 },
];

const quickLinks = [
  {
    label: "San pham",
    href: "/admin/products",
    icon: Package,
    color: "bg-primary-100 text-primary-700",
  },
  {
    label: "Don hang",
    href: "/admin/orders",
    icon: ShoppingCart,
    color: "bg-secondary-100 text-secondary-700",
  },
  {
    label: "Bai viet",
    href: "/admin/blog",
    icon: FileText,
    color: "bg-blue-100 text-blue-700",
  },
  {
    label: "Media",
    href: "/admin/media",
    icon: Image,
    color: "bg-purple-100 text-purple-700",
  },
  {
    label: "Cai dat",
    href: "/admin/settings/general",
    icon: Settings,
    color: "bg-neutral-100 text-neutral-700",
  },
];

// ────────────────────────────────────────
// Helpers
// ────────────────────────────────────────

function formatVND(value: number): string {
  return new Intl.NumberFormat("vi-VN").format(value) + "d";
}

function formatCompactNumber(n: number): string {
  if (n >= 1_000_000_000) {
    return (Math.round(n / 100_000_000) / 10).toFixed(1) + "B";
  }
  if (n >= 1_000_000) {
    return (Math.round(n / 100_000) / 10).toFixed(1) + "M";
  }
  if (n >= 1_000) {
    return (Math.round(n / 100) / 10).toFixed(1) + "K";
  }
  return n.toString();
}

function formatChartDate(dateStr: string): string {
  const parts = dateStr.split("-");
  return `${parts[2]}/${parts[1]}`;
}

function getDateRange(days: number): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
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

// ────────────────────────────────────────
// Custom Tooltip for Revenue Chart
// ────────────────────────────────────────

function RevenueTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string }>;
  label?: string;
}) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white border border-neutral-200 rounded-lg shadow-lg p-3">
      <p className="font-body text-sm text-neutral-600 mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="font-body text-sm font-medium text-neutral-900">
          {entry.dataKey === "revenue"
            ? `Doanh thu: ${formatVND(entry.value)}`
            : `Don hang: ${entry.value}`}
        </p>
      ))}
    </div>
  );
}

// ────────────────────────────────────────
// Main Component
// ────────────────────────────────────────

export default function AdminDashboardPage() {
  const [dateRangeDays, setDateRangeDays] = useState(30);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [revenueChart, setRevenueChart] = useState<RevenueChartItem[]>([]);
  const [ordersByStatus, setOrdersByStatus] = useState<OrdersByStatusItem[]>(
    []
  );
  const [topProducts, setTopProducts] = useState<TopProductItem[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrderItem[]>([]);
  const [revenueByCategory, setRevenueByCategory] = useState<
    RevenueByCategoryItem[]
  >([]);

  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingRevenue, setLoadingRevenue] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadingTopProducts, setLoadingTopProducts] = useState(true);
  const [loadingRecentOrders, setLoadingRecentOrders] = useState(true);
  const [loadingCategory, setLoadingCategory] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDateRangeData = useCallback(async (days: number) => {
    const { startDate, endDate } = getDateRange(days);
    const params = `startDate=${startDate}&endDate=${endDate}`;

    setLoadingOverview(true);
    setLoadingRevenue(true);
    setError(null);

    try {
      const [overviewRes, revenueRes] = await Promise.all([
        apiClient.get<OverviewData>(`/admin/analytics/overview?${params}`),
        apiClient.get<RevenueChartItem[]>(
          `/admin/analytics/revenue?${params}`
        ),
      ]);
      setOverview(overviewRes);
      setRevenueChart(revenueRes);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Khong the tai du lieu thong ke");
      }
    } finally {
      setLoadingOverview(false);
      setLoadingRevenue(false);
    }
  }, []);

  const fetchStaticData = useCallback(async () => {
    setLoadingStatus(true);
    setLoadingTopProducts(true);
    setLoadingRecentOrders(true);
    setLoadingCategory(true);

    try {
      const [statusRes, productsRes, ordersRes, categoryRes] =
        await Promise.all([
          apiClient.get<OrdersByStatusItem[]>(
            "/admin/analytics/orders-by-status"
          ),
          apiClient.get<TopProductItem[]>(
            "/admin/analytics/top-products?limit=10&sortBy=revenue"
          ),
          apiClient.get<RecentOrderItem[]>(
            "/admin/analytics/recent-orders?limit=10"
          ),
          apiClient.get<RevenueByCategoryItem[]>(
            "/admin/analytics/revenue-by-category"
          ),
        ]);
      setOrdersByStatus(statusRes);
      setTopProducts(productsRes);
      setRecentOrders(ordersRes);
      setRevenueByCategory(categoryRes);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Khong the tai du lieu thong ke");
      }
    } finally {
      setLoadingStatus(false);
      setLoadingTopProducts(false);
      setLoadingRecentOrders(false);
      setLoadingCategory(false);
    }
  }, []);

  useEffect(() => {
    fetchDateRangeData(dateRangeDays);
  }, [dateRangeDays, fetchDateRangeData]);

  useEffect(() => {
    fetchStaticData();
  }, [fetchStaticData]);

  function handleDateRangeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setDateRangeDays(Number(e.target.value));
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-neutral-900">
            Dashboard
          </h1>
          <p className="text-sm font-body text-neutral-500 mt-1">
            Tong quan hoat dong cua cua hang Enzara
          </p>
        </div>
        <select
          value={dateRangeDays}
          onChange={handleDateRangeChange}
          className="px-4 py-2 border border-neutral-200 rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary-700 bg-white"
        >
          {DATE_RANGE_OPTIONS.map((opt) => (
            <option key={opt.days} value={opt.days}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="font-body text-sm">{error}</span>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Don hang"
          value={overview ? overview.totalOrders.toString() : null}
          change={overview?.ordersChange ?? null}
          icon={ShoppingCart}
          color="bg-secondary-100 text-secondary-700"
          loading={loadingOverview}
        />
        <StatCard
          label="Doanh thu"
          value={
            overview ? formatCompactNumber(overview.totalRevenue) : null
          }
          change={overview?.revenueChange ?? null}
          icon={TrendingUp}
          color="bg-green-100 text-green-700"
          loading={loadingOverview}
        />
        <StatCard
          label="Khach hang"
          value={overview ? overview.totalCustomers.toString() : null}
          change={overview?.customersChange ?? null}
          icon={Users}
          color="bg-blue-100 text-blue-700"
          loading={loadingOverview}
        />
        <StatCard
          label="San pham"
          value={overview ? overview.totalProducts.toString() : null}
          change={null}
          icon={Package}
          color="bg-primary-100 text-primary-700"
          loading={loadingOverview}
        />
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5">
        <h2 className="text-lg font-heading font-semibold text-neutral-900 mb-4">
          Doanh thu theo ngay
        </h2>
        {loadingRevenue ? (
          <ChartSkeleton />
        ) : revenueChart.length === 0 ? (
          <EmptyState message="Chua co du lieu doanh thu" />
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatChartDate}
                  tick={{ fontSize: 12, fontFamily: "inherit" }}
                  stroke="#a3a3a3"
                />
                <YAxis
                  tickFormatter={(v: number) => formatCompactNumber(v)}
                  tick={{ fontSize: 12, fontFamily: "inherit" }}
                  stroke="#a3a3a3"
                  width={60}
                />
                <Tooltip content={<RevenueTooltip />} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke={CHART_COLORS.primary}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5, fill: CHART_COLORS.primary }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Orders by Status + Revenue by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders by Status Bar Chart */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <h2 className="text-lg font-heading font-semibold text-neutral-900 mb-4">
            Don hang theo trang thai
          </h2>
          {loadingStatus ? (
            <ChartSkeleton />
          ) : ordersByStatus.length === 0 ? (
            <EmptyState message="Chua co don hang" />
          ) : (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={ordersByStatus.map((item) => ({
                    ...item,
                    label: STATUS_LABELS[item.status] || item.status,
                    fill: STATUS_COLORS[item.status] || "#6b7280",
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fontFamily: "inherit" }}
                    stroke="#a3a3a3"
                  />
                  <YAxis
                    tick={{ fontSize: 12, fontFamily: "inherit" }}
                    stroke="#a3a3a3"
                    allowDecimals={false}
                  />
                  <Tooltip
                    formatter={(value) => [Number(value), "So luong"]}
                    contentStyle={{
                      fontFamily: "inherit",
                      fontSize: 13,
                      borderRadius: 8,
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {ordersByStatus.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={STATUS_COLORS[entry.status] || "#6b7280"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Revenue by Category Pie Chart */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <h2 className="text-lg font-heading font-semibold text-neutral-900 mb-4">
            Doanh thu theo danh muc
          </h2>
          {loadingCategory ? (
            <ChartSkeleton />
          ) : revenueByCategory.length === 0 ? (
            <EmptyState message="Chua co du lieu danh muc" />
          ) : (
            <div className="h-[280px] flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenueByCategory}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="revenue"
                    nameKey="categoryName"
                    label={(props: PieLabelRenderProps & { categoryName?: string }) =>
                      `${props.categoryName || ''} (${((props.percent ?? 0) * 100).toFixed(0)}%)`
                    }
                    labelLine={true}
                  >
                    {revenueByCategory.map((_entry, index) => (
                      <Cell
                        key={index}
                        fill={
                          CATEGORY_COLORS[index % CATEGORY_COLORS.length]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [
                      formatVND(Number(value)),
                      "Doanh thu",
                    ]}
                    contentStyle={{
                      fontFamily: "inherit",
                      fontSize: 13,
                      borderRadius: 8,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="p-5 border-b border-neutral-200">
          <h2 className="text-lg font-heading font-semibold text-neutral-900">
            San pham ban chay
          </h2>
        </div>
        {loadingTopProducts ? (
          <TableSkeleton rows={5} />
        ) : topProducts.length === 0 ? (
          <div className="p-5">
            <EmptyState message="Chua co du lieu san pham" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-5 py-3 text-left font-body font-semibold text-neutral-900 text-sm">
                    #
                  </th>
                  <th className="px-5 py-3 text-left font-body font-semibold text-neutral-900 text-sm">
                    San pham
                  </th>
                  <th className="px-5 py-3 text-right font-body font-semibold text-neutral-900 text-sm">
                    Doanh thu
                  </th>
                  <th className="px-5 py-3 text-right font-body font-semibold text-neutral-900 text-sm">
                    So luong
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {topProducts.map((product, index) => (
                  <tr key={product.productId} className="hover:bg-neutral-50">
                    <td className="px-5 py-3">
                      <span className="font-body text-sm text-neutral-500">
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.productName}
                            className="w-10 h-10 rounded-lg object-cover border border-neutral-200"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center">
                            <Package className="w-5 h-5 text-neutral-400" />
                          </div>
                        )}
                        <span className="font-body text-sm font-medium text-neutral-900 line-clamp-1">
                          {product.productName}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="font-body text-sm font-medium text-neutral-900">
                        {formatVND(product.totalRevenue)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="font-body text-sm text-neutral-600">
                        {product.totalQuantity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="p-5 border-b border-neutral-200 flex items-center justify-between">
          <h2 className="text-lg font-heading font-semibold text-neutral-900">
            Don hang gan day
          </h2>
          <Link
            href="/admin/orders"
            className="font-body text-sm text-primary-700 hover:text-primary-800 font-medium"
          >
            Xem tat ca
          </Link>
        </div>
        {loadingRecentOrders ? (
          <TableSkeleton rows={5} />
        ) : recentOrders.length === 0 ? (
          <div className="p-5">
            <EmptyState message="Chua co don hang nao" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-5 py-3 text-left font-body font-semibold text-neutral-900 text-sm">
                    Ma don
                  </th>
                  <th className="px-5 py-3 text-left font-body font-semibold text-neutral-900 text-sm">
                    Khach hang
                  </th>
                  <th className="px-5 py-3 text-right font-body font-semibold text-neutral-900 text-sm">
                    Tong tien
                  </th>
                  <th className="px-5 py-3 text-left font-body font-semibold text-neutral-900 text-sm">
                    Trang thai
                  </th>
                  <th className="px-5 py-3 text-left font-body font-semibold text-neutral-900 text-sm">
                    Thanh toan
                  </th>
                  <th className="px-5 py-3 text-left font-body font-semibold text-neutral-900 text-sm">
                    Ngay tao
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-neutral-50">
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-body text-sm font-medium text-primary-700 hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-body text-sm text-neutral-900">
                        {order.customerName}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="font-body text-sm font-medium text-neutral-900">
                        {formatVND(order.total)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge
                        label={STATUS_LABELS[order.status] || order.status}
                        color={STATUS_COLORS[order.status] || "#6b7280"}
                      />
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-body text-xs text-neutral-600">
                        {PAYMENT_STATUS_LABELS[order.paymentStatus] ||
                          order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-body text-sm text-neutral-500">
                        {formatDate(order.createdAt)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-lg font-heading font-semibold text-neutral-900 mb-3">
          Truy cap nhanh
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white border border-neutral-200 hover:border-primary-300 hover:shadow-card transition-all"
              >
                <div
                  className={`w-10 h-10 rounded-lg ${link.color} flex items-center justify-center`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-body text-neutral-700">
                  {link.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────
// Sub-Components
// ────────────────────────────────────────

function StatCard({
  label,
  value,
  change,
  icon: Icon,
  color,
  loading,
}: {
  label: string;
  value: string | null;
  change: number | null;
  icon: React.ElementType;
  color: string;
  loading: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-body text-neutral-500">{label}</span>
        <div
          className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center`}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>
      {loading ? (
        <div className="space-y-2">
          <div className="h-8 w-20 bg-neutral-100 rounded animate-pulse" />
          <div className="h-4 w-16 bg-neutral-100 rounded animate-pulse" />
        </div>
      ) : (
        <>
          <div className="text-2xl font-heading font-bold text-neutral-900">
            {value ?? "--"}
          </div>
          {change !== null && (
            <div className="flex items-center gap-1 mt-1">
              {change >= 0 ? (
                <ArrowUp className="w-3.5 h-3.5 text-green-600" />
              ) : (
                <ArrowDown className="w-3.5 h-3.5 text-red-600" />
              )}
              <span
                className={`text-sm font-body font-medium ${
                  change >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {change >= 0 ? "+" : ""}
                {change}%
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatusBadge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-body font-medium text-white"
      style={{ backgroundColor: color }}
    >
      {label}
    </span>
  );
}

function ChartSkeleton() {
  return (
    <div className="h-[280px] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-primary-700 animate-spin" />
    </div>
  );
}

function TableSkeleton({ rows }: { rows: number }) {
  return (
    <div className="p-5 space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-10 bg-neutral-100 rounded animate-pulse"
        />
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-neutral-400">
      <AlertCircle className="w-10 h-10 mb-2" />
      <p className="font-body text-sm">{message}</p>
    </div>
  );
}
