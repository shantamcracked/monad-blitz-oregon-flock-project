import "server-only";
import { publicClient, FlockAbi, FlockUSDAbi, FLOCK_ADDRESS, USD_ADDRESS } from "./chain";
import type { Buyer, FlockState, FlockStatus } from "../types";
import { buildCurve, buildFeed, priceAt, totalRebated } from "../flock-math";

const D = 1e6;
const STATUS: FlockStatus[] = ["open", "success", "failed"];

type RawView = {
  id: bigint;
  data: {
    seller: string; fixedCost: bigint; unitCost: bigint; bonusPerBuyer: bigint; bond: bigint;
    deadline: bigint; createdAt: bigint; minBuyers: number; maxBuyers: number; n: number; status: number;
  };
  title: string; imageUrl: string; currentPrice: bigint; nextPrice: bigint; soloPrice: bigint;
  buyers: readonly string[]; joinedAt: readonly bigint[];
};

export function toFlockState(v: RawView): FlockState {
  const d = v.data;
  const F = Number(d.fixedCost) / D;
  const c = Number(d.unitCost) / D;
  const n = Number(d.n);
  const buyers: Buyer[] = v.buyers.map((a, i) => ({
    address: a,
    index: i + 1,
    joinedAt: Number(v.joinedAt[i]) * 1000,
    paidAtJoin: priceAt(F, c, i + 1),
  }));
  const base = {
    id: Number(v.id), title: v.title, imageUrl: v.imageUrl || "/img/van.svg", seller: d.seller,
    fixedCost: F, unitCost: c, bonusPerBuyer: Number(d.bonusPerBuyer) / D,
    minBuyers: Number(d.minBuyers), maxBuyers: Number(d.maxBuyers), n,
    deadline: Number(d.deadline) * 1000, status: STATUS[Number(d.status)] ?? "open",
  };
  return {
    ...base,
    price: Number(v.currentPrice) / D,
    prevPrice: n > 1 ? priceAt(F, c, n - 1) : null,
    nextPrice: Number(v.nextPrice) / D,
    soloPrice: Number(v.soloPrice) / D,
    buyers,
    feed: buildFeed(base, buyers, Number(d.createdAt) * 1000),
    curve: buildCurve(F, c, Number(d.maxBuyers)),
    totalRebated: totalRebated(F, c, n),
  };
}

// Tiny in-memory cache so 40 phones polling = ~2 RPC reads/sec, not 40 (public RPC is rate-limited).
const cache = new Map<string, { at: number; value: unknown }>();
async function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.value as T;
  const value = await fn();
  cache.set(key, { at: Date.now(), value });
  return value;
}

export async function readFlock(id: number): Promise<FlockState | null> {
  return cached(`flock:${id}`, 400, async () => {
    const v = (await publicClient.readContract({ address: FLOCK_ADDRESS, abi: FlockAbi, functionName: "getFlock", args: [BigInt(id)] })) as RawView;
    if (/^0x0+$/.test(v.data.seller)) return null;
    return toFlockState(v);
  });
}

export async function readFlocks(count = 12): Promise<FlockState[]> {
  return cached(`flocks:${count}`, 1500, async () => {
    const vs = (await publicClient.readContract({ address: FLOCK_ADDRESS, abi: FlockAbi, functionName: "getFlocks", args: [BigInt(count)] })) as RawView[];
    return vs.map(toFlockState);
  });
}

export async function readBalance(address: `0x${string}`): Promise<number> {
  const b = (await publicClient.readContract({ address: USD_ADDRESS, abi: FlockUSDAbi, functionName: "balanceOf", args: [address] })) as bigint;
  return Number(b) / D;
}

export async function readNonce(address: `0x${string}`): Promise<bigint> {
  return (await publicClient.readContract({ address: FLOCK_ADDRESS, abi: FlockAbi, functionName: "nonces", args: [address] })) as bigint;
}

export type Settlement = { kind: "purchase" | "refund"; txHash: string; block: number; paidToSeller: number | null; fee: number | null };
const settled = new Map<number, Settlement>(); // settled flocks never change → cache forever

/** Finds the on-chain tx that bought (or refunded) a settled flock, via Flock.settledBlock + a 1-block log query. */
export async function readSettlement(id: number): Promise<Settlement | null> {
  const hit = settled.get(id);
  if (hit) return hit;
  return cached(`settle:${id}`, 2000, async () => {
    const block = (await publicClient.readContract({ address: FLOCK_ADDRESS, abi: FlockAbi, functionName: "settledBlock", args: [BigInt(id)] })) as bigint;
    if (!block) return null;
    const [s] = (await publicClient.getContractEvents({ address: FLOCK_ADDRESS, abi: FlockAbi, eventName: "Settled", args: { id: BigInt(id) }, fromBlock: block, toBlock: block })) as unknown as { transactionHash: string; args: { success: boolean } }[];
    if (!s) return null;
    let paidToSeller: number | null = null, fee: number | null = null;
    if (s.args.success) {
      const [p] = (await publicClient.getContractEvents({ address: FLOCK_ADDRESS, abi: FlockAbi, eventName: "Purchased", args: { id: BigInt(id) }, fromBlock: block, toBlock: block })) as unknown as { args: { paidToSeller: bigint; fee: bigint } }[];
      if (p) { paidToSeller = Number(p.args.paidToSeller) / D; fee = Number(p.args.fee) / D; }
    }
    const out: Settlement = { kind: s.args.success ? "purchase" : "refund", txHash: s.transactionHash, block: Number(block), paidToSeller, fee };
    settled.set(id, out);
    return out;
  });
}
