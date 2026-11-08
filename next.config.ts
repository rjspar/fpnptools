import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/files/[name]": ["./src/content/files/**"],
  },
};

export default nextConfig;
