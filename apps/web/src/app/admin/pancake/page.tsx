"use client";

import { useState } from "react";
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  Loader2,
  Package,
  ShoppingCart,
  Database,
  AlertCircle,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { cn } from "@/lib/utils";

interface SyncStatus {
  configured: boolean;
  products: { total: number; mapped: number };
  variants: { total: number; mapped: number };
}

interface SyncResult {
  success: boolean;
  synced: number;
  unchanged: number;
  pages: number;
  errors: string[];
}

export default function PancakePage() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    setStatusLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<SyncStatus>("/admin/pancake/status");
      setStatus(data);
    } catch (err: any) {
      setError(err.message || "Khong the ket noi");
    } finally {
      setStatusLoading(false);
    }
  };

  const syncInventory = async () => {
    setSyncing(true);
    setSyncResult(null);
    setError(null);
    try {
      const data = await apiClient.post<SyncResult>(
        "/admin/pancake/sync-inventory"
      );
      setSyncResult(data);
    } catch (err: any) {
      setError(err.message || "Dong bo that bai");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Pancake POS
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Dong bo don hang va ton kho voi Pancake POS (pos.pancake.vn)
        </p>
      </div>

      {/* Connection Status */}
      <div className="rounded-lg border bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Trang thai ket noi</h2>
          <button
            onClick={fetchStatus}
            disabled={statusLoading}
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium",
              "bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
            )}
          >
            {statusLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Kiem tra
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
            <XCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {status && (
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                <Database className="h-4 w-4" />
                Ket noi
              </div>
              <div className="mt-2 flex items-center gap-2">
                {status.configured ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="font-semibold text-green-700">
                      Da cau hinh
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="font-semibold text-red-700">
                      Chua cau hinh
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                <Package className="h-4 w-4" />
                San pham mapped
              </div>
              <div className="mt-2 text-2xl font-bold">
                {status.products.mapped}
                <span className="text-sm font-normal text-gray-500">
                  {" "}
                  / {status.products.total}
                </span>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                <Package className="h-4 w-4" />
                Bien the mapped
              </div>
              <div className="mt-2 text-2xl font-bold">
                {status.variants.mapped}
                <span className="text-sm font-normal text-gray-500">
                  {" "}
                  / {status.variants.total}
                </span>
              </div>
            </div>
          </div>
        )}

        {!status && !error && (
          <p className="mt-4 text-sm text-gray-400">
            Nhan &quot;Kiem tra&quot; de xem trang thai ket noi
          </p>
        )}
      </div>

      {/* Inventory Sync */}
      <div className="rounded-lg border bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Dong bo ton kho</h2>
            <p className="mt-1 text-sm text-gray-500">
              Keo ton kho tu Pancake POS ve cap nhat so luong san pham tren web
            </p>
          </div>
          <button
            onClick={syncInventory}
            disabled={syncing}
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium",
              "bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
            )}
          >
            {syncing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {syncing ? "Dang dong bo..." : "Dong bo ngay"}
          </button>
        </div>

        {syncResult && (
          <div
            className={cn(
              "mt-4 rounded-md p-4",
              syncResult.success ? "bg-green-50" : "bg-yellow-50"
            )}
          >
            <div className="flex items-center gap-2">
              {syncResult.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              )}
              <span
                className={cn(
                  "font-medium",
                  syncResult.success ? "text-green-700" : "text-yellow-700"
                )}
              >
                {syncResult.success
                  ? "Dong bo thanh cong"
                  : "Dong bo co loi"}
              </span>
            </div>
            <div className="mt-2 grid gap-2 text-sm sm:grid-cols-3">
              <div>
                <span className="text-gray-500">Da cap nhat:</span>{" "}
                <span className="font-medium">{syncResult.synced}</span>
              </div>
              <div>
                <span className="text-gray-500">Khong doi:</span>{" "}
                <span className="font-medium">{syncResult.unchanged}</span>
              </div>
              <div>
                <span className="text-gray-500">Trang:</span>{" "}
                <span className="font-medium">{syncResult.pages}</span>
              </div>
            </div>
            {syncResult.errors.length > 0 && (
              <div className="mt-2 text-sm text-red-600">
                {syncResult.errors.map((e, i) => (
                  <div key={i}>- {e}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sync Info */}
      <div className="rounded-lg border bg-white p-6">
        <h2 className="text-lg font-semibold">Thong tin dong bo</h2>
        <div className="mt-4 space-y-3 text-sm text-gray-600">
          <div className="flex items-start gap-2">
            <ShoppingCart className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
            <div>
              <span className="font-medium">Don hang:</span> Khi khach dat hang
              tren web, don tu dong duoc day len Pancake POS. Trang thai don
              cung dong bo 2 chieu.
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Package className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
            <div>
              <span className="font-medium">Ton kho:</span> Nhan
              &quot;Dong bo ngay&quot; de cap nhat so luong ton kho tu Pancake POS.
              Chi dong bo nhung san pham da duoc mapping (co pancakeId).
            </div>
          </div>
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500" />
            <div>
              <span className="font-medium">Mapping:</span> De dong bo, san
              pham/bien the tren web can co truong <code>pancakeId</code> trung
              voi ID tren Pancake POS. Cap nhat trong trang chinh sua san pham.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
