import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // AVIF first: smaller photos for students on mobile data (PRODUCT.md, Operating Context).
  images: { formats: ["image/avif", "image/webp"] },
};

export default nextConfig;
