import type { NextConfig } from "next";

// Vendor product photos live on Cloudinary. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME (same value as the
// server's CLOUDINARY_CLOUD_NAME) so only OUR account's pictures can go through the image optimizer; without
// it any Cloudinary account's pictures are allowed, which works but is wider than it needs to be.
const cloudinaryCloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
if (!cloudinaryCloud) {
  console.warn("[next.config] NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not set: all of res.cloudinary.com is allowed for images.");
}

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: cloudinaryCloud ? `/${cloudinaryCloud}/image/upload/**` : "/**",
      },
    ],
  },
};

export default nextConfig;
