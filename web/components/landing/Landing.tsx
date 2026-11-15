"use client";
// OWNER: Teammate A (Board & Story). Home page: what Flock is + list of live flocks.
// Keep the props interface (LandingProps) exactly the same.
import Link from "next/link";
import type { LandingProps } from "@/lib/types";
import { fmtUsd } from "@/lib/flock-math";

export default function Landing({ flocks, onStartFlock }: LandingProps) {
  return (
    <div className="mx-auto max-w-5xl p-6 text-white">
      <header className="py-10">
        <div className="text-sm uppercase tracking-[0.3em] text-flock-purple">Flock 🦆</div>
        <h1 className="mt-2 text-5xl font-black leading-tight md:text-6xl">The group buy that gets cheaper every block.</h1>
        <p className="mt-4 max-w-2xl text-lg text-white/70">
          Every Duck who joins lowers the price for every Duck already in — and the difference lands back in your wallet in the same ~300ms Monad block.
          If the flock doesn&apos;t fill, the seller pays you a bonus for trying.
        </p>
        <button onClick={onStartFlock} className="mt-6 rounded-2xl bg-flock-purple px-6 py-4 text-lg font-black">Start a flock</button>
      </header>
      <h2 className="mb-3 text-xl font-bold">Live flocks</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {flocks.map((f) => (
          <Link key={f.id} href={`/f/${f.id}`} className="rounded-3xl bg-flock-card p-5 transition hover:ring-2 hover:ring-flock-purple">
            <div className="text-lg font-bold">{f.title}</div>
            <div className="mt-2 font-mono text-3xl font-black">{fmtUsd(f.n ? f.price : f.soloPrice)}</div>
            <div className="text-sm text-white/50">{f.n}/{f.maxBuyers} ducks · {f.status}</div>
          </Link>
        ))}
        {!flocks.length && <div className="text-white/50">No flocks yet.</div>}
      </div>
    </div>
  );
}
