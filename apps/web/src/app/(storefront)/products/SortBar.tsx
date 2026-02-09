"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";

const SORT_OPTIONS = [
  { value: "", label: "Mac dinh" },
  { value: "newest", label: "Moi nhat" },
  { value: "price_asc", label: "Gia thap den cao" },
  { value: "price_desc", label: "Gia cao den thap" },
  { value: "bestseller", label: "Ban chay" },
];

interface SortBarProps {
  currentSort: string;
  total: number;
}

export default function SortBar({ currentSort, total }: SortBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value === "") {
      params.delete("sort");
    } else {
      params.set("sort", value);
    }

    params.delete("page");

    const queryString = params.toString();
    const url = queryString ? `${pathname}?${queryString}` : pathname;

    startTransition(() => {
      router.push(url);
    });
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <p className="text-sm text-neutral-600 font-body">
        Hien thi <span className="font-semibold text-neutral-900">{total}</span> san pham
      </p>

      <div className="flex items-center gap-3">
        <label htmlFor="sort" className="text-sm text-neutral-600 font-body whitespace-nowrap">
          Sap xep theo:
        </label>
        <select
          id="sort"
          value={currentSort}
          onChange={(e) => handleSortChange(e.target.value)}
          disabled={isPending}
          className="px-4 py-2 border border-neutral-300 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 bg-white"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
