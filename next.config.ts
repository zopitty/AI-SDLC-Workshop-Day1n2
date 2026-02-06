import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: {
    resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
  },
  serverExternalPackages: ['better-sqlite3'],
};

export default nextConfig;
