import "server-only";
import { createPublicClient, createWalletClient, http, type Abi, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { monad, RPC_URL, FLOCK_ADDRESS, USD_ADDRESS } from "../config";
import FlockAbiJson from "../contracts/FlockAbi.json";
import FlockUSDAbiJson from "../contracts/FlockUSDAbi.json";

export const FlockAbi = FlockAbiJson as Abi;
export const FlockUSDAbi = FlockUSDAbiJson as Abi;

// Server can use a private (faster, higher rate-limit) RPC like Alchemy/QuickNode.
const SERVER_RPC = process.env.MONAD_RPC_URL_SERVER || RPC_URL;
export const publicClient = createPublicClient({ chain: monad, transport: http(SERVER_RPC, { batch: true }) });

function relayerKeys(): Hex[] {
  const raw = process.env.RELAYER_PRIVATE_KEYS || process.env.DEPLOYER_PRIVATE_KEY || "";
  return raw.split(",").map((k) => k.trim()).filter(Boolean).map((k) => (k.startsWith("0x") ? k : `0x${k}`) as Hex);
}

export function adminWallet() {
  const k = process.env.DEPLOYER_PRIVATE_KEY;
  if (!k) throw new Error("DEPLOYER_PRIVATE_KEY missing in env");
  return createWalletClient({ chain: monad, account: privateKeyToAccount((k.startsWith("0x") ? k : `0x${k}`) as Hex), transport: http(SERVER_RPC) });
}

const RETRYABLE = /nonce|underpriced|already known|replacement|timeout|fetch failed|429|rate|temporarily/i;

/**
 * Sends a contract write from one of the relayer wallets (they pay gas so users never need MON).
 * Random relayer per attempt + fresh pending nonce + retries = safe under concurrent joins.
 */
export async function relayWrite(args: { address: `0x${string}`; abi: Abi; functionName: string; args: readonly unknown[] }) {
  const keys = relayerKeys();
  if (!keys.length) throw new Error("No RELAYER_PRIVATE_KEYS / DEPLOYER_PRIVATE_KEY in env");
  let lastErr: unknown;
  for (let attempt = 0; attempt < 5; attempt++) {
    const account = privateKeyToAccount(keys[(Math.floor(Math.random() * keys.length) + attempt) % keys.length]);
    const wallet = createWalletClient({ chain: monad, account, transport: http(SERVER_RPC) });
    try {
      // simulate first → clean revert reasons, and an accurate gas estimate
      const { request } = await publicClient.simulateContract({ account, ...args });
      const est = await publicClient.estimateContractGas({ account, ...args });
      // Monad charges the gas LIMIT, so keep the buffer modest (30% + 60k covers late rebate-loop growth)
      const gas = (est * 13n) / 10n + 60_000n;
      const nonce = await publicClient.getTransactionCount({ address: account.address, blockTag: "pending" });
      const hash = await wallet.writeContract({ ...request, gas, nonce });
      const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 20_000 });
      if (receipt.status !== "success") throw new Error(`reverted on-chain: ${hash}`);
      return { hash, receipt };
    } catch (e) {
      lastErr = e;
      const msg = (e as Error)?.message || "";
      if (!RETRYABLE.test(msg)) break; // real revert (e.g. AlreadyJoined) → don't retry
      await new Promise((r) => setTimeout(r, 150 + attempt * 250));
    }
  }
  throw lastErr;
}

export { FLOCK_ADDRESS, USD_ADDRESS };

/** Turn viem errors into short human messages for the UI. */
export function humanError(e: unknown): string {
  const err = e as { shortMessage?: string; message?: string; cause?: { data?: { errorName?: string }; reason?: string } };
  // look everywhere viem might put the custom error name (shortMessage, full message, decoded cause)
  const m = [err?.cause?.data?.errorName, err?.cause?.reason, err?.shortMessage, err?.message, String(e)].filter(Boolean).join(" | ");
  if (/AlreadyJoined/.test(m)) return "You're already in this flock 🦆";
  if (/Full/.test(m)) return "This flock is full!";
  if (/NotOpen/.test(m)) return "This flock is closed.";
  if (/Expired/.test(m)) return "Too late — this flock's deadline passed.";
  if (/BadSignature/.test(m)) return "Signature check failed — try again.";
  if (/InsufficientBalance/.test(m)) return "Not enough test dollars — tap 'Get test dollars'.";
  if (/NotSettleable/.test(m)) return "Can't settle yet (deadline not reached or minimum not met).";
  return (err?.shortMessage || err?.message || String(e)).split("\n")[0].slice(0, 160);
}
