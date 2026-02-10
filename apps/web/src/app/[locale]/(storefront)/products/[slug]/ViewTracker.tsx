"use client";

import { useEffect } from "react";
import { TrackingService } from "@/lib/tracking";

interface ViewTrackerProps {
  slug: string;
  product?: {
    sku?: string;
    name: string;
    category?: string;
    brand?: string;
    price: number;
  };
}

export default function ViewTracker({ slug, product }: ViewTrackerProps) {
  useEffect(() => {
    const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
    fetch(`${BASE}/products/${slug}/view`, { method: "POST" }).catch(() => {});

    if (product) {
      TrackingService.viewItem(product);
    }
  }, [slug, product]);

  return null;
}
