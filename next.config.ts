import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
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
