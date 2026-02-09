"use client";

import { useState, useEffect, useCallback } from "react";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { apiClient } from "@/lib/api";
import { cn } from "@/lib/utils";

interface WishlistButtonProps {
  productId: string;
  className?: string;
  size?: "sm" | "md";
}

export function WishlistButton({
  productId,
  className,
  size = "md",
}: WishlistButtonProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const checkWishlist = useCallback(async () => {
    if (!user) return;
    try {
      const response = await apiClient.post<{ wishlisted: string[] }>(
        "/wishlist/check",
        { productIds: [productId] }
      );
      setIsWishlisted(response.wishlisted.includes(productId));
    } catch {
      // Silently fail on check
    }
  }, [user, productId]);

  useEffect(() => {
    checkWishlist();
  }, [checkWishlist]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      const currentPath = window.location.pathname;
      router.push(`/auth/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    setIsAnimating(true);

    try {
      if (isWishlisted) {
        await apiClient.delete(`/wishlist/${productId}`);
        setIsWishlisted(false);
      } else {
        await apiClient.post("/wishlist", { productId });
        setIsWishlisted(true);
      }
    } catch {
      // Revert on error
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
  };

  const iconSizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={cn(
        "inline-flex items-center justify-center rounded-full border transition-all duration-200",
        isWishlisted
          ? "border-red-200 bg-red-50 text-red-500 hover:bg-red-100"
          : "border-neutral-300 bg-white text-neutral-400 hover:border-red-300 hover:text-red-400",
        isAnimating && "scale-125",
        isLoading && "opacity-70 cursor-not-allowed",
        sizeClasses[size],
        className
      )}
      aria-label={isWishlisted ? "Bo yeu thich" : "Them vao yeu thich"}
    >
      <Heart
        className={cn(
          iconSizeClasses[size],
          "transition-all duration-200",
          isWishlisted && "fill-red-500"
        )}
      />
    </button>
  );
}
