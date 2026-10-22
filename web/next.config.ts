import type { NextConfig } from 'next';

const config: NextConfig = {
  // Motor (engine) TypeScript kaynağı doğrudan kullanılır; kurallar tek yerde kalır.
  transpilePackages: ['@content-machine/engine'],
  poweredByHeader: false,
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
      ],
    }];
  },
};

export default config;
