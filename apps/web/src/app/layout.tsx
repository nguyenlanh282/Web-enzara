import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";

const heading = Plus_Jakarta_Sans({
  subsets: ["latin", "vietnamese"],
  weight: ["600", "700", "800"],
  variable: "--font-heading",
  display: "swap",
});

const body = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Enzara - San pham tay rua huu co tu enzyme dua",
    template: "%s | Enzara",
  },
  description:
    "Enzara - San pham tay rua huu co tu enzyme dua tu nhien. An toan cho suc khoe, than thien voi moi truong.",
  metadataBase: new URL("https://enzara.vn"),
  keywords: [
    "enzara",
    "tay rua huu co",
    "enzyme dua",
    "san pham sinh thai",
    "tay rua tu nhien",
    "eco cleaning",
  ],
  authors: [{ name: "Enzara" }],
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName: "Enzara",
    title: "Enzara - San pham tay rua huu co tu enzyme dua",
    description:
      "San pham tay rua huu co tu enzyme dua tu nhien. An toan cho suc khoe, than thien voi moi truong.",
    images: [
      { url: "/og-image.png", width: 1200, height: 630, alt: "Enzara" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Enzara - San pham tay rua huu co tu enzyme dua",
    description: "San pham tay rua huu co tu enzyme dua tu nhien.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`${heading.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
