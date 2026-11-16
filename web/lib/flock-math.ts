// Pure helpers shared by mock + live data. Mirrors Flock.sol exactly.
import type { CurvePoint, FeedEvent, FlockState, Buyer } from "./types";

/** ceil(F / n) + c, in dollars, rounded to cents like the contract (6dp → display 2dp). */
export function priceAt(F: number, c: number, n: number): number {
  if (n < 1) n = 1;
  const micro = Math.ceil((F * 1e6) / n) + c * 1e6;
  return micro / 1e6;
}

export function buildCurve(F: number, c: number, max: number): CurvePoint[] {
  return Array.from({ length: max }, (_, i) => ({ n: i + 1, price: priceAt(F, c, i + 1) }));
}

export function fmtUsd(x: number): string {
  return x.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function shortAddr(a?: string | null): string {
  if (!a) return "";
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

/** Derive the event feed (newest first) from buyers — no log queries needed. */
export function buildFeed(f: Pick<FlockState, "id" | "title" | "fixedCost" | "unitCost" | "status" | "deadline">, buyers: Buyer[], createdAt: number): FeedEvent[] {
  const feed: FeedEvent[] = [
    { id: `c-${f.id}`, kind: "created", text: `Flock started: ${f.title}`, at: createdAt },
  ];
  buyers.forEach((b) => {
    const rebate = b.index > 1 ? priceAt(f.fixedCost, f.unitCost, b.index - 1) - priceAt(f.fixedCost, f.unitCost, b.index) : 0;
    feed.push({
      id: `j-${f.id}-${b.index}`,
      kind: "joined",
      address: b.address,
      at: b.joinedAt,
      rebatePerBuyer: rebate,
      text:
        b.index === 1
          ? `Duck #1 joined at ${fmtUsd(b.paidAtJoin)} — the flock is flying`
          : `Duck #${b.index} joined — ${b.index - 1} earlier ${b.index - 1 === 1 ? "buyer" : "buyers"} got ${fmtUsd(rebate)} back`,
    });
  });
  if (f.status === "success") feed.push({ id: `s-${f.id}`, kind: "settled-success", text: `The flock flew! Final price ${fmtUsd(priceAt(f.fixedCost, f.unitCost, buyers.length))}`, at: Math.max(Date.now() - 1, buyers.at(-1)?.joinedAt ?? 0) });
  if (f.status === "failed") feed.push({ id: `x-${f.id}`, kind: "settled-failed", text: `Flock didn't fill — everyone refunded + bonus`, at: f.deadline });
  return feed.reverse();
}

export function totalRebated(F: number, c: number, n: number): number {
  // sum over joins k=2..n of (k-1) * (p(k-1) - p(k))
  let t = 0;
  for (let k = 2; k <= n; k++) t += (k - 1) * (priceAt(F, c, k - 1) - priceAt(F, c, k));
  return Math.round(t * 100) / 100;
}
