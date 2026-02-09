"use client";

import { BookOpen, ChevronDown, Mail, Package, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  menus?: Array<{ id: string; label: string; href: string }>;
  categories?: Array<{
    id: string;
    name: string;
    slug: string;
    children?: Array<{ id: string; name: string; slug: string }>;
  }>;
}

export function MobileMenu({
  open,
  onClose,
  menus = [],
  categories = [],
}: MobileMenuProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 w-[300px] bg-white z-50 shadow-xl overflow-y-auto"
          >
            <div className="p-4 border-b flex items-center justify-between">
              <Link
                href="/"
                className="text-primary-700 font-heading font-bold text-xl"
                onClick={onClose}
              >
                Enzara
              </Link>
              <button
                onClick={onClose}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                aria-label="Đóng menu"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-4">
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">
                  Danh mục sản phẩm
                </h3>
                {categories.map((category) => (
                  <div key={category.id} className="mb-2">
                    <button
                      onClick={() =>
                        category.children && category.children.length > 0
                          ? toggleCategory(category.id)
                          : null
                      }
                      className="w-full flex items-center justify-between py-2 text-neutral-700 hover:text-primary-700 transition-colors"
                    >
                      <Link
                        href={`/categories/${category.slug}`}
                        className="flex-1 text-left"
                        onClick={onClose}
                      >
                        {category.name}
                      </Link>
                      {category.children && category.children.length > 0 && (
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform",
                            expandedCategory === category.id && "rotate-180"
                          )}
                        />
                      )}
                    </button>

                    {category.children &&
                      category.children.length > 0 &&
                      expandedCategory === category.id && (
                        <div className="ml-4 mt-1 space-y-1">
                          {category.children.map((child) => (
                            <Link
                              key={child.id}
                              href={`/categories/${child.slug}`}
                              className="block py-2 text-sm text-neutral-600 hover:text-primary-700 transition-colors"
                              onClick={onClose}
                            >
                              {child.name}
                            </Link>
                          ))}
                        </div>
                      )}
                  </div>
                ))}
              </div>

              {menus.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">
                    Menu
                  </h3>
                  {menus.map((menu) => (
                    <Link
                      key={menu.id}
                      href={menu.href}
                      className="block py-2 text-neutral-700 hover:text-primary-700 transition-colors"
                      onClick={onClose}
                    >
                      {menu.label}
                    </Link>
                  ))}
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">
                  Tien ich
                </h3>
                <Link
                  href="/blog"
                  className="flex items-center gap-3 py-2 text-neutral-700 hover:text-primary-700 transition-colors"
                  onClick={onClose}
                >
                  <BookOpen className="h-5 w-5" />
                  Blog
                </Link>
                <Link
                  href="/lien-he"
                  className="flex items-center gap-3 py-2 text-neutral-700 hover:text-primary-700 transition-colors"
                  onClick={onClose}
                >
                  <Mail className="h-5 w-5" />
                  Lien he
                </Link>
                <Link
                  href="/theo-doi-don-hang"
                  className="flex items-center gap-3 py-2 text-neutral-700 hover:text-primary-700 transition-colors"
                  onClick={onClose}
                >
                  <Package className="h-5 w-5" />
                  Theo doi don hang
                </Link>
              </div>

              <div className="pt-4 border-t space-y-2">
                <Link
                  href="/auth/login"
                  className="block w-full py-2 px-4 text-center border border-primary-700 text-primary-700 rounded-lg hover:bg-primary-50 transition-colors"
                  onClick={onClose}
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/auth/register"
                  className="block w-full py-2 px-4 text-center bg-primary-700 text-white rounded-lg hover:bg-primary-800 transition-colors"
                  onClick={onClose}
                >
                  Đăng ký
                </Link>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
