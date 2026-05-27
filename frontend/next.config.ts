import type { NextConfig } from "next";

const nextConfig = {
  /* config options here */
  experimental: {
    globalNotFound: true,
  },
  images: {
    domains: [
      "lh3.googleusercontent.com", // Google user avatars
      "uesnxipslchrqjvwasuj.supabase.co",
      // Add other domains you use for images here
    ],
  },
  // overrides: {
  //   "react-is": "^19.0.0-rc-69d4b800-20241021",
  // },
  eslint: {
    ignoreDuringBuilds: true, // Add this line
  },
};

export default nextConfig;
