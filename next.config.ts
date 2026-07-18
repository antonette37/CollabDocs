import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bundle the build-time seeded SQLite file into serverless functions
  // so runtime can copy it into /tmp on Vercel.
  outputFileTracingIncludes: {
    "/*": ["./prisma/dev.db"],
    "/documents/[id]": ["./prisma/dev.db"],
  },
};

export default nextConfig;
