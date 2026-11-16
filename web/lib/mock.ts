"use client";
// Fake data so frontend teammates can build & animate screens with NO blockchain.
// useMockFlock() adds a new buyer every `everyMs` so you can see price drops + toasts.
import { useEffect, useMemo, useState } from "react";
import type { Buyer, FlockState, MeState } from "./types";
import { buildCurve, buildFeed, fmtUsd, priceAt, totalRebated } from "./flock-math";

const fakeAddr = (i: number) => `0x${(i * 2654435761 % 0xffffffff).toString(16).padStart(8, "0")}${"a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6".slice(0, 32)}`;

export function makeMockFlock(n: number, opts: Partial<FlockState> = {}): FlockState {
  const F = opts.fixedCost ?? 300;
  const c = opts.unitCost ?? 0;
  const max = opts.maxBuyers ?? 12;
  const created = Date.now() - 20 * 60_000;
  const buyers: Buyer[] = Array.from({ length: n }, (_, i) => ({
    address: fakeAddr(i + 1),
    index: i + 1,
    joinedAt: created + (i + 1) * 45_000,
    paidAtJoin: priceAt(F, c, i + 1),
  }));
  const base = {
    id: opts.id ?? 1,
    title: opts.title ?? "Thanksgiving van → PDX 🦃",
    imageUrl: opts.imageUrl ?? "/img/van.svg",
    seller: opts.seller ?? "0x5e11e7000000000000000000000000000000beef",
    fixedCost: F,
    unitCost: c,
    bonusPerBuyer: opts.bonusPerBuyer ?? 2,
    minBuyers: opts.minBuyers ?? 6,
    maxBuyers: max,
    n,
    deadline: opts.deadline ?? Date.now() + 47 * 60_000,
    status: opts.status ?? "open",
  } as const;
  return {
    ...base,
    price: priceAt(F, c, Math.max(n, 1)),
    prevPrice: n > 1 ? priceAt(F, c, n - 1) : null,
    nextPrice: priceAt(F, c, n + 1),
    soloPrice: priceAt(F, c, 1),
    buyers,
    feed: buildFeed(base, buyers, created),
    curve: buildCurve(F, c, max),
    totalRebated: totalRebated(F, c, n),
  };
}

export const MOCK_FLOCKS: FlockState[] = [
  makeMockFlock(7),
  makeMockFlock(14, { id: 2, title: "OBG × Monad Blitz hoodie", imageUrl: "/img/hoodie.svg", fixedCost: 120, unitCost: 14, minBuyers: 10, maxBuyers: 40, bonusPerBuyer: 1 }),
  makeMockFlock(3, { id: 3, title: "Late-night taco run 🌮 (fail demo)", imageUrl: "/img/tacos.svg", fixedCost: 160, minBuyers: 12, maxBuyers: 20, bonusPerBuyer: 3, deadline: Date.now() + 3 * 60_000 }),
];

/** Simulates a live flock: a new duck joins every `everyMs`. I am Duck #`meIndex`. */
export function useMockFlock(opts: { start?: number; everyMs?: number; meIndex?: number; base?: Partial<FlockState> } = {}) {
  const { start = 3, everyMs = 2500, meIndex = 2, base = {} } = opts;
  const [n, setN] = useState(start);
  const max = base.maxBuyers ?? 12;
  useEffect(() => {
    const t = setInterval(() => setN((x) => (x >= max ? start : x + 1)), everyMs);
    return () => clearInterval(t);
  }, [everyMs, max, start]);
  const flock = useMemo(() => makeMockFlock(n, base), [n]); // eslint-disable-line react-hooks/exhaustive-deps
  const me: MeState = {
    address: fakeAddr(meIndex),
    joined: n >= meIndex,
    myIndex: n >= meIndex ? meIndex : null,
    paidAtJoin: n >= meIndex ? priceAt(flock.fixedCost, flock.unitCost, meIndex) : null,
    rebatesSoFar: n >= meIndex ? priceAt(flock.fixedCost, flock.unitCost, meIndex) - flock.price : 0,
    balance: 500 - (n >= meIndex ? flock.price : 0),
  };
  const lastRebateToast =
    n > meIndex && flock.prevPrice ? `Duck #${n} joined — you got ${fmtUsd(flock.prevPrice - flock.price)} back!` : null;
  return { flock, me, lastRebateToast };
}
