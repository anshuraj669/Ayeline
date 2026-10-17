import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Dockerfile builds a self-contained server; `npm start` keeps working everywhere else.
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
};

export default nextConfig;
