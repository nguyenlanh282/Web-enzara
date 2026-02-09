'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronDown, User, LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { NotificationDropdown } from './NotificationDropdown';

const breadcrumbMap: Record<string, string> = {
  '/admin/dashboard': 'Dashboard',
  '/admin/products': 'San pham',
  '/admin/categories': 'Danh muc',
  '/admin/brands': 'Thuong hieu',
  '/admin/orders': 'Don hang',
  '/admin/blog': 'Bai viet',
  '/admin/blog/categories': 'Danh muc blog',
  '/admin/pages': 'Trang tinh',
  '/admin/banners': 'Banner',
  '/admin/menus': 'Menu',
  '/admin/media': 'Media',
  '/admin/settings/general': 'Cai dat chung',
  '/admin/settings/payment': 'Thanh toan',
  '/admin/settings/seo': 'SEO',
  '/admin/settings/appearance': 'Giao dien',
  '/admin/profile': 'Ho so',
};

export default function AdminHeader() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const pageTitle = breadcrumbMap[pathname] || 'Quan tri';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setDropdownOpen(false);
  };

  return (
    <header className="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-6">
      {/* Left: Page title */}
      <div>
        <h1 className="text-lg font-heading font-semibold text-primary-700">{pageTitle}</h1>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        {/* Notification bell */}
        <NotificationDropdown />

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-primary-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.fullName}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <span className="text-primary-700 font-heading font-semibold text-sm">
                  {user?.fullName?.charAt(0)?.toUpperCase() || 'A'}
                </span>
              )}
            </div>
            <span className="text-sm font-body text-neutral-600 hidden sm:block">
              {user?.fullName || 'Admin'}
            </span>
            <ChevronDown className="w-4 h-4 text-neutral-600" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-card border border-neutral-200 py-1 z-50">
              <a
                href="/admin/profile"
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-body text-neutral-600 hover:bg-primary-50 transition-colors"
                onClick={() => setDropdownOpen(false)}
              >
                <User className="w-4 h-4" />
                Ho so
              </a>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-body text-neutral-600 hover:bg-primary-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Dang xuat
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
