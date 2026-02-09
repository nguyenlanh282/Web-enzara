'use client';

import { useState, useCallback, useMemo } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useQuery } from '@tanstack/react-query';
import { Search, X, Upload, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import ImageUpload from './ImageUpload';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MediaItem {
  _id: string;
  url: string;
  filename: string;
  folder?: string;
  mimetype?: string;
  size?: number;
  createdAt?: string;
}

interface MediaListResponse {
  data: MediaItem[];
  total?: number;
}

export interface MediaPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (url: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MediaPicker({ open, onOpenChange, onSelect }: MediaPickerProps) {
  const [search, setSearch] = useState('');
  const [folder, setFolder] = useState<string>('');
  const [selected, setSelected] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // -- Fetch media list ----------------------------------------------------

  const { data: mediaResponse, isLoading, refetch } = useQuery<MediaListResponse>({
    queryKey: ['admin', 'media', folder],
    queryFn: () => {
      const params = new URLSearchParams();
      if (folder) params.set('folder', folder);
      const qs = params.toString();
      return apiClient.get<MediaListResponse>(`/media${qs ? `?${qs}` : ''}`);
    },
    enabled: open,
  });

  const mediaItems = mediaResponse?.data ?? [];

  // -- Derive unique folders for the filter --------------------------------

  const folders = useMemo(() => {
    const set = new Set<string>();
    mediaItems.forEach((item) => {
      if (item.folder) set.add(item.folder);
    });
    return Array.from(set).sort();
  }, [mediaItems]);

  // -- Filter by search text -----------------------------------------------

  const filteredItems = useMemo(() => {
    if (!search.trim()) return mediaItems;
    const q = search.toLowerCase();
    return mediaItems.filter(
      (item) =>
        item.filename.toLowerCase().includes(q) ||
        item.url.toLowerCase().includes(q)
    );
  }, [mediaItems, search]);

  // -- Handlers ------------------------------------------------------------

  const handleSelect = useCallback(
    (url: string) => {
      setSelected(url);
    },
    []
  );

  const handleConfirm = useCallback(() => {
    if (selected) {
      onSelect(selected);
      onOpenChange(false);
      setSelected(null);
      setSearch('');
    }
  }, [selected, onSelect, onOpenChange]);

  const handleUpload = useCallback(async () => {
    if (!uploadingFile) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadingFile);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/media/upload`,
        {
          method: 'POST',
          body: formData,
          credentials: 'include',
        }
      );

      if (!response.ok) throw new Error('Upload that bai');

      const result = await response.json();

      // Auto-select the newly uploaded file
      if (result.url) {
        setSelected(result.url);
      }

      setShowUpload(false);
      setUploadingFile(null);
      refetch();
    } catch {
      // Error is silently handled; user can retry
    } finally {
      setIsUploading(false);
    }
  }, [uploadingFile, refetch]);

  // -- Render --------------------------------------------------------------

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
            <Dialog.Title className="text-lg font-heading font-semibold text-neutral-800">
              Thu vien media
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="inline-flex items-center justify-center rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
                aria-label="Dong"
              >
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Toolbar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center border-b border-neutral-100 px-6 py-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tim kiem..."
                className="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-9 pr-3 text-sm font-body text-neutral-700 placeholder:text-neutral-400 focus:border-primary-700 focus:outline-none focus:ring-1 focus:ring-primary-700"
              />
            </div>

            {/* Folder filter */}
            {folders.length > 0 && (
              <select
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-body text-neutral-700 focus:border-primary-700 focus:outline-none focus:ring-1 focus:ring-primary-700"
              >
                <option value="">Tat ca thu muc</option>
                {folders.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            )}

            {/* Upload toggle */}
            <button
              type="button"
              onClick={() => setShowUpload((v) => !v)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-700 px-4 py-2 text-sm font-body font-medium text-white hover:bg-primary-800 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Tai len
            </button>
          </div>

          {/* Inline upload area */}
          {showUpload && (
            <div className="border-b border-neutral-100 px-6 py-4">
              <ImageUpload
                onChange={(file) => setUploadingFile(file)}
                className="max-w-sm mx-auto"
              />
              {uploadingFile && (
                <div className="mt-3 flex justify-center">
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={handleUpload}
                    className="inline-flex items-center gap-2 rounded-lg bg-secondary-500 px-5 py-2 text-sm font-body font-medium text-white hover:bg-secondary-600 transition-colors disabled:opacity-50"
                  >
                    {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isUploading ? 'Dang tai...' : 'Xac nhan tai len'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Media grid */}
          <div className="max-h-[50vh] overflow-y-auto px-6 py-4">
            {isLoading ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-xl bg-neutral-200 animate-pulse"
                  />
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
              <p className="py-12 text-center text-sm text-neutral-400 font-body">
                Khong tim thay media nao
              </p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {filteredItems.map((item) => {
                  const isSelected = selected === item.url;

                  return (
                    <button
                      key={item._id}
                      type="button"
                      onClick={() => handleSelect(item.url)}
                      className={cn(
                        'group relative aspect-square overflow-hidden rounded-xl border-2 transition-all focus:outline-none',
                        isSelected
                          ? 'border-primary-700 ring-2 ring-primary-700/30'
                          : 'border-transparent hover:border-neutral-300'
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.url}
                        alt={item.filename}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />

                      {/* Hover overlay */}
                      <div
                        className={cn(
                          'absolute inset-0 flex items-end bg-gradient-to-t from-black/50 to-transparent opacity-0 transition-opacity',
                          'group-hover:opacity-100',
                          isSelected && 'opacity-100'
                        )}
                      >
                        <span className="w-full truncate px-2 pb-2 text-xs text-white font-body">
                          {item.filename}
                        </span>
                      </div>

                      {/* Selected indicator */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 flex items-center justify-center rounded-full bg-primary-700 p-1">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-neutral-200 px-6 py-4">
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-body font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
              >
                Huy
              </button>
            </Dialog.Close>
            <button
              type="button"
              disabled={!selected}
              onClick={handleConfirm}
              className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-body font-medium text-white hover:bg-primary-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Chon
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
