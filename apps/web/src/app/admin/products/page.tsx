"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { apiClient, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Loader2, AlertCircle, Search, Plus, Edit, Trash2, ChevronLeft, ChevronRight, Download, Upload, FileDown, X } from "lucide-react";

interface Product {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  salePrice: number | null;
  stockQuantity: number;
  isActive: boolean;
  categoryId: string | null;
  category?: {
    id: string;
    name: string;
  };
  images: Array<{
    url: string;
    isPrimary: boolean;
  }>;
}

interface Category {
  id: string;
  name: string;
}

interface ImportResult {
  imported: number;
  errors: string[];
}

function formatVND(value: number): string {
  return new Intl.NumberFormat("vi-VN").format(value) + "đ";
}

const CSV_HEADERS = [
  "SKU",
  "Name",
  "Slug",
  "Base Price",
  "Sale Price",
  "Stock",
  "Category",
  "Brand",
  "Description",
  "Short Desc",
  "Tags",
  "Weight",
  "Active",
  "Featured",
];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const limit = 20;

  // CSV states
  const [exportLoading, setExportLoading] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<string[][] | null>(null);
  const [importHeaders, setImportHeaders] = useState<string[] | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importCsvContent, setImportCsvContent] = useState<string>("");

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, selectedCategory]);

  async function fetchCategories() {
    try {
      const response = await apiClient.get<{ categories: Category[] }>("/admin/categories");
      setCategories(response.categories || []);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  }

  async function fetchProducts() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      });
      if (selectedCategory) {
        params.append("categoryId", selectedCategory);
      }
      const response = await apiClient.get<{
        products: Product[];
        total: number;
        page: number;
        totalPages: number;
      }>(`/admin/products?${params}`);
      setProducts(response.products || []);
      setTotalPages(response.totalPages || 1);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Khong the tai danh sach san pham");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Ban co chac muon xoa san pham "${name}"?`)) {
      return;
    }
    setDeleteLoading(id);
    try {
      await apiClient.delete(`/admin/products/${id}`);
      await fetchProducts();
    } catch (err) {
      if (err instanceof ApiError) {
        alert(`Loi: ${err.message}`);
      } else {
        alert("Khong the xoa san pham");
      }
    } finally {
      setDeleteLoading(null);
    }
  }

  // =============================================
  // CSV Export
  // =============================================
  const handleExport = useCallback(async () => {
    setExportLoading(true);
    try {
      // Use fetch directly since apiClient always parses JSON,
      // but our endpoint returns text/csv
      const { useAuthStore } = await import("@/stores/authStore");
      const token = useAuthStore.getState().accessToken;
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

      const response = await fetch(`${baseUrl}/admin/products/export`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const csvText = await response.text();
      const blob = new Blob([csvText], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `products-${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Khong the xuat file CSV");
    } finally {
      setExportLoading(false);
    }
  }, []);

  // =============================================
  // CSV Template Download
  // =============================================
  const handleDownloadTemplate = useCallback(() => {
    const csv = "\uFEFF" + CSV_HEADERS.join(",") + "\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "products-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  // =============================================
  // CSV Import
  // =============================================
  function parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setImportFile(file);
      setImportResult(null);

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        // Remove BOM if present
        const cleanText = text.replace(/^\uFEFF/, "");
        setImportCsvContent(cleanText);

        const lines = cleanText.split("\n").filter((l) => l.trim());
        if (lines.length > 0) {
          const headers = parseCsvLine(lines[0]);
          setImportHeaders(headers);

          const previewRows: string[][] = [];
          for (let i = 1; i < Math.min(lines.length, 6); i++) {
            previewRows.push(parseCsvLine(lines[i]));
          }
          setImportPreview(previewRows);
        }
      };
      reader.readAsText(file, "UTF-8");
    },
    [],
  );

  const handleImport = useCallback(async () => {
    if (!importCsvContent) return;

    setImportLoading(true);
    setImportResult(null);

    try {
      const result = await apiClient.post<ImportResult>(
        "/admin/products/import",
        { csvContent: importCsvContent },
      );
      setImportResult(result);
      // Refresh products list after import
      await fetchProducts();
    } catch (err) {
      if (err instanceof ApiError) {
        setImportResult({ imported: 0, errors: [err.message] });
      } else {
        setImportResult({
          imported: 0,
          errors: ["Khong the nhap file CSV"],
        });
      }
    } finally {
      setImportLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importCsvContent]);

  const closeImportModal = useCallback(() => {
    setImportModalOpen(false);
    setImportFile(null);
    setImportPreview(null);
    setImportHeaders(null);
    setImportResult(null);
    setImportCsvContent("");
  }, []);

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-neutral-900">
            Quan ly san pham
          </h1>
          <p className="font-body text-neutral-600 mt-1">
            Quan ly danh sach san pham trong cua hang
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-2 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-xl font-body font-medium hover:bg-neutral-50 transition-colors"
            title="Tai mau CSV"
          >
            <FileDown className="w-5 h-5" />
            Tai mau CSV
          </button>
          <button
            onClick={handleExport}
            disabled={exportLoading}
            className="inline-flex items-center gap-2 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-xl font-body font-medium hover:bg-neutral-50 transition-colors disabled:opacity-50"
            title="Xuat CSV"
          >
            {exportLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            Xuat CSV
          </button>
          <button
            onClick={() => setImportModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-xl font-body font-medium hover:bg-neutral-50 transition-colors"
            title="Nhap CSV"
          >
            <Upload className="w-5 h-5" />
            Nhap CSV
          </button>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-700 text-white rounded-xl font-body font-medium hover:bg-primary-800 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Them san pham
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 p-4 space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Tim kiem san pham..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-neutral-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-700"
          >
            <option value="">Tat ca danh muc</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

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
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
            <AlertCircle className="w-12 h-12 mb-2" />
            <p className="font-body">Khong co san pham nao</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-body font-semibold text-neutral-900">
                      Hinh anh
                    </th>
                    <th className="px-4 py-3 text-left font-body font-semibold text-neutral-900">
                      Ten san pham
                    </th>
                    <th className="px-4 py-3 text-left font-body font-semibold text-neutral-900">
                      Danh muc
                    </th>
                    <th className="px-4 py-3 text-left font-body font-semibold text-neutral-900">
                      Gia
                    </th>
                    <th className="px-4 py-3 text-left font-body font-semibold text-neutral-900">
                      Kho
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
                  {filteredProducts.map((product) => {
                    const primaryImage = product.images?.find((img) => img.isPrimary);
                    const displayPrice = product.salePrice || product.basePrice;
                    return (
                      <tr key={product.id} className="hover:bg-neutral-50">
                        <td className="px-4 py-3">
                          {primaryImage ? (
                            <img
                              src={primaryImage.url}
                              alt={product.name}
                              className="w-10 h-10 object-cover rounded-lg border border-neutral-200"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-neutral-100 rounded-lg border border-neutral-200" />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-body font-medium text-neutral-900">
                              {product.name}
                            </div>
                            <div className="font-body text-sm text-neutral-500">
                              {product.slug}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-body text-neutral-700">
                            {product.category?.name || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-body">
                            {product.salePrice && (
                              <div className="text-neutral-400 line-through text-sm">
                                {formatVND(product.basePrice)}
                              </div>
                            )}
                            <div className="text-neutral-900 font-medium">
                              {formatVND(displayPrice)}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "font-body",
                              product.stockQuantity > 0
                                ? "text-neutral-900"
                                : "text-red-600 font-medium"
                            )}
                          >
                            {product.stockQuantity}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-body font-medium",
                              product.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-neutral-100 text-neutral-800"
                            )}
                          >
                            {product.isActive ? "Hoat dong" : "An"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/admin/products/${product.id}`}
                              className="p-2 text-neutral-600 hover:text-primary-700 hover:bg-neutral-100 rounded-lg transition-colors"
                              title="Chinh sua"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleDelete(product.id, product.name)}
                              disabled={deleteLoading === product.id}
                              className="p-2 text-neutral-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Xoa"
                            >
                              {deleteLoading === product.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200">
                <div className="font-body text-sm text-neutral-600">
                  Trang {currentPage} / {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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

      {/* Import CSV Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
              <h2 className="font-heading text-xl font-bold text-neutral-900">
                Nhap san pham tu CSV
              </h2>
              <button
                onClick={closeImportModal}
                className="p-2 text-neutral-400 hover:text-neutral-600 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* File Input */}
              <div>
                <label className="block font-body font-medium text-neutral-700 mb-2">
                  Chon file CSV
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-neutral-500 font-body
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-xl file:border file:border-neutral-300
                    file:text-sm file:font-medium file:font-body
                    file:bg-white file:text-neutral-700
                    hover:file:bg-neutral-50 file:cursor-pointer file:transition-colors"
                />
                <p className="mt-2 text-sm text-neutral-500 font-body">
                  San pham se duoc cap nhat theo SKU (neu ton tai) hoac tao moi.
                  <button
                    onClick={handleDownloadTemplate}
                    className="text-primary-700 hover:underline ml-1"
                  >
                    Tai mau CSV
                  </button>
                </p>
              </div>

              {/* Preview Table */}
              {importHeaders && importPreview && importPreview.length > 0 && (
                <div>
                  <h3 className="font-body font-medium text-neutral-700 mb-2">
                    Xem truoc (5 dong dau)
                  </h3>
                  <div className="overflow-x-auto border border-neutral-200 rounded-xl">
                    <table className="w-full text-sm">
                      <thead className="bg-neutral-50">
                        <tr>
                          {importHeaders.map((header, idx) => (
                            <th
                              key={idx}
                              className="px-3 py-2 text-left font-body font-semibold text-neutral-700 whitespace-nowrap"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {importPreview.map((row, rowIdx) => (
                          <tr key={rowIdx}>
                            {row.map((cell, cellIdx) => (
                              <td
                                key={cellIdx}
                                className="px-3 py-2 font-body text-neutral-600 whitespace-nowrap max-w-[200px] truncate"
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Import Result */}
              {importResult && (
                <div
                  className={cn(
                    "p-4 rounded-xl border",
                    importResult.errors.length > 0
                      ? "border-yellow-200 bg-yellow-50"
                      : "border-green-200 bg-green-50",
                  )}
                >
                  <p className="font-body font-medium text-neutral-900">
                    Da nhap {importResult.imported} san pham.{" "}
                    {importResult.errors.length > 0 &&
                      `${importResult.errors.length} loi.`}
                  </p>
                  {importResult.errors.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {importResult.errors.map((err, idx) => (
                        <li
                          key={idx}
                          className="font-body text-sm text-red-700"
                        >
                          {err}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-200">
              <button
                onClick={closeImportModal}
                className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-xl font-body font-medium hover:bg-neutral-50 transition-colors"
              >
                Dong
              </button>
              <button
                onClick={handleImport}
                disabled={!importCsvContent || importLoading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-700 text-white rounded-xl font-body font-medium hover:bg-primary-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Upload className="w-5 h-5" />
                )}
                Nhap san pham
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
