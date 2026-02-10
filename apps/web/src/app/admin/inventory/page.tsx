"use client";

import { useEffect, useState, useCallback } from "react";
import { apiClient, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Loader2,
  AlertCircle,
  Search,
  Package,
  AlertTriangle,
  TrendingDown,
  BarChart3,
  RefreshCw,
  Minus,
  Plus,
  X,
  Link2,
} from "lucide-react";

interface InventoryItem {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  stockQuantity: number;
  basePrice: number;
  salePrice: number | null;
  pancakeId: string | null;
  isActive: boolean;
  images: Array<{ url: string }>;
  variants: Array<{
    id: string;
    name: string;
    sku: string | null;
    stockQuantity: number;
    pancakeId: string | null;
  }>;
  category: { name: string } | null;
}

interface Summary {
  totalProducts: number;
  outOfStock: number;
  lowStock: number;
  totalStock: number;
  pancakeMapped: number;
}

function formatVND(value: number): string {
  return new Intl.NumberFormat("vi-VN").format(value) + "đ";
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [sort, setSort] = useState("stock-asc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Adjust dialog
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
  const [adjustVariantId, setAdjustVariantId] = useState<string | null>(null);
  const [adjustType, setAdjustType] = useState<"set" | "add" | "subtract">("set");
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustLoading, setAdjustLoading] = useState(false);

  // Pancake sync
  const [syncLoading, setSyncLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
        sort,
      });
      if (search) params.append("search", search);
      if (filterLowStock) params.append("lowStock", "true");

      const [inventoryRes, summaryRes] = await Promise.all([
        apiClient.get<{
          items: InventoryItem[];
          total: number;
          page: number;
          totalPages: number;
        }>(`/admin/inventory?${params}`),
        apiClient.get<Summary>("/admin/inventory/summary"),
      ]);

      setItems(inventoryRes.items || []);
      setTotalPages(inventoryRes.totalPages || 1);
      setSummary(summaryRes);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Khong the tai du lieu ton kho");
      }
    } finally {
      setLoading(false);
    }
  }, [page, sort, search, filterLowStock]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = useCallback(() => {
    setPage(1);
    fetchData();
  }, [fetchData]);

  const openAdjustDialog = (item: InventoryItem, variantId?: string) => {
    setAdjustItem(item);
    setAdjustVariantId(variantId || null);
    setAdjustType("set");
    setAdjustQty("");
    setAdjustReason("");
  };

  const handleAdjust = async () => {
    if (!adjustItem || adjustQty === "") return;
    setAdjustLoading(true);
    try {
      await apiClient.post(`/admin/inventory/${adjustItem.id}/adjust`, {
        quantity: parseInt(adjustQty, 10),
        type: adjustType,
        variantId: adjustVariantId || undefined,
        reason: adjustReason || undefined,
      });
      setAdjustItem(null);
      await fetchData();
    } catch (err) {
      if (err instanceof ApiError) {
        alert(`Loi: ${err.message}`);
      } else {
        alert("Khong the dieu chinh ton kho");
      }
    } finally {
      setAdjustLoading(false);
    }
  };

  const handlePancakeSync = async () => {
    if (!confirm("Dong bo ton kho tu Pancake POS? Du lieu ton kho se duoc cap nhat.")) return;
    setSyncLoading(true);
    try {
      await apiClient.post("/admin/pancake/sync-inventory", {});
      await fetchData();
    } catch (err) {
      if (err instanceof ApiError) {
        alert(`Loi dong bo: ${err.message}`);
      } else {
        alert("Khong the dong bo voi Pancake");
      }
    } finally {
      setSyncLoading(false);
    }
  };

  const getStockBadge = (qty: number) => {
    if (qty <= 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
          Het hang
        </span>
      );
    }
    if (qty <= 10) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
          Sap het
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
        Con hang
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-neutral-900">
            Quan ly ton kho
          </h1>
          <p className="font-body text-neutral-600 mt-1">
            Theo doi va dieu chinh so luong ton kho, dong bo voi Pancake POS
          </p>
        </div>
        <button
          onClick={handlePancakeSync}
          disabled={syncLoading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-700 text-white rounded-xl font-body font-medium hover:bg-primary-800 transition-colors disabled:opacity-50"
        >
          {syncLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <RefreshCw className="w-5 h-5" />
          )}
          Dong bo Pancake
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-body text-sm text-neutral-500">Tong san pham</p>
                <p className="font-heading text-xl font-bold text-neutral-900">
                  {summary.totalProducts}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-body text-sm text-neutral-500">Tong ton kho</p>
                <p className="font-heading text-xl font-bold text-neutral-900">
                  {summary.totalStock}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="font-body text-sm text-neutral-500">Sap het hang</p>
                <p className="font-heading text-xl font-bold text-yellow-600">
                  {summary.lowStock}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="font-body text-sm text-neutral-500">Het hang</p>
                <p className="font-heading text-xl font-bold text-red-600">
                  {summary.outOfStock}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Link2 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-body text-sm text-neutral-500">Lien ket Pancake</p>
                <p className="font-heading text-xl font-bold text-neutral-900">
                  {summary.pancakeMapped}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Tim theo ten hoac SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filterLowStock}
              onChange={(e) => {
                setFilterLowStock(e.target.checked);
                setPage(1);
              }}
              className="w-4 h-4 text-primary-700 rounded border-neutral-300 focus:ring-primary-700"
            />
            <span className="font-body text-sm text-neutral-700">Chi hien thi sap het hang</span>
          </label>
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
          >
            <option value="stock-asc">Ton kho: Thap → Cao</option>
            <option value="stock-desc">Ton kho: Cao → Thap</option>
            <option value="name">Ten A-Z</option>
          </select>
        </div>
      </div>

      {/* Inventory Table */}
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
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
            <Package className="w-12 h-12 mb-2" />
            <p className="font-body">Khong co san pham nao</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-body font-semibold text-neutral-900">
                      San pham
                    </th>
                    <th className="px-4 py-3 text-left font-body font-semibold text-neutral-900">
                      SKU
                    </th>
                    <th className="px-4 py-3 text-left font-body font-semibold text-neutral-900">
                      Danh muc
                    </th>
                    <th className="px-4 py-3 text-center font-body font-semibold text-neutral-900">
                      Ton kho
                    </th>
                    <th className="px-4 py-3 text-center font-body font-semibold text-neutral-900">
                      Trang thai
                    </th>
                    <th className="px-4 py-3 text-center font-body font-semibold text-neutral-900">
                      Pancake
                    </th>
                    <th className="px-4 py-3 text-right font-body font-semibold text-neutral-900">
                      Thao tac
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {item.images[0] ? (
                            <img
                              src={item.images[0].url}
                              alt={item.name}
                              className="w-10 h-10 object-cover rounded-lg border border-neutral-200"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-neutral-100 rounded-lg border border-neutral-200" />
                          )}
                          <div>
                            <div className="font-body font-medium text-neutral-900 max-w-[250px] truncate">
                              {item.name}
                            </div>
                            {item.variants.length > 0 && (
                              <span className="font-body text-xs text-neutral-400">
                                {item.variants.length} bien the
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-body text-sm text-neutral-600">
                          {item.sku || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-body text-sm text-neutral-600">
                          {item.category?.name || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={cn(
                            "font-heading font-bold text-lg",
                            item.stockQuantity <= 0
                              ? "text-red-600"
                              : item.stockQuantity <= 10
                                ? "text-yellow-600"
                                : "text-neutral-900"
                          )}
                        >
                          {item.stockQuantity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {getStockBadge(item.stockQuantity)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.pancakeId ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                            <Link2 className="w-3 h-3" />
                            Da lien ket
                          </span>
                        ) : (
                          <span className="text-xs text-neutral-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openAdjustDialog(item)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-body font-medium text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                          >
                            Dieu chinh
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Variant rows - expandable within each product */}
            {items.some((i) => i.variants.length > 0) && (
              <div className="px-4 py-2 bg-neutral-50 border-t border-neutral-200">
                <p className="font-body text-xs text-neutral-500">
                  * Nhan &quot;Dieu chinh&quot; de xem va chinh sua ton kho theo bien the
                </p>
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200">
                <div className="font-body text-sm text-neutral-600">
                  Trang {page} / {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 border border-neutral-200 rounded-lg font-body text-sm hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Truoc
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 border border-neutral-200 rounded-lg font-body text-sm hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Adjust Stock Dialog */}
      {adjustItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
              <h2 className="font-heading text-xl font-bold text-neutral-900">
                Dieu chinh ton kho
              </h2>
              <button
                onClick={() => setAdjustItem(null)}
                className="p-2 text-neutral-400 hover:text-neutral-600 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <p className="font-body font-medium text-neutral-900">{adjustItem.name}</p>
                {adjustItem.sku && (
                  <p className="font-body text-sm text-neutral-500">SKU: {adjustItem.sku}</p>
                )}
                <p className="font-body text-sm text-neutral-500 mt-1">
                  Ton kho hien tai:{" "}
                  <span className="font-bold text-neutral-900">
                    {adjustVariantId
                      ? adjustItem.variants.find((v) => v.id === adjustVariantId)?.stockQuantity ?? 0
                      : adjustItem.stockQuantity}
                  </span>
                </p>
              </div>

              {/* Variant selector */}
              {adjustItem.variants.length > 0 && (
                <div>
                  <label className="block font-body text-sm font-medium text-neutral-700 mb-1">
                    Bien the
                  </label>
                  <select
                    value={adjustVariantId || ""}
                    onChange={(e) => setAdjustVariantId(e.target.value || null)}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
                  >
                    <option value="">San pham chinh (khong co bien the)</option>
                    {adjustItem.variants.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} - Ton: {v.stockQuantity}
                        {v.sku ? ` (${v.sku})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-body text-sm font-medium text-neutral-700 mb-1">
                  Loai dieu chinh
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAdjustType("set")}
                    className={cn(
                      "flex-1 px-3 py-2 rounded-xl font-body text-sm font-medium border transition-colors",
                      adjustType === "set"
                        ? "border-primary-700 bg-primary-50 text-primary-700"
                        : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                    )}
                  >
                    Dat gia tri
                  </button>
                  <button
                    onClick={() => setAdjustType("add")}
                    className={cn(
                      "flex-1 px-3 py-2 rounded-xl font-body text-sm font-medium border transition-colors",
                      adjustType === "add"
                        ? "border-green-600 bg-green-50 text-green-700"
                        : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                    )}
                  >
                    <Plus className="w-4 h-4 inline mr-1" />
                    Them
                  </button>
                  <button
                    onClick={() => setAdjustType("subtract")}
                    className={cn(
                      "flex-1 px-3 py-2 rounded-xl font-body text-sm font-medium border transition-colors",
                      adjustType === "subtract"
                        ? "border-red-600 bg-red-50 text-red-700"
                        : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                    )}
                  >
                    <Minus className="w-4 h-4 inline mr-1" />
                    Giam
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-body text-sm font-medium text-neutral-700 mb-1">
                  So luong
                </label>
                <input
                  type="number"
                  min="0"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  placeholder="Nhap so luong"
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
                />
              </div>

              <div>
                <label className="block font-body text-sm font-medium text-neutral-700 mb-1">
                  Ly do (tuy chon)
                </label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="VD: Nhap hang moi, Kiem ke..."
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
                />
              </div>

              {adjustItem.pancakeId && (
                <p className="font-body text-xs text-purple-600 bg-purple-50 px-3 py-2 rounded-lg">
                  San pham nay da lien ket voi Pancake POS. Thay doi se tu dong dong bo.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-200">
              <button
                onClick={() => setAdjustItem(null)}
                className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-xl font-body font-medium hover:bg-neutral-50 transition-colors"
              >
                Huy
              </button>
              <button
                onClick={handleAdjust}
                disabled={adjustQty === "" || adjustLoading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-700 text-white rounded-xl font-body font-medium hover:bg-primary-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {adjustLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Xac nhan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
