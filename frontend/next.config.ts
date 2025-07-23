import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: [
      "lh3.googleusercontent.com", // Google user avatars
      // Add other domains you use for images here
    ],
  },
  overrides: {
    "react-is": "^19.0.0-rc-69d4b800-20241021",
  },
};

export default nextConfig;
