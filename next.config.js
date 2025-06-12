/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even with
    // ESLint errors. This is not recommended for normal projects.
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  // Removed output: 'export' and distDir: 'out' for Vercel deployment
  // Vercel handles the build and deployment automatically
};

module.exports = nextConfig;
