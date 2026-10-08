import type { NextConfig } from 'next';

const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/$/, '');

const nextConfig: NextConfig = {
  output: 'export',
  basePath: basePath || undefined,
  trailingSlash: true,
  sassOptions: {
    additionalData: `$base-path: "${basePath}";\n`,
  },
  images: { unoptimized: true },
};

export default nextConfig;
