"use client";

import { useEffect } from "react";
import { TrackingService } from "@/lib/tracking";

interface SearchTrackerProps {
  query: string;
}

export function SearchTracker({ query }: SearchTrackerProps) {
  useEffect(() => {
    if (query) {
      TrackingService.search(query);
    }
  }, [query]);

  return null;
}
