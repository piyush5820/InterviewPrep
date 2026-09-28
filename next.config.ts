import type { NextConfig } from "next";
const path = require('path');

const nextConfig: NextConfig = {
  webpack: (config: { resolve: { alias: { [x: string]: any; }; }; }, { isServer }: any) => {
    if (isServer) {
      config.resolve.alias['pdf-parse'] = path.resolve(
        process.cwd(),
        'node_modules/pdf-parse/lib/pdf-parse.js'
      );
    }
    return config;
  },
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === 'production',
  },
};

export default nextConfig;
