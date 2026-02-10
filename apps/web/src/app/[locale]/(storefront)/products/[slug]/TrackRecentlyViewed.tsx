"use client";

import { useEffect } from "react";
import {
  useRecentlyViewedStore,
  type RecentlyViewedItem,
} from "@/stores/recentlyViewedStore";

interface TrackRecentlyViewedProps {
  product: RecentlyViewedItem;
}

export function TrackRecentlyViewed({ product }: TrackRecentlyViewedProps) {
  const addItem = useRecentlyViewedStore((s) => s.addItem);

  useEffect(() => {
    addItem(product);
  }, [product, addItem]);

  return null;
}
