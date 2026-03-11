/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  // Optional: if backend is on different origin, add rewrites for API
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.VITE_API_BASE_URL || 'http://localhost:3000';
    return [
      { source: '/api/backend/:path*', destination: `${apiUrl}/api/:path*` },
    ];
  },
};

export default nextConfig;
