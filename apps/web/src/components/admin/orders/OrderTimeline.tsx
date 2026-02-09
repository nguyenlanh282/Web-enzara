"use client";

import { cn } from "@/lib/utils";

interface TimelineEntry {
  id: string;
  status: string;
  note?: string;
  createdBy?: string;
  createdAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Tao don hang",
  CONFIRMED: "Xac nhan don hang",
  PROCESSING: "Dang xu ly",
  SHIPPING: "Dang giao hang",
  DELIVERED: "Da giao hang",
  CANCELLED: "Da huy",
  REFUNDED: "Da hoan tien",
  PAYMENT_CONFIRMED: "Thanh toan thanh cong",
};

const STATUS_DOT_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-500",
  CONFIRMED: "bg-blue-500",
  PROCESSING: "bg-indigo-500",
  SHIPPING: "bg-purple-500",
  DELIVERED: "bg-green-500",
  CANCELLED: "bg-red-500",
  REFUNDED: "bg-orange-500",
  PAYMENT_CONFIRMED: "bg-green-500",
};

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

export function OrderTimeline({ entries }: { entries: TimelineEntry[] }) {
  const sorted = [...entries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (sorted.length === 0) {
    return (
      <p className="font-body text-sm text-neutral-500">
        Chua co lich su trang thai.
      </p>
    );
  }

  return (
    <div className="relative">
      {sorted.map((entry, index) => {
        const isLast = index === sorted.length - 1;
        const dotColor = STATUS_DOT_COLORS[entry.status] || "bg-neutral-400";
        const label = STATUS_LABELS[entry.status] || entry.status;

        return (
          <div key={entry.id} className="relative flex gap-4 pb-6 last:pb-0">
            {/* Vertical line */}
            {!isLast && (
              <div className="absolute left-[9px] top-5 bottom-0 w-0.5 bg-neutral-200" />
            )}

            {/* Dot */}
            <div className="relative z-10 flex-shrink-0 mt-1">
              <div
                className={cn(
                  "w-[18px] h-[18px] rounded-full border-2 border-white shadow-sm",
                  dotColor
                )}
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="font-body font-medium text-sm text-neutral-900">
                {label}
              </p>
              {entry.note && (
                <p className="font-body text-sm text-neutral-600 mt-0.5">
                  {entry.note}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span className="font-body text-xs text-neutral-400">
                  {formatDate(entry.createdAt)}
                </span>
                {entry.createdBy && (
                  <span className="font-body text-xs text-neutral-400">
                    - {entry.createdBy}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
