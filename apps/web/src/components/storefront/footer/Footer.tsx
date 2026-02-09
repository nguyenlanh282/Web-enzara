"use client";

import { Facebook, Instagram, Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { PaymentIcons } from "./PaymentIcons";

interface FooterProps {
  settings?: Record<string, string>;
  config?: Record<string, string>;
}

export function Footer({ settings = {}, config = {} }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-neutral-900 text-neutral-300">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-primary-500 font-heading font-bold text-xl mb-4">
              Enzara
            </h3>
            <p className="text-sm leading-relaxed mb-4">
              {settings.storeDescription ||
                "Cửa hàng tinh dầu và sản phẩm thiên nhiên chất lượng cao, mang đến sức khỏe và hạnh phúc cho gia đình bạn."}
            </p>
            <div className="flex items-center gap-3">
              {settings.facebookUrl && (
                <a
                  href={settings.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-neutral-800 hover:bg-primary-700 rounded-lg transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {settings.instagramUrl && (
                <a
                  href={settings.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-neutral-800 hover:bg-primary-700 rounded-lg transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Liên kết nhanh</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/about"
                  className="hover:text-primary-500 transition-colors"
                >
                  Về chúng tôi
                </Link>
              </li>
              <li>
                <Link
                  href="/products"
                  className="hover:text-primary-500 transition-colors"
                >
                  Sản phẩm
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="hover:text-primary-500 transition-colors"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/lien-he"
                  className="hover:text-primary-500 transition-colors"
                >
                  Liên hệ
                </Link>
              </li>
              <li>
                <Link
                  href="/theo-doi-don-hang"
                  className="hover:text-primary-500 transition-colors"
                >
                  Theo dõi đơn hàng
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Chính sách</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/pages/chinh-sach-bao-mat"
                  className="hover:text-primary-500 transition-colors"
                >
                  Chính sách bảo mật
                </Link>
              </li>
              <li>
                <Link
                  href="/pages/dieu-khoan-su-dung"
                  className="hover:text-primary-500 transition-colors"
                >
                  Điều khoản sử dụng
                </Link>
              </li>
              <li>
                <Link
                  href="/pages/chinh-sach-van-chuyen"
                  className="hover:text-primary-500 transition-colors"
                >
                  Chính sách vận chuyển
                </Link>
              </li>
              <li>
                <Link
                  href="/pages/chinh-sach-doi-tra"
                  className="hover:text-primary-500 transition-colors"
                >
                  Chính sách đổi trả
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Liên hệ</h4>
            <ul className="space-y-3 text-sm">
              {settings.storeAddress && (
                <li className="flex items-start gap-2">
                  <MapPin className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <span>{settings.storeAddress}</span>
                </li>
              )}
              {settings.storePhone && (
                <li className="flex items-center gap-2">
                  <Phone className="h-5 w-5 flex-shrink-0" />
                  <a
                    href={`tel:${settings.storePhone}`}
                    className="hover:text-primary-500 transition-colors"
                  >
                    {settings.storePhone}
                  </a>
                </li>
              )}
              {settings.storeEmail && (
                <li className="flex items-center gap-2">
                  <Mail className="h-5 w-5 flex-shrink-0" />
                  <a
                    href={`mailto:${settings.storeEmail}`}
                    className="hover:text-primary-500 transition-colors"
                  >
                    {settings.storeEmail}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-neutral-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-center md:text-left">
              <p>
                © {currentYear} Enzara. Tất cả quyền được bảo lưu.
              </p>
              <p className="text-neutral-500 mt-1">Powered by Enzara</p>
            </div>

            <PaymentIcons />
          </div>
        </div>
      </div>
    </footer>
  );
}
