"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { apiClient, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Loader2,
  AlertCircle,
  Users,
  Coins,
  TrendingUp,
  TrendingDown,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface LoyaltyOverview {
  totalActiveMembers: number;
  totalPointsInCirculation: number;
  issuedThisMonth: number;
  redeemedThisMonth: number;
  tierDistribution: Record<string, number>;
}

interface LoyaltyTransaction {
  id: string;
  userId: string;
  points: number;
  type: string;
  description: string;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
}

interface SearchUser {
  id: string;
  fullName: string;
  email: string;
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

const TIER_CONFIG: Record<string, { bg: string; text: string; bar: string }> = {
  Bac: { bg: "bg-neutral-100", text: "text-neutral-700", bar: "bg-neutral-400" },
  Vang: { bg: "bg-amber-100", text: "text-amber-800", bar: "bg-amber-500" },
  "Kim Cuong": { bg: "bg-sky-100", text: "text-sky-800", bar: "bg-sky-500" },
};

const LOYALTY_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  EARN: { label: "Tich diem", color: "text-green-600" },
  REDEEM: { label: "Doi diem", color: "text-red-600" },
  ADMIN_ADJUST: { label: "Dieu chinh", color: "text-blue-600" },
  EXPIRE: { label: "Het han", color: "text-neutral-500" },
};

