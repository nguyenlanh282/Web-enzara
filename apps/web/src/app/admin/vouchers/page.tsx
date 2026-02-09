"use client";

import { useEffect, useState } from "react";
import { apiClient, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Loader2,
  AlertCircle,
  Search,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
} from "lucide-react";

type VoucherType = "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING";

interface Voucher {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: VoucherType;
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  perUserLimit: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  _count?: { orders: number };
}

interface VoucherFormData {
  code?: string;
  name: string;
  description?: string;
  type: VoucherType;
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  perUserLimit?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
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

const VOUCHER_TYPE_CONFIG: Record<
  VoucherType,
  { label: string; bg: string; text: string }
> = {
  PERCENTAGE: { label: "Phần trăm", bg: "bg-blue-100", text: "text-blue-800" },
  FIXED_AMOUNT: {
    label: "Giảm cố định",
    bg: "bg-green-100",
    text: "text-green-800",
  },
  FREE_SHIPPING: {
    label: "Miễn phí ship",
    bg: "bg-purple-100",
    text: "text-purple-800",
  },
};

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const limit = 20;

  const [formData, setFormData] = useState<VoucherFormData>({
    name: "",
    type: "PERCENTAGE",
    value: 0,
    perUserLimit: 1,
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    isActive: true,
  });

  useEffect(() => {
    fetchVouchers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, typeFilter, activeFilter]);

