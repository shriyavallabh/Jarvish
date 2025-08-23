/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  typescript: {
    // Enable type checking during build
    ignoreBuildErrors: false,
  },
  eslint: {
    // Enable ESLint during build
    ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig