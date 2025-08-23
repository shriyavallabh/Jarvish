/** @type {import('next').NextConfig} */
const nextConfig = {
  // App Router Configuration
  experimental: {
    appDir: true,
    serverComponentsExternalPackages: ['@supabase/supabase-js', 'ioredis', 'pg'],
    optimizePackageImports: ['@supabase/supabase-js', 'recharts', 'lucide-react'],
    scrollRestoration: true,
    esmExternals: true,
  },

  // Build Optimization
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Performance Optimizations
  swcMinify: true,
  compress: true,
  optimizeFonts: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  trailingSlash: false,
  generateEtags: true,

  // Output configuration
  output: 'standalone',

  // Page extensions
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],

  // Image Optimization for WhatsApp content
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 768, 1024, 1280, 1600],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 86400, // 24 hours
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    domains: ['supabase.co', 'api.whatsapp.com'],
    unoptimized: false,
  },

  // Headers for Performance and Security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },

  // Redirects for SEO
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/advisor/dashboard',
        permanent: true,
      },
    ];
  },

  // Rewrites for API optimization
  async rewrites() {
    return [
      {
        source: '/health',
        destination: '/api/health',
      },
      {
        source: '/metrics',
        destination: '/api/metrics',
      },
    ];
  },

  // Environment variables
  env: {
    CUSTOM_KEY: 'production_optimized',
    BUILD_TIME: new Date().toISOString(),
  },
}

module.exports = nextConfig