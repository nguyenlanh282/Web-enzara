"use client";

import { useEffect, useState, useCallback } from "react";
import { Star, Gift, Sparkles } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN").format(price) + "\u0111";
}

interface LoyaltyBalance {
  currentBalance: number;
  totalEarned: number;
  totalRedeemed: number;
  tier: string;
  tierMultiplier: number;
  tierFreeShip: boolean;
  nextTier: string | null;
  pointsToNextTier: number;
}

interface LoyaltyRedemptionProps {
  onPointsChange: (points: number, discount: number) => void;
}

const TIER_COLORS: Record<string, string> = {
  Bac: "bg-neutral-200 text-neutral-700",
  Vang: "bg-amber-100 text-amber-700",
  "Kim Cuong": "bg-sky-100 text-sky-700",
};

export function LoyaltyRedemption({ onPointsChange }: LoyaltyRedemptionProps) {
  const user = useAuthStore((s) => s.user);
  const [balance, setBalance] = useState<LoyaltyBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState(0);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    apiClient
      .get<LoyaltyBalance>("/loyalty/balance")
      .then((data) => {
        setBalance(data);
      })
      .catch(() => {
        // Silently fail - user may not have loyalty data
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user]);

  const handlePointsChange = useCallback(
    (newPoints: number) => {
      if (!balance) return;
      const clamped = Math.max(0, Math.min(newPoints, balance.currentBalance));
      setPoints(clamped);
      const discount = clamped * 10;
      onPointsChange(clamped, discount);
    },
    [balance, onPointsChange],
  );

  // Don't render for unauthenticated users
  if (!user) return null;

  // Loading state
  if (loading) {
    return (
      <div className="rounded-xl border border-neutral-200 p-5">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-neutral-200 rounded w-1/3" />
          <div className="h-10 bg-neutral-200 rounded" />
        </div>
      </div>
    );
  }

  // No balance or 0 points
  if (!balance || balance.currentBalance <= 0) return null;

  const discount = points * 10;
  const maxDiscount = balance.currentBalance * 10;
  const tierColor = TIER_COLORS[balance.tier] || TIER_COLORS.Bac;

  return (
    <div className="rounded-xl border border-neutral-200 p-5 space-y-4">
      {/* Section title */}
      <div className="flex items-center gap-2">
        <Gift className="h-5 w-5 text-primary-700" />
        <h3 className="text-base font-heading font-bold text-neutral-900">
          Su dung diem tich luy
        </h3>
      </div>

      {/* Balance info */}
      <div className="flex items-center justify-between bg-neutral-50 rounded-lg px-4 py-3">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-amber-500" />
          <span className="text-sm text-neutral-700 font-body">
            Ban co{" "}
            <span className="font-bold text-neutral-900">
              {new Intl.NumberFormat("vi-VN").format(balance.currentBalance)}
            </span>{" "}
            diem{" "}
            <span className="text-neutral-500">
              (tuong duong {formatPrice(maxDiscount)})
            </span>
          </span>
        </div>
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${tierColor}`}
        >
          <Sparkles className="h-3 w-3" />
          {balance.tier}
        </span>
      </div>

      {/* Points input */}
      <div className="space-y-2">
        <label
          htmlFor="loyalty-points"
          className="text-sm text-neutral-600 font-body"
        >
          So diem muon dung:
        </label>
        <input
          id="loyalty-points"
          type="number"
          min={0}
          max={balance.currentBalance}
          step={100}
          value={points || ""}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            handlePointsChange(isNaN(val) ? 0 : val);
          }}
          placeholder="Nhap so diem"
          className="w-full h-10 rounded-lg border border-neutral-300 px-3 text-sm font-body text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-700/30 focus:border-primary-700"
        />
      </div>

      {/* Quick select buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => handlePointsChange(balance.currentBalance)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors"
        >
          Dung tat ca
        </button>
        {balance.currentBalance >= 500 && (
          <button
            type="button"
            onClick={() => handlePointsChange(500)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors"
          >
            500 diem
          </button>
        )}
        {balance.currentBalance >= 1000 && (
          <button
            type="button"
            onClick={() => handlePointsChange(1000)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors"
          >
            1000 diem
          </button>
        )}
        {points > 0 && (
          <button
            type="button"
            onClick={() => handlePointsChange(0)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
          >
            Bo chon
          </button>
        )}
      </div>

      {/* Live conversion display */}
      {points > 0 && (
        <div className="flex items-center justify-between bg-green-50 rounded-lg px-4 py-2.5">
          <span className="text-sm text-green-700 font-body">
            {new Intl.NumberFormat("vi-VN").format(points)} diem ={" "}
            <span className="font-bold">{formatPrice(discount)}</span> giam gia
          </span>
        </div>
      )}

      {/* Note */}
      <p className="text-xs text-neutral-400 font-body">
        1,000 diem = 10,000{"\u0111"} giam gia. Toi thieu 100 diem de su dung.
      </p>
    </div>
  );
}
