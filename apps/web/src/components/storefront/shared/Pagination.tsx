"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface PaginationProps {
  current: number;
  total: number;
  baseUrl: string;
  searchParams?: Record<string, string>;
}

export function Pagination({
  current,
  total,
  baseUrl,
  searchParams = {},
}: PaginationProps) {
  const buildUrl = (page: number) => {
    const params = new URLSearchParams(searchParams);
    if (page > 1) {
      params.set("page", page.toString());
    } else {
      params.delete("page");
    }
    const query = params.toString();
    return query ? `${baseUrl}?${query}` : baseUrl;
  };

  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, current - delta);
      i <= Math.min(total - 1, current + delta);
      i++
    ) {
      range.push(i);
    }

    if (current - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (current + delta < total - 1) {
      rangeWithDots.push("...", total);
    } else if (total > 1) {
      rangeWithDots.push(total);
    }

    return rangeWithDots;
  };

  if (total <= 1) {
    return null;
  }

  const pages = getPageNumbers();

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-2 py-8"
    >
      {current > 1 && (
        <Link
          href={buildUrl(current - 1)}
          className="p-2 rounded-lg border border-neutral-300 hover:border-primary-700 hover:text-primary-700 transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
      )}

      {pages.map((page, index) => {
        if (page === "...") {
          return (
            <span
              key={`ellipsis-${index}`}
              className="px-3 py-2 text-neutral-400"
            >
              ...
            </span>
          );
        }

        const pageNumber = page as number;
        const isActive = pageNumber === current;

        return (
          <Link
            key={pageNumber}
            href={buildUrl(pageNumber)}
            className={cn(
              "min-w-[2.5rem] px-3 py-2 rounded-lg font-medium transition-colors text-center",
              isActive
                ? "bg-primary-700 text-white"
                : "border border-neutral-300 text-neutral-700 hover:border-primary-700 hover:text-primary-700"
            )}
            aria-label={`Page ${pageNumber}`}
            aria-current={isActive ? "page" : undefined}
          >
            {pageNumber}
          </Link>
        );
      })}

      {current < total && (
        <Link
          href={buildUrl(current + 1)}
          className="p-2 rounded-lg border border-neutral-300 hover:border-primary-700 hover:text-primary-700 transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="h-5 w-5" />
        </Link>
      )}
    </nav>
  );
}
