"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Trash2,
  Save,
  Loader2,
  AlertCircle,
  ChevronRight,
  GripVertical,
  ExternalLink,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient, ApiError } from "@/lib/api";

interface MenuItem {
  label: string;
  url: string;
  openInNewTab?: boolean;
  children?: MenuItem[];
}

interface MenuData {
  _id?: string;
  position: string;
  items: MenuItem[];
}

const POSITIONS = [
  { value: "header", label: "Header" },
  { value: "footer", label: "Footer" },
  { value: "mobile", label: "Mobile" },
] as const;

type Position = (typeof POSITIONS)[number]["value"];

export default function AdminMenusPage() {
  const [activePosition, setActivePosition] = useState<Position>("header");
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Add item form state
  const [newLabel, setNewLabel] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newOpenInNewTab, setNewOpenInNewTab] = useState(false);

  const fetchMenu = useCallback(async (position: Position) => {
    try {
      setLoading(true);
      setError("");
      setSuccessMsg("");
      const data = await apiClient.get<MenuData>(`/menus/${position}`);
      setItems(data.items || []);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        // Menu doesn't exist yet, start fresh
        setItems([]);
      } else if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Khong the tai menu");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenu(activePosition);
  }, [activePosition, fetchMenu]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccessMsg("");
      await apiClient.put(`/menus/${activePosition}`, { items });
      setSuccessMsg("Da luu menu thanh cong!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Khong the luu menu. Vui long thu lai.");
      }
    } finally {
      setSaving(false);
    }
  };

  const addItem = () => {
    if (!newLabel.trim() || !newUrl.trim()) return;

    const newItem: MenuItem = {
      label: newLabel.trim(),
      url: newUrl.trim(),
      openInNewTab: newOpenInNewTab,
    };

    setItems((prev) => [...prev, newItem]);
    setNewLabel("");
    setNewUrl("");
    setNewOpenInNewTab(false);
  };

  const addSubItem = (parentIndex: number) => {
    const label = prompt("Nhap ten muc con:");
    if (!label) return;
    const url = prompt("Nhap URL:");
    if (!url) return;

    setItems((prev) => {
      const updated = [...prev];
      const parent = { ...updated[parentIndex] };
      parent.children = [...(parent.children || []), { label, url }];
      updated[parentIndex] = parent;
      return updated;
    });
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const removeSubItem = (parentIndex: number, childIndex: number) => {
    setItems((prev) => {
      const updated = [...prev];
      const parent = { ...updated[parentIndex] };
      parent.children = (parent.children || []).filter(
        (_, i) => i !== childIndex
      );
      updated[parentIndex] = parent;
      return updated;
    });
  };

  const moveItem = (index: number, direction: "up" | "down") => {
    setItems((prev) => {
      const updated = [...prev];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= updated.length) return prev;
      [updated[index], updated[targetIndex]] = [
        updated[targetIndex],
        updated[index],
      ];
      return updated;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-neutral-900">
            Quan ly menu
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Cau hinh cac menu dieu huong tren website
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? "Dang luu..." : "Luu menu"}
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-700">
          {successMsg}
        </div>
      )}

      {/* Position Tabs */}
      <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-1 w-fit">
        {POSITIONS.map((pos) => (
          <button
            key={pos.value}
            onClick={() => setActivePosition(pos.value)}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-medium transition-colors",
              activePosition === pos.value
                ? "bg-white text-primary-700 shadow-sm"
                : "text-neutral-600 hover:text-neutral-900"
            )}
          >
            {pos.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Item Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-4 sticky top-4">
            <h3 className="text-sm font-medium text-neutral-900">
              Them muc menu
            </h3>

            <div>
              <label className="block text-sm text-neutral-600 mb-1">
                Ten hien thi
              </label>
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="VD: Trang chu"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-primary-700 focus:ring-1 focus:ring-primary-700"
              />
            </div>

            <div>
              <label className="block text-sm text-neutral-600 mb-1">URL</label>
              <input
                type="text"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="VD: /san-pham"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-primary-700 focus:ring-1 focus:ring-primary-700"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newOpenInNewTab}
                onChange={(e) => setNewOpenInNewTab(e.target.checked)}
                className="rounded border-neutral-300 text-primary-700 focus:ring-primary-700"
              />
              <span className="text-sm text-neutral-600">
                Mo trong tab moi
              </span>
            </label>

            <button
              onClick={addItem}
              disabled={!newLabel.trim() || !newUrl.trim()}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Them vao menu
            </button>
          </div>
        </div>

        {/* Menu Items List */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary-700" />
              <span className="ml-2 text-sm text-neutral-500">
                Dang tai...
              </span>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-neutral-200">
              <Menu className="w-12 h-12 text-neutral-300 mb-3" />
              <p className="text-sm text-neutral-500">
                Menu nay chua co muc nao
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                Su dung form ben trai de them muc menu
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-neutral-200 divide-y divide-neutral-100">
              {items.map((item, index) => (
                <div key={`${item.label}-${index}`}>
                  {/* Parent item */}
                  <div className="flex items-center gap-3 px-4 py-3 group">
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => moveItem(index, "up")}
                        disabled={index === 0}
                        className="text-neutral-400 hover:text-neutral-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Di chuyen len"
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 15l7-7 7 7"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => moveItem(index, "down")}
                        disabled={index === items.length - 1}
                        className="text-neutral-400 hover:text-neutral-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Di chuyen xuong"
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                    </div>

                    <GripVertical className="w-4 h-4 text-neutral-300 flex-shrink-0" />

                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-neutral-900">
                        {item.label}
                      </span>
                      <span className="ml-2 text-xs text-neutral-400">
                        {item.url}
                      </span>
                      {item.openInNewTab && (
                        <ExternalLink className="w-3 h-3 text-neutral-400 inline ml-1" />
                      )}
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => addSubItem(index)}
                        className="rounded-lg px-2 py-1 text-xs text-neutral-500 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                        title="Them muc con"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => removeItem(index)}
                        className="rounded-lg px-2 py-1 text-xs text-neutral-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Xoa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Children */}
                  {item.children && item.children.length > 0 && (
                    <div className="ml-10 border-l-2 border-neutral-100">
                      {item.children.map((child, childIndex) => (
                        <div
                          key={`${child.label}-${childIndex}`}
                          className="flex items-center gap-3 px-4 py-2.5 group/child"
                        >
                          <ChevronRight className="w-3 h-3 text-neutral-300 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm text-neutral-700">
                              {child.label}
                            </span>
                            <span className="ml-2 text-xs text-neutral-400">
                              {child.url}
                            </span>
                            {child.openInNewTab && (
                              <ExternalLink className="w-3 h-3 text-neutral-400 inline ml-1" />
                            )}
                          </div>
                          <button
                            onClick={() => removeSubItem(index, childIndex)}
                            className="rounded-lg px-2 py-1 text-xs text-neutral-500 hover:bg-red-50 hover:text-red-600 transition-colors opacity-0 group-hover/child:opacity-100"
                            title="Xoa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
