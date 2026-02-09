"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingProps {
  value: number;
  max?: number;
  size?: "sm" | "md";
}

export function Rating({ value, max = 5, size = "md" }: RatingProps) {
  const fullStars = Math.floor(value);
  const hasHalfStar = value % 1 >= 0.5;
  const emptyStars = max - fullStars - (hasHalfStar ? 1 : 0);

  const starSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star
            key={`full-${i}`}
            className={cn(starSize, "fill-accent-500 text-accent-500")}
          />
        ))}

        {hasHalfStar && (
          <div className="relative">
            <Star className={cn(starSize, "text-neutral-300")} />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <Star className={cn(starSize, "fill-accent-500 text-accent-500")} />
            </div>
          </div>
        )}

        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star key={`empty-${i}`} className={cn(starSize, "text-neutral-300")} />
        ))}
      </div>

      <span
        className={cn(
          "font-medium text-neutral-700",
          size === "sm" ? "text-sm" : "text-base"
        )}
      >
        {value.toFixed(1)}
      </span>
    </div>
  );
}
