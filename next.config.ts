import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: process.env.NODE_ENV === 'production' ? '/procurement-kpi' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/procurement-kpi/' : '',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
