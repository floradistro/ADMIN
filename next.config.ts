import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.floradistro.com',
        port: '',
        pathname: '/wp-content/uploads/**',
      },
    ],
  },
  compress: true,
  poweredByHeader: false
};

export default nextConfig;
