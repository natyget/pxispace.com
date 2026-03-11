/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'dist',
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
