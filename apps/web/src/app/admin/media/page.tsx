"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Upload,
  Trash2,
  Loader2,
  AlertCircle,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  File,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient, ApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

interface MediaItem {
  _id: string;
  filename: string;
  url: string;
  size: number;
  mimeType: string;
  folder?: string;
  createdAt: string;
}

interface MediaResponse {
  data: MediaItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const FOLDERS = [
  { value: "", label: "Tat ca" },
  { value: "general", label: "Chung" },
  { value: "products", label: "San pham" },
  { value: "blog", label: "Blog" },
  { value: "banners", label: "Banner" },
] as const;

const ITEMS_PER_PAGE = 20;

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function isImageMime(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

export default function AdminMediaPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFolder, setActiveFolder] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Upload
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = useCallback(
    async (currentPage: number, folder: string) => {
      try {
        setLoading(true);
        setError("");
        const params = new URLSearchParams({
          page: String(currentPage),
          limit: String(ITEMS_PER_PAGE),
        });
        if (folder) {
          params.set("folder", folder);
        }
        const data = await apiClient.get<MediaResponse>(
          `/media?${params.toString()}`
        );
        setMedia(data.data);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Khong the tai thu vien media");
        }
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchMedia(page, activeFolder);
  }, [page, activeFolder, fetchMedia]);

  const handleFolderChange = (folder: string) => {
    setActiveFolder(folder);
    setPage(1);
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      setUploadError("");

      const BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
      const token = useAuthStore.getState().accessToken;

      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append("file", files[i]);
        if (activeFolder) {
          formData.append("folder", activeFolder);
        }

        const response = await fetch(`${BASE_URL}/media/upload`, {
          method: "POST",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
          body: formData,
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({
            message: `Khong the tai len ${files[i].name}`,
          }));
          throw new Error(err.message);
        }
      }

      // Refresh list
      await fetchMedia(page, activeFolder);
    } catch (err) {
      if (err instanceof Error) {
        setUploadError(err.message);
      } else {
        setUploadError("Khong the tai len file. Vui long thu lai.");
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async (item: MediaItem) => {
    if (!window.confirm(`Ban co chac muon xoa "${item.filename}"?`)) return;

    try {
      setDeleting(item._id);
      await apiClient.delete(`/media/${item._id}`);
      setMedia((prev) => prev.filter((m) => m._id !== item._id));
      setTotal((prev) => prev - 1);
    } catch (err) {
      if (err instanceof ApiError) {
        alert(err.message);
      } else {
        alert("Khong the xoa file");
      }
    } finally {
      setDeleting(null);
    }
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleUpload(e.dataTransfer.files);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-neutral-900">
          Thu vien media
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Quan ly hinh anh va file cua website ({total} file)
        </p>
      </div>

      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-8 text-center transition-colors",
          dragActive
            ? "border-primary-700 bg-primary-50"
            : "border-neutral-300 bg-white hover:border-neutral-400"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,.pdf,.doc,.docx"
          onChange={(e) => handleUpload(e.target.files)}
          className="hidden"
          id="file-upload"
        />

        <div className="flex flex-col items-center gap-3">
          {uploading ? (
            <>
              <Loader2 className="w-10 h-10 text-primary-700 animate-spin" />
              <p className="text-sm text-neutral-600">Dang tai len...</p>
            </>
          ) : (
            <>
              <Upload className="w-10 h-10 text-neutral-400" />
              <div>
                <p className="text-sm text-neutral-600">
                  Keo tha file vao day hoac{" "}
                  <label
                    htmlFor="file-upload"
                    className="text-primary-700 font-medium cursor-pointer hover:underline"
                  >
                    chon file
                  </label>
                </p>
                <p className="text-xs text-neutral-400 mt-1">
                  Ho tro hinh anh, video, PDF, DOC
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Upload Error */}
      {uploadError && (
        <div className="flex items-center justify-between rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {uploadError}
          </div>
          <button
            onClick={() => setUploadError("")}
            className="text-red-400 hover:text-red-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Folder Tabs */}
      <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-1 w-fit">
        {FOLDERS.map((folder) => (
          <button
            key={folder.value}
            onClick={() => handleFolderChange(folder.value)}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-medium transition-colors",
              activeFolder === folder.value
                ? "bg-white text-primary-700 shadow-sm"
                : "text-neutral-600 hover:text-neutral-900"
            )}
          >
            {folder.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary-700" />
          <span className="ml-2 text-sm text-neutral-500">Dang tai...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && media.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-neutral-200">
          <ImageIcon className="w-12 h-12 text-neutral-300 mb-3" />
          <p className="text-sm text-neutral-500">
            {activeFolder
              ? "Khong co file nao trong thu muc nay"
              : "Chua co file nao duoc tai len"}
          </p>
        </div>
      )}

      {/* Media Grid */}
      {!loading && media.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {media.map((item) => (
            <div
              key={item._id}
              className="bg-white rounded-xl border border-neutral-200 overflow-hidden group relative"
            >
              {/* Thumbnail */}
              <div className="aspect-square bg-neutral-100 relative">
                {isImageMime(item.mimeType) ? (
                  <img
                    src={item.url}
                    alt={item.filename}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <File className="w-12 h-12 text-neutral-300" />
                  </div>
                )}

                {/* Delete overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <button
                    onClick={() => handleDelete(item)}
                    disabled={deleting === item._id}
                    className="opacity-0 group-hover:opacity-100 transition-opacity rounded-lg bg-white/90 p-2 text-red-600 hover:bg-white shadow-sm disabled:opacity-50"
                    title="Xoa"
                  >
                    {deleting === item._id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <p
                  className="text-xs font-medium text-neutral-800 truncate"
                  title={item.filename}
                >
                  {item.filename}
                </p>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {formatFileSize(item.size)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="inline-flex items-center justify-center rounded-lg border border-neutral-300 p-2 text-sm text-neutral-600 hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => {
                if (totalPages <= 7) return true;
                if (p === 1 || p === totalPages) return true;
                if (Math.abs(p - page) <= 1) return true;
                return false;
              })
              .map((p, idx, arr) => {
                const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
                return (
                  <span key={p} className="flex items-center gap-1">
                    {showEllipsis && (
                      <span className="px-1 text-neutral-400">...</span>
                    )}
                    <button
                      onClick={() => setPage(p)}
                      className={cn(
                        "inline-flex items-center justify-center rounded-lg min-w-[36px] h-9 px-3 text-sm font-medium transition-colors",
                        page === p
                          ? "bg-primary-700 text-white"
                          : "text-neutral-600 hover:bg-neutral-100"
                      )}
                    >
                      {p}
                    </button>
                  </span>
                );
              })}
          </div>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="inline-flex items-center justify-center rounded-lg border border-neutral-300 p-2 text-sm text-neutral-600 hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
