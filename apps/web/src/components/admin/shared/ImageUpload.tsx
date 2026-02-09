'use client';

import { useCallback, useRef, useState, type DragEvent, type ChangeEvent } from 'react';
import { Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ImageUploadProps {
  /** Current image URL (already uploaded or preview) */
  value?: string | null;
  /** Called when a new file is selected */
  onChange?: (file: File | null) => void;
  /** Called when the current image is removed */
  onRemove?: () => void;
  /** Accepted MIME types (default "image/*") */
  accept?: string;
  /** Max file size in bytes (default 5 MB) */
  maxSize?: number;
  /** Additional wrapper class */
  className?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5 MB

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ImageUpload({
  value,
  onChange,
  onRemove,
  accept = 'image/*',
  maxSize = DEFAULT_MAX_SIZE,
  className,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Determine the displayed image: explicit value takes precedence, then local preview
  const displayUrl = value || previewUrl;

  // -- Validation & selection ----------------------------------------------

  const handleFile = useCallback(
    (file: File | null) => {
      setError(null);

      if (!file) {
        setPreviewUrl(null);
        onChange?.(null);
        return;
      }

      if (file.size > maxSize) {
        setError(
          `Kich thuoc file qua lon (${formatBytes(file.size)}). Toi da ${formatBytes(maxSize)}.`
        );
        return;
      }

      // Generate a local object URL for preview
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      onChange?.(file);
    },
    [maxSize, onChange]
  );

  // -- Events --------------------------------------------------------------

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    handleFile(file);
    // Reset so selecting the same file again triggers onChange
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0] ?? null;
    handleFile(file);
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    setError(null);
    onRemove?.();
    onChange?.(null);
  };

  // -- Render --------------------------------------------------------------

  // If we have an image to show, render the preview
  if (displayUrl) {
    return (
      <div className={cn('relative inline-block', className)}>
        <div className="relative overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={displayUrl}
            alt="Preview"
            className="h-48 w-48 object-cover"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 inline-flex items-center justify-center rounded-full bg-white/80 p-1 text-neutral-600 shadow backdrop-blur hover:bg-red-50 hover:text-red-600 transition-colors"
            title="Xoa anh"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Dropzone
  return (
    <div className={cn('w-full', className)}>
      <div
        role="button"
        tabIndex={0}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors cursor-pointer',
          dragActive
            ? 'border-primary-700 bg-primary-50'
            : 'border-neutral-300 bg-neutral-50 hover:border-primary-500 hover:bg-primary-50/50'
        )}
      >
        <Upload
          className={cn(
            'w-8 h-8',
            dragActive ? 'text-primary-700' : 'text-neutral-400'
          )}
        />
        <p className="text-sm font-body text-neutral-600">
          <span className="font-medium text-primary-700">Chon file</span>{' '}
          hoac keo tha vao day
        </p>
        <p className="text-xs font-body text-neutral-400">
          Toi da {formatBytes(maxSize)}
        </p>
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="sr-only"
      />

      {/* Error */}
      {error && (
        <p className="mt-2 text-xs font-body text-red-600">{error}</p>
      )}
    </div>
  );
}
