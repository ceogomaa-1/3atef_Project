/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep these ESM packages out of the webpack bundle — loaded by Node at runtime (Next.js 14)
  experimental: {
    serverComponentsExternalPackages: ['@react-pdf/renderer', 'playwright', 'canvas'],
  },
  // Exclude playwright and canvas from client bundles
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        playwright: false,
        canvas: false,
      }
    }
    return config
  },
  // Allow images from external sources (hotel photos etc.)
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.booking.com' },
      { protocol: 'https', hostname: '**.bstatic.com' },
    ],
  },
}

export default nextConfig;
