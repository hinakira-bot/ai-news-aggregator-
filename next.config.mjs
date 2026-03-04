/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/ai-news',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
