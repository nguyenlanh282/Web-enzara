"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface AnnouncementBarProps {
  text?: string;
  link?: string;
  bgColor?: string;
  enabled?: boolean;
}

export function AnnouncementBar({
  text = "Miễn phí vận chuyển cho đơn hàng từ 500.000đ",
  link,
  bgColor = "#626c13",
  enabled = true,
}: AnnouncementBarProps) {
  const [dismissed, setDismissed] = useState(false);

  if (!enabled || dismissed) {
    return null;
  }

  const content = (
    <div
      className="relative py-2 px-4 text-center text-sm text-white"
      style={{ backgroundColor: bgColor }}
    >
      <div className="mx-auto max-w-7xl flex items-center justify-center gap-4">
        <span className="flex-1 text-center">{text}</span>
        <button
          onClick={() => setDismissed(true)}
          className="hover:opacity-75 transition-opacity"
          aria-label="Đóng thông báo"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  if (link) {
    return (
      <Link href={link} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
