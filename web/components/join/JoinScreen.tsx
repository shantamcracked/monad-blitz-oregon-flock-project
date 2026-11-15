"use client";
// OWNER: Teammate B (Phone & Create). The screen every audience member sees after scanning the QR.
// Keep the props interface (JoinScreenProps) exactly the same.
import { motion, AnimatePresence } from "framer-motion";
import type { JoinScreenProps } from "@/lib/types";
import { fmtUsd } from "@/lib/flock-math";

export default function JoinScreen({ flock, me, loggedIn, busy, error, lastRebateToast, onLogin, onJoin }: JoinScreenProps) {
  const closed = flock.status !== "open";
  return (
    <div className="mx-auto min-h-screen max-w-md bg-flock-ink px-5 pb-16 pt-6 text-white">
      <div className="text-xs uppercase tracking-[0.3em] text-flock-purple">Flock 🦆</div>
      <div className="mt-3 overflow-hidden rounded-3xl bg-flock-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={flock.imageUrl} alt="" className="h-40 w-full object-cover opacity-80" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
        <div className="p-5">
          <h1 className="text-2xl font-black">{flock.title}</h1>
          <div className="mt-1 text-white/60">{flock.n} ducks in · min {flock.minBuyers} · max {flock.maxBuyers}</div>
          <div className="mt-4 text-sm text-white/60">{me.joined ? "You pay right now" : "Join now at"}</div>
          <motion.div key={me.joined ? flock.price : flock.nextPrice} initial={{ scale: 1.15, color: "#3DF5A7" }} animate={{ scale: 1, color: "#fff" }} className="tabular font-mono text-6xl font-black">
            {fmtUsd(me.joined ? flock.price : flock.nextPrice)}
          </motion.div>
          <div className="text-sm text-white/50">alone it would be {fmtUsd(flock.soloPrice)} · drops every time someone joins</div>
        </div>
      </div>

      {!me.joined && !closed && (
        <button
          onClick={loggedIn ? onJoin : onLogin}
          disabled={busy}
          className="mt-5 w-full rounded-2xl bg-flock-purple py-5 text-xl font-black shadow-lg shadow-flock-purple/30 active:scale-95 disabled:opacity-60"
        >
          {busy ? "Joining… (≈1s on Monad)" : loggedIn ? `Join at ${fmtUsd(flock.nextPrice)}` : "Sign in with email to join"}
        </button>
      )}

      {me.joined && (
        <div className="mt-5 rounded-3xl border border-flock-mint/40 bg-flock-mint/10 p-5">
          <div className="text-3xl font-black">You&apos;re Duck #{me.myIndex} 🦆</div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div><div className="text-white/50">You paid</div><div className="font-mono text-xl">{fmtUsd(me.paidAtJoin ?? 0)}</div></div>
            <div><div className="text-white/50">Rebates so far</div><div className="font-mono text-xl text-flock-mint">+{fmtUsd(me.rebatesSoFar)}</div></div>
          </div>
          <div className="mt-3 text-xs text-white/60">Every new duck lowers your price and sends you the difference — instantly.</div>
        </div>
      )}

      <div className="mt-5 rounded-2xl bg-flock-card p-4 text-sm text-white/70">
        🛡 If this flock doesn&apos;t reach {flock.minBuyers} by the deadline, you get a <b>full refund + {fmtUsd(flock.bonusPerBuyer)} bonus</b>. Joining can&apos;t lose.
      </div>
      {loggedIn && <div className="mt-3 text-center text-xs text-white/40">Test wallet balance: {fmtUsd(me.balance)}</div>}
      {error && <div className="mt-3 rounded-xl bg-flock-red/20 p-3 text-sm text-flock-red">{error}</div>}
      {closed && <div className="mt-5 rounded-xl bg-flock-gold/20 p-4 text-center font-bold text-flock-gold">{flock.status === "success" ? "This flock flew! 🎉" : "This flock didn't fill — everyone was refunded + bonus."}</div>}

      <AnimatePresence>
        {lastRebateToast && (
          <motion.div key={lastRebateToast} initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} className="fixed inset-x-4 bottom-4 mx-auto max-w-md rounded-2xl bg-flock-mint px-4 py-3 text-center font-bold text-flock-ink shadow-xl">
            💸 {lastRebateToast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
