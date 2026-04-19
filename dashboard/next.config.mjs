/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ["framer-motion"]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'logo.clearbit.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.brandfetch.io',
      },
      {
        protocol: 'https',
        hostname: 'cdn.worldvectorlogo.com',
      },
    ],
  },
};

export default nextConfig;

