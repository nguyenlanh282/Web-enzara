"use client";

import { useEffect, useState, useCallback } from "react";
import { apiClient, ApiError } from "@/lib/api";
import { Breadcrumbs } from "@/components/storefront/shared/Breadcrumbs";
import {
  Loader2,
  AlertCircle,
  Gift,
  Star,
  Gem,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BalanceResponse {
  totalEarned: number;
  totalRedeemed: number;
  currentBalance: number;
  tier: string;
  tierMultiplier: number;
  tierFreeShip: boolean;
  nextTier: string | null;
  pointsToNextTier: number;
}

interface LoyaltyRecord {
  id: string;
  userId: string;
  points: number;
  type: string;
  description: string;
  orderId: string | null;
  expiresAt: string | null;
  createdAt: string;
}

interface HistoryResponse {
  data: LoyaltyRecord[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface RedeemResponse {
  discount: number;
  remainingBalance: number;
}

function formatVND(value: number): string {
  return new Intl.NumberFormat("vi-VN").format(value) + "d";
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const TIER_CONFIG: Record<string, { color: string; bgColor: string; borderColor: string; icon: typeof Star; label: string }> = {
  Bac: {
    color: "text-neutral-600",
    bgColor: "bg-neutral-100",
    borderColor: "border-neutral-300",
    icon: Star,
    label: "Bac",
  },
  Vang: {
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-300",
    icon: Star,
    label: "Vang",
  },
  "Kim Cuong": {
    color: "text-sky-600",
    bgColor: "bg-sky-50",
    borderColor: "border-sky-300",
    icon: Gem,
    label: "Kim Cuong",
  },
};

const TIER_BENEFITS: Record<string, string[]> = {
  Bac: ["Tich diem 1x cho moi don hang", "Doi diem lay giam gia"],
  Vang: [
    "Tich diem 1.5x cho moi don hang",
    "Doi diem lay giam gia",
    "Uu dai danh rieng cho thanh vien Vang",
  ],
  "Kim Cuong": [
    "Tich diem 2x cho moi don hang",
    "Doi diem lay giam gia",
    "Mien phi van chuyen moi don hang",
    "Uu dai danh rieng cho thanh vien Kim Cuong",
  ],
};

export function LoyaltyPage() {
  const [balance, setBalance] = useState<BalanceResponse | null>(null);
  const [history, setHistory] = useState<LoyaltyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [redeemAmount, setRedeemAmount] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    try {
      const data = await apiClient.get<BalanceResponse>("/loyalty/balance");
      setBalance(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Khong the tai thong tin tich diem");
      }
    }
  }, []);

  const fetchHistory = useCallback(async (page: number) => {
    setHistoryLoading(true);
    try {
      const data = await apiClient.get<HistoryResponse>(
        `/loyalty/history?page=${page}&limit=10`
      );
      setHistory(data.data || []);
      setTotalPages(data.meta?.totalPages || 1);
    } catch {
      // silently fail for history
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    async function init() {
      setLoading(true);
      await fetchBalance();
      await fetchHistory(1);
      setLoading(false);
    }
    init();
  }, [fetchBalance, fetchHistory]);

  useEffect(() => {
    if (!loading) {
      fetchHistory(currentPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  async function handleRedeem() {
    const points = parseInt(redeemAmount, 10);
    if (isNaN(points) || points <= 0) {
      setRedeemError("Vui long nhap so diem hop le");
      return;
    }
    if (points < 1000) {
      setRedeemError("Doi toi thieu 1.000 diem");
      return;
    }
    if (balance && points > balance.currentBalance) {
      setRedeemError("Khong du diem de doi");
      return;
    }

    setRedeeming(true);
    setRedeemError(null);
    setRedeemSuccess(null);

    try {
      const result = await apiClient.post<RedeemResponse>("/loyalty/redeem", {
        points,
      });
      setRedeemSuccess(
        `Doi thanh cong! Ban nhan duoc ${formatVND(result.discount)} giam gia. So du con lai: ${result.remainingBalance.toLocaleString("vi-VN")} diem`
      );
      setRedeemAmount("");
      await fetchBalance();
      await fetchHistory(currentPage);
    } catch (err) {
      if (err instanceof ApiError) {
        setRedeemError(err.message);
      } else {
        setRedeemError("Khong the doi diem. Vui long thu lai sau.");
      }
    } finally {
      setRedeeming(false);
    }
  }

  const redeemPointsNum = parseInt(redeemAmount, 10);
  const redeemValue =
    !isNaN(redeemPointsNum) && redeemPointsNum > 0
      ? redeemPointsNum * 10
      : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-primary-700 animate-spin" />
      </div>
    );
  }

  if (error && !balance) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-red-600">
        <AlertCircle className="w-5 h-5" />
        <span className="font-body">{error}</span>
      </div>
    );
  }

  const tierConfig = balance ? TIER_CONFIG[balance.tier] || TIER_CONFIG["Bac"] : TIER_CONFIG["Bac"];
  const TierIcon = tierConfig.icon;
  const benefits = balance ? TIER_BENEFITS[balance.tier] || TIER_BENEFITS["Bac"] : TIER_BENEFITS["Bac"];

  // Progress bar calculation
  let progressPercent = 100;
  if (balance && balance.nextTier) {
    const currentTierMin =
      balance.tier === "Bac" ? 0 : balance.tier === "Vang" ? 1000 : 5000;
    const nextTierMin =
      balance.nextTier === "Vang" ? 1000 : balance.nextTier === "Kim Cuong" ? 5000 : 0;
    const range = nextTierMin - currentTierMin;
    const progress = balance.totalEarned - currentTierMin;
    progressPercent = range > 0 ? Math.min((progress / range) * 100, 100) : 100;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-2">
      <Breadcrumbs
        items={[
          { label: "Tai khoan", href: "/account" },
          { label: "Tich diem" },
        ]}
      />

      <h1 className="text-2xl font-heading font-bold text-neutral-900 mb-6">
        Chuong trinh tich diem
      </h1>

      {/* Balance + Tier Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Balance Card */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Gift className="w-5 h-5 text-primary-700" />
            <span className="text-sm font-body text-neutral-500">
              So du hien tai
            </span>
          </div>
          <p className="text-4xl font-heading font-bold text-primary-700 mb-2">
            {balance?.currentBalance.toLocaleString("vi-VN") || "0"}
          </p>
          <p className="text-sm font-body text-neutral-400">diem</p>

          <div className="mt-4 pt-4 border-t border-neutral-100 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-body text-neutral-400">Tong tich</p>
              <p className="text-sm font-heading font-bold text-green-600">
                +{balance?.totalEarned.toLocaleString("vi-VN") || "0"}
              </p>
            </div>
            <div>
              <p className="text-xs font-body text-neutral-400">Da doi</p>
              <p className="text-sm font-heading font-bold text-red-500">
                -{balance?.totalRedeemed.toLocaleString("vi-VN") || "0"}
              </p>
            </div>
          </div>
        </div>

        {/* Tier Card */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  tierConfig.bgColor
                )}
              >
                <TierIcon className={cn("w-5 h-5", tierConfig.color)} />
              </div>
              <div>
                <p className="text-sm font-body text-neutral-500">
                  Hang thanh vien
                </p>
                <p
                  className={cn(
                    "text-lg font-heading font-bold",
                    tierConfig.color
                  )}
                >
                  {tierConfig.label}
                </p>
              </div>
            </div>
            {balance?.tierFreeShip && (
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-50 border border-green-200">
                <Truck className="w-4 h-4 text-green-600" />
                <span className="text-xs font-body font-medium text-green-600">
                  Free Ship
                </span>
              </div>
            )}
          </div>

          {/* Progress bar */}
          {balance?.nextTier && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-body text-neutral-500">
                  Tien trinh len {balance.nextTier}
                </span>
                <span className="text-xs font-body text-neutral-500">
                  Con {balance.pointsToNextTier.toLocaleString("vi-VN")} diem
                </span>
              </div>
              <div className="w-full bg-neutral-100 rounded-full h-2.5">
                <div
                  className={cn(
                    "h-2.5 rounded-full transition-all duration-500",
                    balance.tier === "Bac"
                      ? "bg-neutral-500"
                      : "bg-amber-500"
                  )}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Tier Benefits */}
          <div className="mt-4">
            <p className="text-sm font-heading font-bold text-neutral-700 mb-2">
              Quyen loi cua ban
            </p>
            <ul className="space-y-1.5">
              {benefits.map((benefit, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-sm font-body text-neutral-600"
                >
                  <span className="text-primary-700 mt-0.5">&#8226;</span>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          {/* Tier multiplier badge */}
          <div className="mt-4 pt-4 border-t border-neutral-100">
            <span
              className={cn(
                "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-body font-medium",
                tierConfig.bgColor,
                tierConfig.color,
                "border",
                tierConfig.borderColor
              )}
            >
              Nhan {balance?.tierMultiplier || 1}x diem moi don hang
            </span>
          </div>
        </div>
      </div>

      {/* Redeem Section */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-8">
        <h2 className="text-lg font-heading font-bold text-neutral-900 mb-1">
          Doi diem lay giam gia
        </h2>
        <p className="text-sm font-body text-neutral-500 mb-4">
          Quy doi: 1.000 diem = {formatVND(10000)} giam gia. Toi thieu 1.000
          diem.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <div className="flex-1 w-full">
            <label
              htmlFor="redeemPoints"
              className="block text-sm font-body font-medium text-neutral-700 mb-1"
            >
              So diem muon doi
            </label>
            <input
              id="redeemPoints"
              type="number"
              min={1000}
              step={100}
              value={redeemAmount}
              onChange={(e) => {
                setRedeemAmount(e.target.value);
                setRedeemError(null);
                setRedeemSuccess(null);
              }}
              placeholder="Nhap so diem..."
              className="w-full h-12 px-4 rounded-xl border border-neutral-300 font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            {redeemValue > 0 && (
              <p className="mt-1 text-sm font-body text-primary-700">
                = {formatVND(redeemValue)} giam gia
              </p>
            )}
          </div>
          <button
            onClick={handleRedeem}
            disabled={redeeming || !redeemAmount}
            className="h-12 px-8 rounded-xl bg-primary-700 text-white font-body font-medium hover:bg-primary-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap sm:mt-6"
          >
            {redeeming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Gift className="w-4 h-4" />
            )}
            Doi diem
          </button>
        </div>

        {redeemError && (
          <div className="mt-3 flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="w-4 h-4" />
            {redeemError}
          </div>
        )}
        {redeemSuccess && (
          <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
            <Gift className="w-4 h-4" />
            {redeemSuccess}
          </div>
        )}
      </div>

      {/* History Section */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <h2 className="text-lg font-heading font-bold text-neutral-900 mb-4">
          Lich su tich diem
        </h2>

        {historyLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-primary-700 animate-spin" />
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-12 text-neutral-400">
            <Gift className="h-16 w-16 stroke-1" />
            <p className="text-neutral-500 font-body">
              Chua co lich su tich diem
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm font-body">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="text-left py-3 px-2 font-medium text-neutral-500">
                      Ngay
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-neutral-500">
                      Loai
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-neutral-500">
                      Mo ta
                    </th>
                    <th className="text-right py-3 px-2 font-medium text-neutral-500">
                      Diem
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((record) => (
                    <tr
                      key={record.id}
                      className="border-b border-neutral-100 last:border-0"
                    >
                      <td className="py-3 px-2 text-neutral-600 whitespace-nowrap">
                        {formatDate(record.createdAt)}
                      </td>
                      <td className="py-3 px-2">
                        {record.type === "EARN" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                            <ArrowUpRight className="w-3 h-3" />
                            Tich
                          </span>
                        ) : record.type === "REDEEM" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                            <ArrowDownRight className="w-3 h-3" />
                            Doi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600 border border-neutral-200">
                            Het han
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-neutral-700">
                        {record.description}
                      </td>
                      <td
                        className={cn(
                          "py-3 px-2 text-right font-heading font-bold whitespace-nowrap",
                          record.points > 0
                            ? "text-green-600"
                            : "text-red-500"
                        )}
                      >
                        {record.points > 0 ? "+" : ""}
                        {record.points.toLocaleString("vi-VN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {history.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-neutral-100"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                        record.points > 0 ? "bg-green-50" : "bg-red-50"
                      )}
                    >
                      {record.points > 0 ? (
                        <ArrowUpRight className="w-4 h-4 text-green-600" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-body text-neutral-700 truncate">
                        {record.description}
                      </p>
                      <p className="text-xs font-body text-neutral-400">
                        {formatDate(record.createdAt)}
                      </p>
                    </div>
                  </div>
                  <p
                    className={cn(
                      "text-sm font-heading font-bold flex-shrink-0 ml-2",
                      record.points > 0 ? "text-green-600" : "text-red-500"
                    )}
                  >
                    {record.points > 0 ? "+" : ""}
                    {record.points.toLocaleString("vi-VN")}
                  </p>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-neutral-100">
                <div className="font-body text-sm text-neutral-600">
                  Trang {currentPage} / {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.max(1, p - 1))
                    }
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
    </div>
  );
}

export default function LoyaltyPageRoute() {
  return <LoyaltyPage />;
}
