const createNextIntlPlugin = require("next-intl/plugin");
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["@enzara/ui", "@enzara/utils", "@enzara/types"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.r2.cloudflarestorage.com",
      },
    ],
  },
  async redirects() {
    return [
      { source: "/lien-he", destination: "/vi/contact", permanent: true },
      { source: "/theo-doi-don-hang", destination: "/vi/order-tracking", permanent: true },
    ];
  },
};

module.exports = withNextIntl(nextConfig);
