'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/utils';

interface NotificationMetadata {
  orderId?: string;
  orderNumber?: string;
  [key: string]: unknown;
}

interface Notification {
  id: string;
  channel: string;
  recipient: string;
  subject: string | null;
  content: string;
  status: string;
  metadata: NotificationMetadata | null;
  createdAt: string;
}

interface NotificationsResponse {
  data: Notification[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "Vua xong";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} phut truoc`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} gio truoc`;
  return `${Math.floor(seconds / 86400)} ngay truoc`;
}

function getNotificationLink(notification: Notification): string | null {
  const metadata = notification.metadata;
  if (metadata?.orderId) {
    return `/admin/orders/${metadata.orderId}`;
  }
  return null;
}

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await apiClient.get<{ count: number }>('/admin/notifications/unread-count');
      setUnreadCount(res.count);
    } catch {
      // Silently ignore polling errors
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<NotificationsResponse>('/admin/notifications?limit=10');
      setNotifications(res.data);
    } catch {
      // Silently ignore
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll for unread count every 30 seconds
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await apiClient.put(`/admin/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: 'READ' } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Silently ignore
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiClient.put('/admin/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, status: 'READ' })));
      setUnreadCount(0);
    } catch {
      // Silently ignore
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.status === 'UNREAD') {
      handleMarkAsRead(notification.id);
    }
    const link = getNotificationLink(notification);
    if (link) {
      window.location.href = link;
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-neutral-600 hover:bg-primary-50 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-card border border-neutral-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
            <h3 className="font-heading font-semibold text-sm text-neutral-800">
              Thong bao
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs font-body text-primary-700 hover:text-primary-800 transition-colors"
              >
                Danh dau tat ca da doc
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm font-body text-neutral-400">
                Dang tai...
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm font-body text-neutral-400">
                Khong co thong bao nao
              </div>
            ) : (
              notifications.map((notification) => {
                const link = getNotificationLink(notification);
                const isUnread = notification.status === 'UNREAD';

                return (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      'w-full text-left px-4 py-3 border-b border-neutral-50 hover:bg-primary-50/50 transition-colors',
                      isUnread && 'bg-primary-50/30'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Unread indicator */}
                      <div className="mt-1.5 flex-shrink-0">
                        <div
                          className={cn(
                            'w-2 h-2 rounded-full',
                            isUnread ? 'bg-primary-700' : 'bg-transparent'
                          )}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Subject */}
                        <p
                          className={cn(
                            'text-sm font-body truncate',
                            isUnread
                              ? 'font-semibold text-neutral-800'
                              : 'text-neutral-600'
                          )}
                        >
                          {notification.subject || 'Thong bao'}
                        </p>

                        {/* Content preview */}
                        <p className="text-xs font-body text-neutral-500 mt-0.5 line-clamp-2">
                          {notification.content}
                        </p>

                        {/* Time ago */}
                        <p className="text-[11px] font-body text-neutral-400 mt-1">
                          {timeAgo(notification.createdAt)}
                        </p>
                      </div>

                      {/* Link indicator */}
                      {link && (
                        <div className="mt-1 flex-shrink-0 text-neutral-300">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
