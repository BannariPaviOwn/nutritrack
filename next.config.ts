import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Auth + per-user cookie reads on every page; keep classic dynamic rendering for MVP.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
