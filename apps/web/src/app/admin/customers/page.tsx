"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { apiClient, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Loader2,
  AlertCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

interface Customer {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  avatar: string | null;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  totalOrders: number;
  totalSpent: number;
  loyaltyBalance: number;
  tier: string;
}

function formatVND(value: number): string {
  return new Intl.NumberFormat("vi-VN").format(value) + "đ";
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const TIER_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  Bac: { label: "Bac", bg: "bg-neutral-100", text: "text-neutral-700" },
  Vang: { label: "Vang", bg: "bg-amber-100", text: "text-amber-800" },
  "Kim Cuong": { label: "Kim Cuong", bg: "bg-sky-100", text: "text-sky-800" },
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const limit = 20;

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      });
      if (searchQuery) {
        params.append("search", searchQuery);
      }
      const response = await apiClient.get<{
        items: Customer[];
        total: number;
        page: number;
        totalPages: number;
      }>(`/admin/customers?${params}`);
      setCustomers(response.items || []);
      setTotalPages(response.totalPages || 1);
      setTotal(response.total || 0);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Khong the tai danh sach khach hang");
      }
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  function handleSearch() {
    setCurrentPage(1);
    fetchCustomers();
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      handleSearch();
    }
  }

  async function handleToggleStatus(customerId: string) {
    setTogglingId(customerId);
    try {
      const result = await apiClient.patch<{ id: string; isActive: boolean }>(
        `/admin/customers/${customerId}/status`,
      );
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === customerId ? { ...c, isActive: result.isActive } : c,
        ),
      );
    } catch (err) {
      if (err instanceof ApiError) {
        alert(err.message);
      }
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-neutral-900">
          Quan ly khach hang
        </h1>
        <p className="font-body text-neutral-600 mt-1">
          Xem va quan ly thong tin khach hang
        </p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[240px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Tim theo ten, email hoac SDT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-primary-700 text-white rounded-xl font-body hover:bg-primary-800 transition-colors"
          >
            Tim kiem
          </button>
          {total > 0 && (
            <span className="font-body text-sm text-neutral-500">
              {total} khach hang
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary-700 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center gap-2 py-12 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <span className="font-body">{error}</span>
          </div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
            <AlertCircle className="w-12 h-12 mb-2" />
            <p className="font-body">Khong co khach hang nao</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-body font-semibold text-neutral-900">
                      Khach hang
                    </th>
                    <th className="px-4 py-3 text-left font-body font-semibold text-neutral-900">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left font-body font-semibold text-neutral-900">
                      SDT
                    </th>
                    <th className="px-4 py-3 text-right font-body font-semibold text-neutral-900">
                      Don hang
                    </th>
                    <th className="px-4 py-3 text-right font-body font-semibold text-neutral-900">
                      Tong chi tieu
                    </th>
                    <th className="px-4 py-3 text-left font-body font-semibold text-neutral-900">
                      Hang
                    </th>
                    <th className="px-4 py-3 text-left font-body font-semibold text-neutral-900">
                      Trang thai
                    </th>
                    <th className="px-4 py-3 text-right font-body font-semibold text-neutral-900">
                      Thao tac
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {customers.map((customer) => {
                    const tierConfig = TIER_CONFIG[customer.tier] || TIER_CONFIG["Bac"];

                    return (
                      <tr
                        key={customer.id}
                        className="hover:bg-neutral-50"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {customer.avatar ? (
                              <img
                                src={customer.avatar}
                                alt={customer.fullName}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                                <span className="font-body text-sm font-medium text-primary-700">
                                  {customer.fullName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <span className="font-body font-medium text-neutral-900">
                              {customer.fullName}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-body text-sm text-neutral-600">
                            {customer.email}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-body text-sm text-neutral-600">
                            {customer.phone || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-body font-medium text-neutral-900">
                            {customer.totalOrders}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-body font-medium text-neutral-900">
                            {formatVND(customer.totalSpent)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-body font-medium",
                              tierConfig.bg,
                              tierConfig.text,
                            )}
                          >
                            {tierConfig.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleStatus(customer.id);
                            }}
                            disabled={togglingId === customer.id}
                            className="flex items-center gap-1.5 disabled:opacity-50"
                            title={customer.isActive ? "Vo hieu hoa" : "Kich hoat"}
                          >
                            {customer.isActive ? (
                              <ToggleRight className="w-6 h-6 text-green-600" />
                            ) : (
                              <ToggleLeft className="w-6 h-6 text-neutral-400" />
                            )}
                            <span
                              className={cn(
                                "font-body text-xs",
                                customer.isActive
                                  ? "text-green-700"
                                  : "text-neutral-500",
                              )}
                            >
                              {customer.isActive ? "Hoat dong" : "Da khoa"}
                            </span>
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/admin/customers/${customer.id}`}
                              className="p-2 text-neutral-600 hover:text-primary-700 hover:bg-neutral-100 rounded-lg transition-colors"
                              title="Xem chi tiet"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200">
                <div className="font-body text-sm text-neutral-600">
                  Trang {currentPage} / {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.max(1, p - 1))
                    }
                    disabled={currentPage === 1}
                    className="p-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="p-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
