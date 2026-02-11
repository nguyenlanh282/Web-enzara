import type { Metadata, Viewport } from "next";
import { Montserrat, Be_Vietnam_Pro } from "next/font/google";
import { ServiceWorkerRegistration } from "@/components/storefront/ServiceWorkerRegistration";
import "./globals.css";

const heading = Montserrat({
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-heading",
  display: "swap",
});

const body = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#626c13",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Enzara - Sản phẩm tẩy rửa hữu cơ từ enzyme dứa",
    template: "%s | Enzara",
  },
  description:
    "Enzara - Sản phẩm tẩy rửa hữu cơ từ enzyme dứa tự nhiên. An toàn cho sức khỏe, thân thiện với môi trường.",
  metadataBase: new URL("https://enzara.vn"),
  keywords: [
    "enzara",
    "tẩy rửa hữu cơ",
    "enzyme dứa",
    "sản phẩm sinh thái",
    "tẩy rửa tự nhiên",
    "nước rửa chén hữu cơ",
  ],
  authors: [{ name: "Enzara" }],
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName: "Enzara",
    title: "Enzara - Sản phẩm tẩy rửa hữu cơ từ enzyme dứa",
    description:
      "Sản phẩm tẩy rửa hữu cơ từ enzyme dứa tự nhiên. An toàn cho sức khỏe, thân thiện với môi trường.",
    images: [
      { url: "/og-image.png", width: 1200, height: 630, alt: "Enzara" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Enzara - Sản phẩm tẩy rửa hữu cơ từ enzyme dứa",
    description: "Sản phẩm tẩy rửa hữu cơ từ enzyme dứa tự nhiên.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Enzara",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`${heading.variable} ${body.variable}`}>
      <body>
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
