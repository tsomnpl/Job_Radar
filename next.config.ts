import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "prisma", "mammoth", "unpdf"],
};

export default nextConfig;
