"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface FlashSaleData {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  items: Array<{
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
  }>;
}

interface FlashSaleWidgetProps {
  flashSale: FlashSaleData;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

function calculateTimeLeft(endTime: string): TimeLeft {
  const diff = new Date(endTime).getTime() - Date.now();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    total: diff,
  };
}

function CountdownTimer({ endTime }: { endTime: string }) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() =>
    calculateTimeLeft(endTime)
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(endTime));
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  if (timeLeft.total <= 0) {
    return null;
  }

  const pad = (n: number) => String(n).padStart(2, "0");

  const boxes = [
    ...(timeLeft.days > 0 ? [{ value: pad(timeLeft.days), label: "Ngay" }] : []),
    { value: pad(timeLeft.hours), label: "Gio" },
    { value: pad(timeLeft.minutes), label: "Phut" },
    { value: pad(timeLeft.seconds), label: "Giay" },
  ];

  return (
    <div className="flex items-center gap-1.5">
      {boxes.map((box, idx) => (
        <div key={box.label} className="flex items-center gap-1.5">
          <div className="flex flex-col items-center">
            <span className="bg-neutral-900 text-white font-heading font-bold text-sm sm:text-base px-2 py-1 rounded-lg min-w-[36px] text-center">
              {box.value}
            </span>
            <span className="text-[10px] text-neutral-600 font-body mt-0.5">
              {box.label}
            </span>
          </div>
          {idx < boxes.length - 1 && (
            <span className="text-neutral-900 font-bold text-sm mb-4">:</span>
          )}
        </div>
      ))}
    </div>
  );
}

function formatPrice(p: number) {
  return new Intl.NumberFormat("vi-VN").format(p) + "\u0111";
}

export function FlashSaleWidget({ flashSale }: FlashSaleWidgetProps) {
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    const check = () => {
      if (new Date(flashSale.endTime).getTime() <= Date.now()) {
        setEnded(true);
      }
    };
    check();
    const timer = setInterval(check, 1000);
    return () => clearInterval(timer);
  }, [flashSale.endTime]);

  if (ended) {
    return null;
  }

  if (!flashSale.items || flashSale.items.length === 0) {
    return null;
  }

  return (
    <section className="bg-gradient-to-r from-red-50 to-orange-50 py-10">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 p-2 rounded-lg">
              <Zap className="h-6 w-6 text-white fill-white" />
            </div>
            <h2 className="text-2xl font-heading font-bold text-neutral-900">
              {flashSale.name}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-body text-neutral-600">
              Ket thuc sau:
            </span>
            <CountdownTimer endTime={flashSale.endTime} />
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {flashSale.items.map((item) => {
            const primaryImage =
              item.product.images.find((img) => img.isPrimary) ||
              item.product.images[0];
            const discount = Math.round(
              ((item.product.basePrice - item.salePrice) /
                item.product.basePrice) *
                100
            );
            const soldPercent =
              item.quantity > 0
                ? Math.round((item.soldCount / item.quantity) * 100)
                : 0;

            return (
              <Link
                key={item.id}
                href={`/products/${item.product.slug}`}
                className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-card transition-all"
              >
                {/* Image */}
                <div className="relative aspect-square bg-neutral-100">
                  {primaryImage && (
                    <Image
                      src={primaryImage.url}
                      alt={item.product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-all duration-300"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  )}
                  {/* Discount Badge */}
                  {discount > 0 && (
                    <span className="absolute top-2 right-2 bg-red-600 text-white text-xs font-body font-bold px-2 py-1 rounded-lg">
                      -{discount}%
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="p-3 space-y-2">
                  <h3 className="font-body text-sm text-neutral-800 line-clamp-2 min-h-[2.5rem]">
                    {item.product.name}
                  </h3>

                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-heading font-bold text-red-600">
                      {formatPrice(item.salePrice)}
                    </span>
                    <span className="text-xs text-neutral-400 line-through">
                      {formatPrice(item.product.basePrice)}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="w-full h-2 bg-red-100 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          soldPercent >= 80
                            ? "bg-red-600"
                            : soldPercent >= 50
                              ? "bg-orange-500"
                              : "bg-red-400"
                        )}
                        style={{ width: `${Math.min(soldPercent, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs font-body text-neutral-500">
                      Da ban {item.soldCount}/{item.quantity}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
