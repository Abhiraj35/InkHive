import type { NextConfig } from "next";
import { createMDX } from "fumadocs-mdx/next";

const withBundleAnalyzer =
  process.env.ANALYZE === "true"
    ? require("@next/bundle-analyzer").default({ enabled: true })
    : (nextConfig: NextConfig) => nextConfig;

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    optimizePackageImports: ["lucide-react", "radix-ui"],
  },
};

const withMDX = createMDX({
  // configPath: "source.config.ts",
});

export default withBundleAnalyzer(withMDX(nextConfig));
