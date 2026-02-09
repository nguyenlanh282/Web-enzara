'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Star,
  Users,
  FileText,
  Layers,
  Settings,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Megaphone,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavSubItem {
  label: string;
  href: string;
}

interface NavItem {
  label: string;
  icon: React.ElementType;
  href?: string;
  children?: NavSubItem[];
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/admin/dashboard',
  },
  {
    label: 'San pham',
    icon: Package,
    children: [
      { label: 'Tat ca san pham', href: '/admin/products' },
      { label: 'Danh muc', href: '/admin/categories' },
      { label: 'Thuong hieu', href: '/admin/brands' },
    ],
  },
  {
    label: 'Don hang',
    icon: ShoppingCart,
    href: '/admin/orders',
  },
  {
    label: 'Danh gia',
    icon: Star,
    href: '/admin/reviews',
  },
  {
    label: 'Khach hang',
    icon: Users,
    href: '/admin/customers',
  },
  {
    label: 'Marketing',
    icon: Megaphone,
    children: [
      { label: 'Voucher', href: '/admin/vouchers' },
      { label: 'Flash Sale', href: '/admin/flash-sales' },
      { label: 'Tich diem', href: '/admin/loyalty' },
    ],
  },
  {
    label: 'Blog',
    icon: FileText,
    children: [
      { label: 'Bai viet', href: '/admin/blog' },
      { label: 'Danh muc blog', href: '/admin/blog/categories' },
    ],
  },
  {
    label: 'Noi dung',
    icon: Layers,
    children: [
      { label: 'Trang tinh', href: '/admin/pages' },
      { label: 'Banner', href: '/admin/banners' },
      { label: 'Menu', href: '/admin/menus' },
      { label: 'Media', href: '/admin/media' },
    ],
  },
  {
    label: 'Cai dat',
    icon: Settings,
    children: [
      { label: 'Chung', href: '/admin/settings/general' },
      { label: 'Thanh toan', href: '/admin/settings/payment' },
      { label: 'SEO', href: '/admin/settings/seo' },
      { label: 'Giao dien', href: '/admin/settings/appearance' },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isActive = (href: string) => pathname === href;
  const isParentActive = (item: NavItem) =>
    item.children?.some((child) => pathname.startsWith(child.href)) ?? false;

  return (
    <aside
      className={cn(
        'flex flex-col bg-white border-r border-neutral-200 h-full transition-all duration-300',
        collapsed ? 'w-16' : 'w-[250px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-neutral-200">
        <Link href="/admin/dashboard" className="flex items-center gap-2 overflow-hidden">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary-700 flex items-center justify-center">
            <span className="text-white font-heading font-bold text-sm">E</span>
          </div>
          {!collapsed && (
            <span className="font-heading font-bold text-lg text-primary-700 whitespace-nowrap">
              Enzara
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const hasChildren = !!item.children;
          const parentActive = isParentActive(item);
          const itemActive = item.href ? isActive(item.href) : parentActive;
          const isOpen = openMenus[item.label] ?? parentActive;

          if (hasChildren) {
            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleMenu(item.label)}
                  className={cn(
                    'flex items-center w-full rounded-lg px-3 py-2.5 text-sm font-body transition-colors',
                    parentActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-neutral-600 hover:bg-primary-50',
                    collapsed && 'justify-center'
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="ml-3 flex-1 text-left">{item.label}</span>
                      <ChevronDown
                        className={cn(
                          'w-4 h-4 transition-transform duration-200',
                          isOpen && 'rotate-180'
                        )}
                      />
                    </>
                  )}
                </button>

                {!collapsed && isOpen && (
                  <div className="ml-5 mt-1 space-y-1 border-l-2 border-neutral-200 pl-3">
                    {item.children!.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          'block rounded-lg px-3 py-2 text-sm font-body transition-colors',
                          isActive(child.href)
                            ? 'bg-primary-100 text-primary-700 font-medium'
                            : 'text-neutral-600 hover:bg-primary-50'
                        )}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href!}
              className={cn(
                'flex items-center rounded-lg px-3 py-2.5 text-sm font-body transition-colors',
                itemActive
                  ? 'bg-primary-100 text-primary-700 font-medium'
                  : 'text-neutral-600 hover:bg-primary-50',
                collapsed && 'justify-center'
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="ml-3">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-neutral-200 p-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full rounded-lg px-3 py-2.5 text-neutral-600 hover:bg-primary-50 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="ml-3 text-sm font-body">Thu gon</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
