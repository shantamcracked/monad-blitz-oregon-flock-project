import type { NextConfig } from "next";

// Privy ships optional Solana/AA integrations we don't use → stub them out so the build works.
const OPTIONAL_PEERS = [
  "@solana/kit",
  "@solana-program/system",
  "@solana-program/token",
  "@solana-program/memo",
  "@farcaster/mini-app-solana",
  "@abstract-foundation/agw-client",
  "permissionless",
];

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true }, // hackathon: lint warnings must never block a deploy
  webpack: (config) => {
    config.resolve.alias = { ...(config.resolve.alias || {}), ...Object.fromEntries(OPTIONAL_PEERS.map((p) => [p, false])) };
    return config;
  },
};

export default nextConfig;
