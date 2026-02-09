"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient, ApiError } from "@/lib/api";

interface SettingRecord {
  id: string;
  group: string;
  key: string;
  value: string;
  updatedAt: string;
}

interface UseSettingsReturn {
  settings: Record<string, string>;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  successMessage: string | null;
  loadSettings: () => Promise<void>;
  saveSettings: (data: Record<string, unknown>) => Promise<void>;
  clearMessages: () => void;
}

export function useSettings(group: string): UseSettingsReturn {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccessMessage(null);
  }, []);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<SettingRecord[]>(
        `/settings/${group}`
      );
      const record: Record<string, string> = {};
      if (Array.isArray(data)) {
        data.forEach((item) => {
          record[item.key] = item.value;
        });
      }
      setSettings(record);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Khong the tai cai dat. Vui long thu lai.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [group]);

  const saveSettings = useCallback(
    async (data: Record<string, unknown>) => {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);
      try {
        await apiClient.put(`/settings/${group}`, { settings: data });
        setSuccessMessage("Luu cai dat thanh cong!");
        // Refresh settings after save
        await loadSettings();
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Khong the luu cai dat. Vui long thu lai.");
        }
      } finally {
        setIsSaving(false);
      }
    },
    [group, loadSettings]
  );

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Auto-clear success message after 4 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  return {
    settings,
    isLoading,
    isSaving,
    error,
    successMessage,
    loadSettings,
    saveSettings,
    clearMessages,
  };
}
