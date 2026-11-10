/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow images from anywhere (you use emoji, not next/image)
  images: { remotePatterns: [{ protocol: "https", hostname: "**" }] },
};

module.exports = nextConfig;