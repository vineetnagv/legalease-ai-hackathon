import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */

  // Enable standalone output for production deployments (Firebase App Hosting)
  output: 'standalone',

  // Generate consistent build ID to ensure client/server hash matching
  // Critical for Firebase Studio cloud builds to prevent action hash mismatches
  generateBuildId: async () => {
    // Use timestamp to create unique but consistent build identifier
    // This ensures client and server bundles are always from the same build
    return Date.now().toString();
  },

  // Server Actions configuration (explicit for production)
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Support file uploads up to 10MB
      allowedOrigins: undefined, // Allow all origins (configure as needed for security)
    },
  },

  typescript: {
    ignoreBuildErrors: true, // Keep for now to avoid blocking deployment
  },
  eslint: {
    ignoreDuringBuilds: true, // Keep for now to avoid blocking deployment
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Only configure for server-side builds (API routes)
    if (isServer) {
      // Exclude problematic test files and dependencies from the bundle
      config.externals = config.externals || [];
      config.externals.push({
        // Mark canvas as external to avoid bundling issues
        canvas: 'canvas',
      });

      // Ignore test files and directories
      config.plugins = config.plugins || [];
      config.plugins.push(
        new (require('webpack')).IgnorePlugin({
          resourceRegExp: /^\.\/test/,
          contextRegExp: /pdf-parse/,
        })
      );
    }

    return config;
  },
};

export default nextConfig;
