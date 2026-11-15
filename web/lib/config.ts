import { defineChain } from "viem";
import deployment from "./contracts/deployment.json";

export const RPC_URL = process.env.NEXT_PUBLIC_MONAD_RPC_URL || "https://testnet-rpc.monad.xyz";
export const EXPLORER_URL = process.env.NEXT_PUBLIC_EXPLORER_URL || "https://testnet.monadexplorer.com";
export const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "cmwicb7jq005w0hi4m7nymdwz";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || ""; // e.g. https://flock-xyz.vercel.app (used in QR codes)

export const monad = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: { default: { http: [RPC_URL] } },
  blockExplorers: { default: { name: "Monad Explorer", url: EXPLORER_URL } },
  testnet: true,
});

export const FLOCK_ADDRESS = deployment.flock as `0x${string}`;
export const USD_ADDRESS = deployment.usd as `0x${string}`;
export const IS_DEPLOYED = !/^0x0+$/.test(deployment.flock);
