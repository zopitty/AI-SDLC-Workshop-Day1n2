import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    turbo: {},
  },
  webpack: (config) => {
    // Handle better-sqlite3 native module
    config.externals = config.externals || [];
    config.externals.push({
      'better-sqlite3': 'commonjs better-sqlite3'
    });
    return config;
  },
};

export default nextConfig;
