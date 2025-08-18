import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/mmv/:path*',
        destination: 'https://efa.mvv-muenchen.de/:path'
      }
    ];
  },
  /* config options here */
};

export default nextConfig;
