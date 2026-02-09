"use client";

import { useEffect, useState, useCallback } from "react";
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
  Zap,
  Package,
} from "lucide-react";

interface FlashSaleItem {
  id: string;
  flashSaleId: string;
  productId: string;
  salePrice: number;
  quantity: number;
  soldCount: number;
  product: {
    id: string;
    name: string;
    slug: string;
    basePrice: number;
    images: { id: string; url: string; altText: string | null; isPrimary: boolean }[];
  };
}

interface FlashSale {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt: string;
  items?: FlashSaleItem[];
  _count?: { items: number };
}

interface FlashSaleFormData {
  name: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface ProductSearchResult {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  images: { url: string; isPrimary: boolean }[];
}

function formatVND(value: number): string {
  return new Intl.NumberFormat("vi-VN").format(value) + "d";
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toDateTimeLocal(dateStr: string): string {
  const date = new Date(dateStr);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

function getStatus(
  flashSale: FlashSale
): { label: string; bg: string; text: string } {
  const now = new Date();
  const start = new Date(flashSale.startTime);
  const end = new Date(flashSale.endTime);

  if (!flashSale.isActive || end < now) {
    return {
      label: "Da ket thuc",
      bg: "bg-gray-100",
      text: "text-gray-800",
    };
  }

  if (start > now) {
    return {
      label: "Sap dien ra",
      bg: "bg-blue-100",
      text: "text-blue-800",
    };
  }

  return {
    label: "Dang dien ra",
    bg: "bg-green-100",
    text: "text-green-800",
  };
}

export default function FlashSalesPage() {
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingFlashSale, setEditingFlashSale] = useState<FlashSale | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);
  const limit = 20;

  // Item management state
  const [managingFlashSale, setManagingFlashSale] = useState<FlashSale | null>(
    null
  );
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [productResults, setProductResults] = useState<ProductSearchResult[]>(
    []
  );
  const [searchingProducts, setSearchingProducts] = useState(false);
  const [addingItem, setAddingItem] = useState(false);
  const [newItemPrice, setNewItemPrice] = useState(0);
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [selectedProduct, setSelectedProduct] =
    useState<ProductSearchResult | null>(null);

  const defaultStartTime = new Date().toISOString().slice(0, 16);
  const defaultEndTime = new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 16);

  const [formData, setFormData] = useState<FlashSaleFormData>({
    name: "",
    startTime: defaultStartTime,
    endTime: defaultEndTime,
    isActive: true,
  });

