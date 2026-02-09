"use client";

import { useState, useEffect } from "react";
import { Zap } from "lucide-react";
import { apiClient } from "@/lib/api";

interface FlashSaleItem {
  id: string;
  productId: string;
  salePrice: number;
  quantity: number;
  soldCount: number;
  product: {
    id: string;
    name: string;
    slug: string;
    basePrice: number;
    images: Array<{ id: string; url: string; isPrimary?: boolean }>;
  };
}

interface FlashSaleResponse {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  items: FlashSaleItem[];
}

interface FlashSaleBadgeProps {
  productId: string;
}

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

function calculateTimeLeft(endTime: string): TimeLeft {
  const diff = new Date(endTime).getTime() - Date.now();
  if (diff <= 0) {
    return { hours: 0, minutes: 0, seconds: 0, total: 0 };
  }
  return {
    hours: Math.floor(diff / (1000 * 60 * 60)),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    total: diff,
  };
}

function formatPrice(p: number) {
  return new Intl.NumberFormat("vi-VN").format(p) + "\u0111";
}

export function FlashSaleBadge({ productId }: FlashSaleBadgeProps) {
  const [flashItem, setFlashItem] = useState<FlashSaleItem | null>(null);
  const [endTime, setEndTime] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchFlashSale() {
      try {
        const data = await apiClient.get<FlashSaleResponse>(
          "/flash-sales/active"
        );
        if (cancelled) return;
        if (data && data.items) {
          const item = data.items.find((i) => i.productId === productId);
          if (item) {
            setFlashItem(item);
            setEndTime(data.endTime);
            setTimeLeft(calculateTimeLeft(data.endTime));
          }
        }
      } catch {
        // Flash sale not available - silently ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchFlashSale();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  useEffect(() => {
    if (!endTime) return;
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(endTime));
    }, 1000);
    return () => clearInterval(timer);
  }, [endTime]);

  if (loading || !flashItem) return null;
  if (timeLeft.total <= 0) return null;

  const pad = (n: number) => String(n).padStart(2, "0");

  const discount = Math.round(
    ((flashItem.product.basePrice - flashItem.salePrice) /
      flashItem.product.basePrice) *
      100
  );

  return (
    <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="bg-red-600 p-1.5 rounded-lg">
            <Zap className="h-4 w-4 text-white fill-white" />
          </div>
          <span className="font-heading font-bold text-red-600">
            Flash Sale
          </span>
          {discount > 0 && (
            <span className="text-xs font-body font-bold bg-red-600 text-white px-2 py-0.5 rounded-lg">
              -{discount}%
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <span className="text-neutral-500 font-body">Ket thuc:</span>
          <div className="flex items-center gap-1">
            <span className="bg-neutral-900 text-white font-heading font-bold text-xs px-1.5 py-0.5 rounded">
              {pad(timeLeft.hours)}
            </span>
            <span className="text-neutral-900 font-bold text-xs">:</span>
            <span className="bg-neutral-900 text-white font-heading font-bold text-xs px-1.5 py-0.5 rounded">
              {pad(timeLeft.minutes)}
            </span>
            <span className="text-neutral-900 font-bold text-xs">:</span>
            <span className="bg-neutral-900 text-white font-heading font-bold text-xs px-1.5 py-0.5 rounded">
              {pad(timeLeft.seconds)}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-baseline gap-3">
        <span className="text-2xl font-heading font-bold text-red-600">
          {formatPrice(flashItem.salePrice)}
        </span>
        <span className="text-lg text-neutral-400 line-through">
          {formatPrice(flashItem.product.basePrice)}
        </span>
      </div>
    </div>
  );
}
