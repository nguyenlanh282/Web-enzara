"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface RecentlyViewedItem {
  id: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  originalPrice?: number;
}

interface RecentlyViewedState {
  items: RecentlyViewedItem[];
  addItem: (item: RecentlyViewedItem) => void;
}

const MAX_ITEMS = 10;

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set) => ({
      items: [],

      addItem: (item) => {
        set((state) => {
          const filtered = state.items.filter((i) => i.id !== item.id);
          const updated = [item, ...filtered].slice(0, MAX_ITEMS);
          return { items: updated };
        });
      },
    }),
    {
      name: "enzara-recently-viewed",
      partialize: (state) => ({
        items: state.items,
      }),
    }
  )
);