export default function LoyaltyPage() {
  const [overview, setOverview] = useState<LoyaltyOverview | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [txLoading, setTxLoading] = useState(true);
  const [txError, setTxError] = useState<string | null>(null);
  const [txPage, setTxPage] = useState(1);
  const [txTotalPages, setTxTotalPages] = useState(1);

  // Manual adjustment form
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
  const [adjustPoints, setAdjustPoints] = useState("");
  const [adjustDescription, setAdjustDescription] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [adjustSuccess, setAdjustSuccess] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    setOverviewLoading(true);
    setOverviewError(null);
    try {
      const data = await apiClient.get<LoyaltyOverview>("/admin/loyalty/overview");
      setOverview(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setOverviewError(err.message);
      } else {
        setOverviewError("Khong the tai thong tin tong quan");
      }
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    setTxLoading(true);
    setTxError(null);
    try {
      const params = new URLSearchParams({
        page: txPage.toString(),
        limit: "20",
      });
      const data = await apiClient.get<{
        items: LoyaltyTransaction[];
        total: number;
        page: number;
        totalPages: number;
      }>(`/admin/loyalty/transactions?${params}`);
      setTransactions(data.items || []);
      setTxTotalPages(data.totalPages || 1);
    } catch (err) {
      if (err instanceof ApiError) {
        setTxError(err.message);
      } else {
        setTxError("Khong the tai lich su giao dich");
      }
    } finally {
      setTxLoading(false);
    }
  }, [txPage]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  async function handleSearchUser() {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = await apiClient.get<SearchUser[]>(
        `/admin/customers/search?q=${encodeURIComponent(searchQuery)}`,
      );
      setSearchResults(results || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      handleSearchUser();
    }
  }

  async function handleAdjust() {
    if (!selectedUser) {
      setAdjustError("Vui long chon khach hang");
      return;
    }
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
        userId: selectedUser.id,
        points,
        description: adjustDescription.trim(),
      });
      setAdjustSuccess(
        `Da ${points > 0 ? "cong" : "tru"} ${Math.abs(points)} diem cho ${selectedUser.fullName}`,
      );
      setAdjustPoints("");
      setAdjustDescription("");
      setSelectedUser(null);
      setSearchQuery("");
      setSearchResults([]);
      fetchOverview();
      fetchTransactions();
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

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-neutral-900">
          Quan ly tich diem
        </h1>
        <p className="font-body text-neutral-600 mt-1">
          Tong quan chuong trinh tich diem va dieu chinh diem thu cong
        </p>
      </div>

      {/* Overview Stats */}
      {overviewLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 text-primary-700 animate-spin" />
        </div>
      ) : overviewError ? (
        <div className="flex items-center justify-center gap-2 py-8 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <span className="font-body">{overviewError}</span>
        </div>
      ) : overview ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-neutral-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <span className="font-body text-sm text-neutral-500">
                  Thanh vien tich cuc
                </span>
              </div>
              <p className="font-heading text-2xl font-bold text-neutral-900">
                {overview.totalActiveMembers.toLocaleString("vi-VN")}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-neutral-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-amber-50 rounded-lg">
                  <Coins className="w-5 h-5 text-amber-600" />
                </div>
                <span className="font-body text-sm text-neutral-500">
                  Tong diem luu hanh
                </span>
              </div>
              <p className="font-heading text-2xl font-bold text-neutral-900">
                {overview.totalPointsInCirculation.toLocaleString("vi-VN")}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-neutral-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-50 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <span className="font-body text-sm text-neutral-500">
                  Phat hanh thang nay
                </span>
              </div>
              <p className="font-heading text-2xl font-bold text-neutral-900">
                {overview.issuedThisMonth.toLocaleString("vi-VN")}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-neutral-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-red-50 rounded-lg">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                </div>
                <span className="font-body text-sm text-neutral-500">
                  Da doi thang nay
                </span>
              </div>
              <p className="font-heading text-2xl font-bold text-neutral-900">
                {overview.redeemedThisMonth.toLocaleString("vi-VN")}
              </p>
            </div>
          </div>

          {/* Tier Distribution */}
          <div className="bg-white rounded-xl border border-neutral-200 p-5">
            <h2 className="font-heading text-lg font-semibold text-neutral-900 mb-4">
              Phan bo hang thanh vien
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(overview.tierDistribution).map(([tier, count]) => {
                const config = TIER_CONFIG[tier] || TIER_CONFIG["Bac"];
                const totalMembers = overview.totalActiveMembers || 1;
                const percentage = Math.round((count / totalMembers) * 100);

                return (
                  <div
                    key={tier}
                    className="flex items-center gap-4 p-4 rounded-xl border border-neutral-200"
                  >
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-body font-medium",
                            config.bg,
                            config.text,
                          )}
                        >
                          {tier}
                        </span>
                        <span className="font-body text-sm font-semibold text-neutral-900">
                          {count}
                        </span>
                      </div>
                      <div className="w-full bg-neutral-100 rounded-full h-2">
                        <div
                          className={cn("h-2 rounded-full transition-all", config.bar)}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="font-body text-xs text-neutral-400 mt-1">
                        {percentage}% thanh vien
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : null}

      {/* Manual Adjustment Form */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5">
        <h2 className="font-heading text-lg font-semibold text-neutral-900 mb-4">
          Dieu chinh diem thu cong
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User Search */}
          <div className="space-y-3">
            <label className="font-body text-sm font-medium text-neutral-700">
              Chon khach hang
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Tim theo ten hoac email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (selectedUser) setSelectedUser(null);
                }}
                onKeyDown={handleSearchKeyDown}
                className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary-700"
              />
            </div>
            <button
              onClick={handleSearchUser}
              disabled={searching || !searchQuery.trim()}
              className="px-4 py-1.5 bg-neutral-100 text-neutral-700 rounded-lg font-body text-sm hover:bg-neutral-200 transition-colors disabled:opacity-50"
            >
              {searching ? "Dang tim..." : "Tim kiem"}
            </button>

            {/* Search Results Dropdown */}
            {searchResults.length > 0 && !selectedUser && (
              <div className="border border-neutral-200 rounded-xl max-h-[200px] overflow-y-auto">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => {
                      setSelectedUser(user);
                      setSearchQuery(user.fullName);
                      setSearchResults([]);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-neutral-50 transition-colors border-b border-neutral-100 last:border-b-0"
                  >
                    <span className="font-body text-sm font-medium text-neutral-900">
                      {user.fullName}
                    </span>
                    <span className="font-body text-xs text-neutral-500 ml-2">
                      {user.email}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {selectedUser && (
              <div className="flex items-center gap-2 px-3 py-2 bg-primary-50 border border-primary-200 rounded-xl">
                <span className="font-body text-sm text-primary-700 font-medium">
                  {selectedUser.fullName}
                </span>
                <span className="font-body text-xs text-primary-500">
                  ({selectedUser.email})
                </span>
                <button
                  onClick={() => {
                    setSelectedUser(null);
                    setSearchQuery("");
                  }}
                  className="ml-auto text-primary-500 hover:text-primary-700"
                >
                  &times;
                </button>
              </div>
            )}
          </div>

          {/* Points + Description */}
          <div className="space-y-3">
            <div>
              <label className="font-body text-sm font-medium text-neutral-700">
                So diem (duong = cong, am = tru)
              </label>
              <input
                type="number"
                placeholder="VD: 100 hoac -50"
                value={adjustPoints}
                onChange={(e) => setAdjustPoints(e.target.value)}
                className="w-full mt-1 px-4 py-2 border border-neutral-200 rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary-700"
              />
            </div>
            <div>
              <label className="font-body text-sm font-medium text-neutral-700">
                Ly do dieu chinh
              </label>
              <input
                type="text"
                placeholder="VD: Thuong diem su kien..."
                value={adjustDescription}
                onChange={(e) => setAdjustDescription(e.target.value)}
                className="w-full mt-1 px-4 py-2 border border-neutral-200 rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary-700"
              />
            </div>

            {adjustError && (
              <p className="font-body text-sm text-red-600">{adjustError}</p>
            )}
            {adjustSuccess && (
              <p className="font-body text-sm text-green-600">{adjustSuccess}</p>
            )}

            <button
              onClick={handleAdjust}
              disabled={adjusting || !selectedUser}
              className="w-full px-4 py-2 bg-primary-700 text-white rounded-xl font-body hover:bg-primary-800 transition-colors disabled:opacity-50"
            >
              {adjusting ? "Dang xu ly..." : "Dieu chinh diem"}
            </button>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-200">
          <h2 className="font-heading text-lg font-semibold text-neutral-900">
            Giao dich gan day
          </h2>
        </div>
        {txLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary-700 animate-spin" />
          </div>
        ) : txError ? (
          <div className="flex items-center justify-center gap-2 py-12 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <span className="font-body">{txError}</span>
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
            <AlertCircle className="w-12 h-12 mb-2" />
            <p className="font-body">Chua co giao dich nao</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-body font-semibold text-neutral-900">
                      Khach hang
                    </th>
                    <th className="px-4 py-3 text-left font-body font-semibold text-neutral-900">
                      Loai
                    </th>
                    <th className="px-4 py-3 text-left font-body font-semibold text-neutral-900">
                      Mo ta
                    </th>
                    <th className="px-4 py-3 text-right font-body font-semibold text-neutral-900">
                      Diem
                    </th>
                    <th className="px-4 py-3 text-right font-body font-semibold text-neutral-900">
                      Ngay
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {transactions.map((tx) => {
                    const typeConfig = LOYALTY_TYPE_LABELS[tx.type] || {
                      label: tx.type,
                      color: "text-neutral-600",
                    };
                    return (
                      <tr key={tx.id} className="hover:bg-neutral-50">
                        <td className="px-4 py-3">
                          <Link
                            href={`/admin/customers/${tx.user.id}`}
                            className="font-body text-sm font-medium text-primary-700 hover:underline"
                          >
                            {tx.user.fullName}
                          </Link>
                          <div className="font-body text-xs text-neutral-500">
                            {tx.user.email}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "font-body text-sm font-medium",
                              typeConfig.color,
                            )}
                          >
                            {typeConfig.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-body text-sm text-neutral-600">
                            {tx.description}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={cn(
                              "font-body font-semibold text-sm",
                              tx.points > 0 ? "text-green-600" : "text-red-600",
                            )}
                          >
                            {tx.points > 0 ? "+" : ""}
                            {tx.points.toLocaleString("vi-VN")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-body text-sm text-neutral-500">
                            {formatDate(tx.createdAt)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {txTotalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200">
                <div className="font-body text-sm text-neutral-600">
                  Trang {txPage} / {txTotalPages}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                    disabled={txPage === 1}
                    className="p-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setTxPage((p) => Math.min(txTotalPages, p + 1))}
                    disabled={txPage === txTotalPages}
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
