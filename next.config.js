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
  output: 'export',
  // Set the output directory to 'out'
  distDir: 'out',
};

module.exports = nextConfig;
