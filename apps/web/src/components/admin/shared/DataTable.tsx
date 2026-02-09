'use client';

import { useState, useMemo, type ReactNode } from 'react';
import {
  ChevronUp,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Column<T> {
  /** Column header label */
  header: string;
  /** Either a key of T or a render function */
  accessor: keyof T | ((row: T) => ReactNode);
  /** Optional extra classes for the <td> / <th> */
  className?: string;
  /** Set to false to disable sorting for this column (default true for string keys) */
  sortable?: boolean;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  /** If provided the table shows pagination controls */
  pagination?: PaginationMeta;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  /** Message shown when data is empty and not loading */
  emptyMessage?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type SortDirection = 'asc' | 'desc';

function getCellValue<T>(row: T, accessor: Column<T>['accessor']): unknown {
  if (typeof accessor === 'function') return accessor(row);
  return row[accessor as keyof T];
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// ---------------------------------------------------------------------------
// Skeleton row
// ---------------------------------------------------------------------------

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr className="border-b border-neutral-100">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded bg-neutral-200 animate-pulse w-3/4" />
        </td>
      ))}
    </tr>
  );
}

// ---------------------------------------------------------------------------
// DataTable
// ---------------------------------------------------------------------------

export default function DataTable<T>({
  data,
  columns,
  isLoading = false,
  pagination,
  onPageChange,
  onLimitChange,
  emptyMessage = 'Khong co du lieu',
}: DataTableProps<T>) {
  // -- Client-side sorting state -------------------------------------------
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>('asc');

  const handleSort = (col: Column<T>) => {
    // Only string-key columns are sortable by default
    if (typeof col.accessor !== 'string') return;
    if (col.sortable === false) return;

    const key = col.accessor as string;
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedData = useMemo(() => {
    if (!sortKey) return data;

    return [...data].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortKey];
      const bVal = (b as Record<string, unknown>)[sortKey];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortDir === 'asc' ? -1 : 1;
      if (bVal == null) return sortDir === 'asc' ? 1 : -1;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      const cmp = aStr.localeCompare(bStr);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  // -- Pagination helpers --------------------------------------------------
  const totalPages = pagination
    ? Math.max(1, Math.ceil(pagination.total / pagination.limit))
    : 1;
  const currentPage = pagination?.page ?? 1;

  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  // -- Render --------------------------------------------------------------
  return (
    <div className="w-full overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-sm font-body">
          {/* HEAD */}
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              {columns.map((col, idx) => {
                const isSortable =
                  typeof col.accessor === 'string' && col.sortable !== false;
                const isActive =
                  isSortable && sortKey === (col.accessor as string);

                return (
                  <th
                    key={idx}
                    className={cn(
                      'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500',
                      isSortable && 'cursor-pointer select-none hover:text-primary-700',
                      isActive && 'text-primary-700',
                      col.className
                    )}
                    onClick={() => isSortable && handleSort(col)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.header}
                      {isSortable && (
                        <span className="inline-flex flex-col leading-none">
                          <ChevronUp
                            className={cn(
                              'w-3 h-3 -mb-0.5',
                              isActive && sortDir === 'asc'
                                ? 'text-primary-700'
                                : 'text-neutral-300'
                            )}
                          />
                          <ChevronDown
                            className={cn(
                              'w-3 h-3 -mt-0.5',
                              isActive && sortDir === 'desc'
                                ? 'text-primary-700'
                                : 'text-neutral-300'
                            )}
                          />
                        </span>
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* BODY */}
          <tbody>
            {isLoading ? (
              Array.from({ length: pagination?.limit ?? 5 }).map((_, i) => (
                <SkeletonRow key={i} cols={columns.length} />
              ))
            ) : sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-neutral-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className="border-b border-neutral-100 last:border-b-0 hover:bg-primary-50/40 transition-colors"
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={colIdx}
                      className={cn('px-4 py-3 text-neutral-700', col.className)}
                    >
                      {getCellValue(row, col.accessor) as ReactNode}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {pagination && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-neutral-200 px-4 py-3">
          {/* Info */}
          <p className="text-xs text-neutral-500 font-body">
            Hien thi{' '}
            <span className="font-medium text-neutral-700">
              {Math.min((currentPage - 1) * pagination.limit + 1, pagination.total)}
            </span>
            {' - '}
            <span className="font-medium text-neutral-700">
              {Math.min(currentPage * pagination.limit, pagination.total)}
            </span>{' '}
            trong{' '}
            <span className="font-medium text-neutral-700">{pagination.total}</span>{' '}
            ket qua
          </p>

          <div className="flex items-center gap-4">
            {/* Page size selector */}
            <div className="flex items-center gap-2">
              <label
                htmlFor="page-size"
                className="text-xs text-neutral-500 font-body whitespace-nowrap"
              >
                So dong
              </label>
              <select
                id="page-size"
                value={pagination.limit}
                onChange={(e) => onLimitChange?.(Number(e.target.value))}
                className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs font-body text-neutral-700 focus:border-primary-700 focus:outline-none focus:ring-1 focus:ring-primary-700"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>

            {/* Page controls */}
            <div className="flex items-center gap-1">
              <button
                disabled={!canPrev}
                onClick={() => onPageChange?.(1)}
                className={cn(
                  'inline-flex items-center justify-center rounded-lg p-1.5 transition-colors',
                  canPrev
                    ? 'text-neutral-600 hover:bg-primary-100 hover:text-primary-700'
                    : 'text-neutral-300 cursor-not-allowed'
                )}
                title="Trang dau"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>

              <button
                disabled={!canPrev}
                onClick={() => onPageChange?.(currentPage - 1)}
                className={cn(
                  'inline-flex items-center justify-center rounded-lg p-1.5 transition-colors',
                  canPrev
                    ? 'text-neutral-600 hover:bg-primary-100 hover:text-primary-700'
                    : 'text-neutral-300 cursor-not-allowed'
                )}
                title="Trang truoc"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-2 text-xs font-body text-neutral-700">
                {currentPage} / {totalPages}
              </span>

              <button
                disabled={!canNext}
                onClick={() => onPageChange?.(currentPage + 1)}
                className={cn(
                  'inline-flex items-center justify-center rounded-lg p-1.5 transition-colors',
                  canNext
                    ? 'text-neutral-600 hover:bg-primary-100 hover:text-primary-700'
                    : 'text-neutral-300 cursor-not-allowed'
                )}
                title="Trang sau"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                disabled={!canNext}
                onClick={() => onPageChange?.(totalPages)}
                className={cn(
                  'inline-flex items-center justify-center rounded-lg p-1.5 transition-colors',
                  canNext
                    ? 'text-neutral-600 hover:bg-primary-100 hover:text-primary-700'
                    : 'text-neutral-300 cursor-not-allowed'
                )}
                title="Trang cuoi"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