  async function fetchVouchers() {
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
      if (typeFilter) {
        params.append("type", typeFilter);
      }
      if (activeFilter) {
        params.append("isActive", activeFilter);
      }
      const response = await apiClient.get<{
        data: Voucher[];
        meta: { total: number; page: number; totalPages: number };
      }>(`/admin/vouchers?${params}`);
      setVouchers(response.data || []);
      setTotalPages(response.meta?.totalPages || 1);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Không thể tải danh sách voucher");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleSearch() {
    setCurrentPage(1);
    fetchVouchers();
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      handleSearch();
    }
  }

  function openCreateModal() {
    setEditingVoucher(null);
    setFormData({
      name: "",
      type: "PERCENTAGE",
      value: 0,
      perUserLimit: 1,
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      isActive: true,
    });
    setShowModal(true);
  }

  function openEditModal(voucher: Voucher) {
    setEditingVoucher(voucher);
    setFormData({
      code: voucher.code,
      name: voucher.name,
      description: voucher.description,
      type: voucher.type,
      value: Number(voucher.value),
      minOrderAmount: voucher.minOrderAmount
        ? Number(voucher.minOrderAmount)
        : undefined,
      maxDiscount: voucher.maxDiscount ? Number(voucher.maxDiscount) : undefined,
      usageLimit: voucher.usageLimit || undefined,
      perUserLimit: voucher.perUserLimit,
      startDate: new Date(voucher.startDate).toISOString().split("T")[0],
      endDate: new Date(voucher.endDate).toISOString().split("T")[0],
      isActive: voucher.isActive,
    });
    setShowModal(true);
  }

  function generateCode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 10; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (editingVoucher) {
        await apiClient.put(`/admin/vouchers/${editingVoucher.id}`, formData);
      } else {
        await apiClient.post("/admin/vouchers", formData);
      }
      setShowModal(false);
      fetchVouchers();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Không thể lưu voucher");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bạn có chắc muốn xóa voucher này?")) {
      return;
    }

    try {
      await apiClient.delete(`/admin/vouchers/${id}`);
      fetchVouchers();
    } catch (err) {
      if (err instanceof ApiError) {
        alert(err.message);
      } else {
        alert("Không thể xóa voucher");
      }
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-neutral-900">
            Quản lý voucher
          </h1>
          <p className="font-body text-neutral-600 mt-1">
            Tạo và quản lý mã giảm giá cho khách hàng
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-primary-700 text-white rounded-xl font-body font-medium hover:bg-primary-800 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Tạo voucher
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[240px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Tìm theo mã hoặc tên voucher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
          >
            <option value="">Tất cả loại</option>
            <option value="PERCENTAGE">Phần trăm</option>
            <option value="FIXED_AMOUNT">Giảm cố định</option>
            <option value="FREE_SHIPPING">Miễn phí ship</option>
          </select>

          <select
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="true">Đang hoạt động</option>
            <option value="false">Đã tắt</option>
          </select>
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
        ) : vouchers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
            <AlertCircle className="w-12 h-12 mb-2" />
            <p className="font-body">Chưa có voucher nào</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-body font-semibold text-neutral-900">
                      Mã
                    </th>
                    <th className="px-4 py-3 text-left font-body font-semibold text-neutral-900">
                      Tên
                    </th>
                    <th className="px-4 py-3 text-left font-body font-semibold text-neutral-900">
                      Loại
                    </th>
                    <th className="px-4 py-3 text-right font-body font-semibold text-neutral-900">
                      Giá trị
                    </th>
                    <th className="px-4 py-3 text-center font-body font-semibold text-neutral-900">
                      Sử dụng
                    </th>
                    <th className="px-4 py-3 text-center font-body font-semibold text-neutral-900">
                      Thời gian
                    </th>
                    <th className="px-4 py-3 text-center font-body font-semibold text-neutral-900">
                      Trạng thái
                    </th>
                    <th className="px-4 py-3 text-right font-body font-semibold text-neutral-900">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {vouchers.map((voucher) => {
                    const typeConfig = VOUCHER_TYPE_CONFIG[voucher.type];

                    return (
                      <tr key={voucher.id} className="hover:bg-neutral-50">
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm font-medium text-primary-700">
                            {voucher.code}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-body font-medium text-neutral-900">
                            {voucher.name}
                          </div>
                          {voucher.description && (
                            <div className="font-body text-sm text-neutral-500">
                              {voucher.description}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-body font-medium",
                              typeConfig.bg,
                              typeConfig.text
                            )}
                          >
                            {typeConfig.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="font-body font-medium text-neutral-900">
                            {voucher.type === "PERCENTAGE"
                              ? `${voucher.value}%`
                              : voucher.type === "FIXED_AMOUNT"
                                ? formatVND(Number(voucher.value))
                                : "Miễn phí"}
                          </div>
                          {voucher.maxDiscount && (
                            <div className="font-body text-xs text-neutral-500">
                              Tối đa {formatVND(Number(voucher.maxDiscount))}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-body text-sm text-neutral-900">
                            {voucher.usedCount}
                            {voucher.usageLimit
                              ? `/${voucher.usageLimit}`
                              : " / ∞"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="font-body text-xs text-neutral-600">
                            {formatDate(voucher.startDate)}
                          </div>
                          <div className="font-body text-xs text-neutral-600">
                            → {formatDate(voucher.endDate)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={cn(
                              "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-body font-medium",
                              voucher.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            )}
                          >
                            {voucher.isActive ? "Hoạt động" : "Đã tắt"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(voucher)}
                              className="p-2 text-neutral-600 hover:text-primary-700 hover:bg-neutral-100 rounded-lg transition-colors"
                              title="Chỉnh sửa"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(voucher.id)}
                              className="p-2 text-neutral-600 hover:text-red-600 hover:bg-neutral-100 rounded-lg transition-colors"
                              title="Xóa"
                              disabled={voucher.usedCount > 0}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-neutral-200">
              <h2 className="font-heading text-2xl font-bold text-neutral-900">
                {editingVoucher ? "Chỉnh sửa voucher" : "Tạo voucher mới"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Code */}
              <div>
                <label className="block font-body text-sm font-medium text-neutral-900 mb-1">
                  Mã voucher
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.code || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                    placeholder="Để trống để tự động tạo"
                    className="flex-1 px-4 py-2 border border-neutral-200 rounded-xl font-mono font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
                    maxLength={20}
                  />
                  <button
                    type="button"
                    onClick={generateCode}
                    className="flex items-center gap-2 px-4 py-2 bg-neutral-100 text-neutral-900 rounded-xl font-body hover:bg-neutral-200 transition-colors"
                  >
                    <Sparkles className="w-4 h-4" />
                    Tạo tự động
                  </button>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block font-body text-sm font-medium text-neutral-900 mb-1">
                  Tên voucher *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
                  maxLength={100}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-body text-sm font-medium text-neutral-900 mb-1">
                  Mô tả
                </label>
                <textarea
                  value={formData.description || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={2}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
                  maxLength={500}
                />
              </div>

              {/* Type and Value */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-body text-sm font-medium text-neutral-900 mb-1">
                    Loại giảm giá *
                  </label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value as VoucherType,
                      })
                    }
                    className="w-full px-4 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
                  >
                    <option value="PERCENTAGE">Phần trăm</option>
                    <option value="FIXED_AMOUNT">Giảm cố định</option>
                    <option value="FREE_SHIPPING">Miễn phí ship</option>
                  </select>
                </div>
                <div>
                  <label className="block font-body text-sm font-medium text-neutral-900 mb-1">
                    Giá trị *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        value: Number(e.target.value),
                      })
                    }
                    min="0"
                    className="w-full px-4 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    {formData.type === "PERCENTAGE"
                      ? "Phần trăm (0-100)"
                      : formData.type === "FIXED_AMOUNT"
                        ? "Số tiền (VND)"
                        : "Không áp dụng"}
                  </p>
                </div>
              </div>

              {/* Min Order Amount and Max Discount */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-body text-sm font-medium text-neutral-900 mb-1">
                    Đơn hàng tối thiểu
                  </label>
                  <input
                    type="number"
                    value={formData.minOrderAmount || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minOrderAmount: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                    min="0"
                    className="w-full px-4 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
                  />
                </div>
                {formData.type === "PERCENTAGE" && (
                  <div>
                    <label className="block font-body text-sm font-medium text-neutral-900 mb-1">
                      Giảm tối đa
                    </label>
                    <input
                      type="number"
                      value={formData.maxDiscount || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxDiscount: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        })
                      }
                      min="0"
                      className="w-full px-4 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
                    />
                  </div>
                )}
              </div>

              {/* Usage Limits */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-body text-sm font-medium text-neutral-900 mb-1">
                    Giới hạn sử dụng
                  </label>
                  <input
                    type="number"
                    value={formData.usageLimit || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        usageLimit: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                    min="1"
                    placeholder="Không giới hạn"
                    className="w-full px-4 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
                  />
                </div>
                <div>
                  <label className="block font-body text-sm font-medium text-neutral-900 mb-1">
                    Giới hạn/người *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.perUserLimit}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        perUserLimit: Number(e.target.value),
                      })
                    }
                    min="1"
                    max="100"
                    className="w-full px-4 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
                  />
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-body text-sm font-medium text-neutral-900 mb-1">
                    Ngày bắt đầu *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
                  />
                </div>
                <div>
                  <label className="block font-body text-sm font-medium text-neutral-900 mb-1">
                    Ngày kết thúc *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
                  />
                </div>
              </div>

              {/* Active */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="w-4 h-4 text-primary-700 border-neutral-300 rounded focus:ring-2 focus:ring-primary-700"
                />
                <label
                  htmlFor="isActive"
                  className="font-body text-sm text-neutral-900"
                >
                  Kích hoạt voucher
                </label>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-body text-sm">{error}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-primary-700 text-white rounded-xl font-body font-medium hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 mx-auto animate-spin" />
                  ) : editingVoucher ? (
                    "Cập nhật"
                  ) : (
                    "Tạo voucher"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-neutral-100 text-neutral-900 rounded-xl font-body font-medium hover:bg-neutral-200 transition-colors"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