  const fetchFlashSales = useCallback(async () => {
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
        data: FlashSale[];
        meta: { total: number; page: number; totalPages: number };
      }>(`/flash-sales?${params}`);
      setFlashSales(response.data || []);
      setTotalPages(response.meta?.totalPages || 1);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Khong the tai danh sach flash sale");
      }
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery]);

  useEffect(() => {
    fetchFlashSales();
  }, [fetchFlashSales]);

  function handleSearch() {
    setCurrentPage(1);
    fetchFlashSales();
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      handleSearch();
    }
  }

  function openCreateModal() {
    setEditingFlashSale(null);
    setFormData({
      name: "",
      startTime: new Date().toISOString().slice(0, 16),
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 16),
      isActive: true,
    });
    setShowModal(true);
  }

  function openEditModal(flashSale: FlashSale) {
    setEditingFlashSale(flashSale);
    setFormData({
      name: flashSale.name,
      startTime: toDateTimeLocal(flashSale.startTime),
      endTime: toDateTimeLocal(flashSale.endTime),
      isActive: flashSale.isActive,
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        name: formData.name,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        isActive: formData.isActive,
      };

      if (editingFlashSale) {
        await apiClient.put(`/flash-sales/${editingFlashSale.id}`, payload);
        setShowModal(false);
        fetchFlashSales();
      } else {
        const created = await apiClient.post<FlashSale>(
          "/flash-sales",
          payload
        );
        setShowModal(false);
        fetchFlashSales();
        // Open item management for the newly created flash sale
        openItemsModal(created);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Khong the luu flash sale");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Ban co chac muon xoa flash sale nay?")) {
      return;
    }

    try {
      await apiClient.delete(`/flash-sales/${id}`);
      fetchFlashSales();
    } catch (err) {
      if (err instanceof ApiError) {
        alert(err.message);
      } else {
        alert("Khong the xoa flash sale");
      }
    }
  }

  async function openItemsModal(flashSale: FlashSale) {
    try {
      const detailed = await apiClient.get<FlashSale>(
        `/flash-sales/${flashSale.id}`
      );
      setManagingFlashSale(detailed);
      setShowItemsModal(true);
      setProductSearch("");
      setProductResults([]);
      setSelectedProduct(null);
      setNewItemPrice(0);
      setNewItemQuantity(1);
    } catch (err) {
      if (err instanceof ApiError) {
        alert(err.message);
      } else {
        alert("Khong the tai chi tiet flash sale");
      }
    }
  }

  async function searchProducts() {
    if (!productSearch.trim()) return;
    setSearchingProducts(true);
    try {
      const response = await apiClient.get<{
        data: ProductSearchResult[];
      }>(`/admin/products?search=${encodeURIComponent(productSearch)}&limit=10`);
      setProductResults(response.data || []);
    } catch {
      setProductResults([]);
    } finally {
      setSearchingProducts(false);
    }
  }

  function handleProductSearchKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (e.key === "Enter") {
      e.preventDefault();
      searchProducts();
    }
  }

  async function handleAddItem() {
    if (!selectedProduct || !managingFlashSale) return;
    setAddingItem(true);
    try {
      await apiClient.post(`/flash-sales/${managingFlashSale.id}/items`, {
        productId: selectedProduct.id,
        salePrice: newItemPrice,
        quantity: newItemQuantity,
      });
      // Refresh the flash sale details
      const detailed = await apiClient.get<FlashSale>(
        `/flash-sales/${managingFlashSale.id}`
      );
      setManagingFlashSale(detailed);
      setSelectedProduct(null);
      setNewItemPrice(0);
      setNewItemQuantity(1);
      setProductSearch("");
      setProductResults([]);
      fetchFlashSales();
    } catch (err) {
      if (err instanceof ApiError) {
        alert(err.message);
      } else {
        alert("Khong the them san pham");
      }
    } finally {
      setAddingItem(false);
    }
  }

  async function handleRemoveItem(productId: string) {
    if (!managingFlashSale) return;
    if (!confirm("Ban co chac muon xoa san pham nay khoi flash sale?")) return;

    try {
      await apiClient.delete(
        `/flash-sales/${managingFlashSale.id}/items/${productId}`
      );
      const detailed = await apiClient.get<FlashSale>(
        `/flash-sales/${managingFlashSale.id}`
      );
      setManagingFlashSale(detailed);
      fetchFlashSales();
    } catch (err) {
      if (err instanceof ApiError) {
        alert(err.message);
      } else {
        alert("Khong the xoa san pham");
      }
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-neutral-900">
            Quan ly Flash Sale
          </h1>
          <p className="font-body text-neutral-600 mt-1">
            Tao va quan ly cac chuong trinh flash sale
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-primary-700 text-white rounded-xl font-body font-medium hover:bg-primary-800 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Tao Flash Sale
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[240px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Tim theo ten flash sale..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary-700 animate-spin" />
          </div>
        ) : error && flashSales.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-12 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <span className="font-body">{error}</span>
          </div>
        ) : flashSales.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
            <Zap className="w-12 h-12 mb-2" />
            <p className="font-body">Chua co flash sale nao</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-body font-semibold text-neutral-900">
                      Ten
                    </th>
                    <th className="px-4 py-3 text-center font-body font-semibold text-neutral-900">
                      Bat dau
                    </th>
                    <th className="px-4 py-3 text-center font-body font-semibold text-neutral-900">
                      Ket thuc
                    </th>
                    <th className="px-4 py-3 text-center font-body font-semibold text-neutral-900">
                      San pham
                    </th>
                    <th className="px-4 py-3 text-center font-body font-semibold text-neutral-900">
                      Trang thai
                    </th>
                    <th className="px-4 py-3 text-right font-body font-semibold text-neutral-900">
                      Thao tac
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {flashSales.map((flashSale) => {
                    const status = getStatus(flashSale);

                    return (
                      <tr key={flashSale.id} className="hover:bg-neutral-50">
                        <td className="px-4 py-3">
                          <div className="font-body font-medium text-neutral-900">
                            {flashSale.name}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="font-body text-sm text-neutral-600">
                            {formatDateTime(flashSale.startTime)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="font-body text-sm text-neutral-600">
                            {formatDateTime(flashSale.endTime)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-body text-sm text-neutral-900">
                            {flashSale._count?.items ?? 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={cn(
                              "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-body font-medium",
                              status.bg,
                              status.text
                            )}
                          >
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openItemsModal(flashSale)}
                              className="p-2 text-neutral-600 hover:text-primary-700 hover:bg-neutral-100 rounded-lg transition-colors"
                              title="Quan ly san pham"
                            >
                              <Package className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEditModal(flashSale)}
                              className="p-2 text-neutral-600 hover:text-primary-700 hover:bg-neutral-100 rounded-lg transition-colors"
                              title="Chinh sua"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(flashSale.id)}
                              className="p-2 text-neutral-600 hover:text-red-600 hover:bg-neutral-100 rounded-lg transition-colors"
                              title="Xoa"
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
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-neutral-200">
              <h2 className="font-heading text-2xl font-bold text-neutral-900">
                {editingFlashSale
                  ? "Chinh sua Flash Sale"
                  : "Tao Flash Sale moi"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block font-body text-sm font-medium text-neutral-900 mb-1">
                  Ten flash sale *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
                  maxLength={200}
                />
              </div>

              {/* Start Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-body text-sm font-medium text-neutral-900 mb-1">
                    Thoi gian bat dau *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData({ ...formData, startTime: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
                  />
                </div>
                <div>
                  <label className="block font-body text-sm font-medium text-neutral-900 mb-1">
                    Thoi gian ket thuc *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData({ ...formData, endTime: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
                  />
                </div>
              </div>

              {/* Active */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="fsIsActive"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="w-4 h-4 text-primary-700 border-neutral-300 rounded focus:ring-2 focus:ring-primary-700"
                />
                <label
                  htmlFor="fsIsActive"
                  className="font-body text-sm text-neutral-900"
                >
                  Kich hoat flash sale
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
                  ) : editingFlashSale ? (
                    "Cap nhat"
                  ) : (
                    "Tao Flash Sale"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-neutral-100 text-neutral-900 rounded-xl font-body font-medium hover:bg-neutral-200 transition-colors"
                >
                  Huy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Items Management Modal */}
      {showItemsModal && managingFlashSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-neutral-200">
              <div>
                <h2 className="font-heading text-2xl font-bold text-neutral-900">
                  Quan ly san pham
                </h2>
                <p className="font-body text-sm text-neutral-600 mt-1">
                  {managingFlashSale.name}
                </p>
              </div>
              <button
                onClick={() => setShowItemsModal(false)}
                className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Add Product Section */}
              <div className="bg-neutral-50 rounded-xl p-4 space-y-4">
                <h3 className="font-body font-semibold text-neutral-900">
                  Them san pham
                </h3>

                {/* Product Search */}
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="Tim san pham theo ten..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      onKeyDown={handleProductSearchKeyDown}
                      className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700 bg-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={searchProducts}
                    disabled={searchingProducts}
                    className="px-4 py-2 bg-primary-700 text-white rounded-xl font-body font-medium hover:bg-primary-800 disabled:opacity-50 transition-colors"
                  >
                    {searchingProducts ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      "Tim"
                    )}
                  </button>
                </div>

                {/* Product Search Results */}
                {productResults.length > 0 && !selectedProduct && (
                  <div className="bg-white border border-neutral-200 rounded-xl max-h-48 overflow-y-auto">
                    {productResults.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => {
                          setSelectedProduct(product);
                          setNewItemPrice(Number(product.basePrice));
                          setProductResults([]);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-neutral-50 border-b border-neutral-100 last:border-b-0 transition-colors"
                      >
                        {product.images?.[0] && (
                          <img
                            src={product.images[0].url}
                            alt={product.name}
                            className="w-10 h-10 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-body text-sm font-medium text-neutral-900 truncate">
                            {product.name}
                          </div>
                          <div className="font-body text-xs text-neutral-500">
                            {formatVND(Number(product.basePrice))}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Selected Product + Price/Quantity */}
                {selectedProduct && (
                  <div className="bg-white border border-primary-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {selectedProduct.images?.[0] && (
                          <img
                            src={selectedProduct.images[0].url}
                            alt={selectedProduct.name}
                            className="w-10 h-10 object-cover rounded-lg"
                          />
                        )}
                        <div>
                          <div className="font-body text-sm font-medium text-neutral-900">
                            {selectedProduct.name}
                          </div>
                          <div className="font-body text-xs text-neutral-500">
                            Gia goc:{" "}
                            {formatVND(Number(selectedProduct.basePrice))}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedProduct(null)}
                        className="p-1 text-neutral-400 hover:text-neutral-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-body text-xs font-medium text-neutral-700 mb-1">
                          Gia sale (VND) *
                        </label>
                        <input
                          type="number"
                          value={newItemPrice}
                          onChange={(e) =>
                            setNewItemPrice(Number(e.target.value))
                          }
                          min="0"
                          className="w-full px-3 py-2 border border-neutral-200 rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary-700"
                        />
                      </div>
                      <div>
                        <label className="block font-body text-xs font-medium text-neutral-700 mb-1">
                          So luong *
                        </label>
                        <input
                          type="number"
                          value={newItemQuantity}
                          onChange={(e) =>
                            setNewItemQuantity(Number(e.target.value))
                          }
                          min="1"
                          className="w-full px-3 py-2 border border-neutral-200 rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary-700"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddItem}
                      disabled={addingItem || newItemPrice <= 0}
                      className="w-full px-4 py-2 bg-primary-700 text-white rounded-xl font-body font-medium hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {addingItem ? (
                        <Loader2 className="w-5 h-5 mx-auto animate-spin" />
                      ) : (
                        "Them san pham"
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Current Items */}
              <div>
                <h3 className="font-body font-semibold text-neutral-900 mb-3">
                  San pham hien tai ({managingFlashSale.items?.length ?? 0})
                </h3>

                {!managingFlashSale.items ||
                managingFlashSale.items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-neutral-500">
                    <Package className="w-10 h-10 mb-2" />
                    <p className="font-body text-sm">
                      Chua co san pham nao trong flash sale
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {managingFlashSale.items.map((item) => {
                      const progress =
                        item.quantity > 0
                          ? Math.min(
                              (item.soldCount / item.quantity) * 100,
                              100
                            )
                          : 0;

                      return (
                        <div
                          key={item.id}
                          className="flex items-center gap-4 bg-white border border-neutral-200 rounded-xl p-4"
                        >
                          {item.product.images?.[0] && (
                            <img
                              src={item.product.images[0].url}
                              alt={item.product.name}
                              className="w-14 h-14 object-cover rounded-lg flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-body font-medium text-neutral-900 truncate">
                              {item.product.name}
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="font-body text-sm text-red-600 font-semibold">
                                {formatVND(Number(item.salePrice))}
                              </span>
                              <span className="font-body text-xs text-neutral-400 line-through">
                                {formatVND(Number(item.product.basePrice))}
                              </span>
                            </div>
                            <div className="mt-2">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-body text-xs text-neutral-500">
                                  Da ban: {item.soldCount}/{item.quantity}
                                </span>
                                <span className="font-body text-xs text-neutral-500">
                                  {Math.round(progress)}%
                                </span>
                              </div>
                              <div className="w-full bg-neutral-200 rounded-full h-2">
                                <div
                                  className="bg-red-500 h-2 rounded-full transition-all"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              handleRemoveItem(item.product.id)
                            }
                            className="p-2 text-neutral-400 hover:text-red-600 hover:bg-neutral-100 rounded-lg transition-colors flex-shrink-0"
                            title="Xoa san pham"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Close Button */}
            <div className="p-6 border-t border-neutral-200">
              <button
                type="button"
                onClick={() => setShowItemsModal(false)}
                className="w-full px-4 py-2 bg-neutral-100 text-neutral-900 rounded-xl font-body font-medium hover:bg-neutral-200 transition-colors"
              >
                Dong
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
