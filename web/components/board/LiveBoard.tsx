"use client";
// OWNER: Teammate A (Board & Story). Projector screen shown during the demo.
// Keep the props interface (LiveBoardProps) exactly the same — Shantam's real page passes live data.
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { LineChart, Line, XAxis, YAxis, ReferenceDot, ResponsiveContainer, Tooltip } from "recharts";
import type { LiveBoardProps } from "@/lib/types";
import { fmtUsd, shortAddr } from "@/lib/flock-math";

function useCountdown(deadline: number) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(t); }, []);
  const s = Math.max(0, Math.floor((deadline - now) / 1000));
  return `${Math.floor(s / 3600) ? Math.floor(s / 3600) + "h " : ""}${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export default function LiveBoard({ flock, joinUrl, blockTimeMs = 300 }: LiveBoardProps) {
  const countdown = useCountdown(flock.deadline);
  const pct = Math.min(100, (flock.n / flock.maxBuyers) * 100);
  const minPct = (flock.minBuyers / flock.maxBuyers) * 100;
  const statusLabel = flock.status === "success" ? "THE FLOCK FLEW 🦆" : flock.status === "failed" ? "DIDN'T FILL — EVERYONE PAID BACK + BONUS" : flock.n >= flock.minBuyers ? "FLOCK IS ON ✅" : `${flock.minBuyers - flock.n} MORE TO TAKE OFF`;

  return (
    <div className="min-h-screen w-full bg-flock-ink p-8 text-white">
      <div className="mx-auto grid max-w-[1800px] grid-cols-12 gap-6">
        {/* header */}
        <div className="col-span-12 flex items-center justify-between">
          <div>
            <div className="text-sm uppercase tracking-[0.3em] text-flock-purple">Flock · live</div>
            <h1 className="text-5xl font-black">{flock.title}</h1>
          </div>
          <div className="rounded-full border border-flock-line px-4 py-2 font-mono text-sm text-white/70">
            Monad testnet · block ~{blockTimeMs}ms
          </div>
        </div>

        {/* price */}
        <div className="col-span-8 rounded-3xl bg-flock-card p-8">
          <div className="text-white/60">Everyone pays</div>
          <div className="flex items-end gap-6">
            <AnimatePresence mode="popLayout">
              <motion.div
                key={flock.price}
                initial={{ y: -40, opacity: 0, color: "#3DF5A7" }}
                animate={{ y: 0, opacity: 1, color: "#ffffff" }}
                transition={{ duration: 0.6 }}
                className="tabular font-mono text-[9rem] font-black leading-none"
              >
                {fmtUsd(flock.price)}
              </motion.div>
            </AnimatePresence>
            {flock.prevPrice && <div className="mb-6 font-mono text-4xl text-white/40 line-through">{fmtUsd(flock.prevPrice)}</div>}
          </div>
          <div className="mt-2 text-xl text-white/70">
            Alone: <span className="line-through">{fmtUsd(flock.soloPrice)}</span> · Next duck pays{" "}
            <span className="text-flock-mint">{fmtUsd(flock.nextPrice)}</span> · Rebated so far{" "}
            <span className="text-flock-mint">{fmtUsd(flock.totalRebated)}</span>
          </div>
          <div className="mt-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={flock.curve}>
                <XAxis dataKey="n" stroke="#ffffff55" />
                <YAxis stroke="#ffffff55" tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v) => fmtUsd(Number(v))} labelFormatter={(n) => `${n} ducks`} contentStyle={{ background: "#1A1530", border: "1px solid #2E2650" }} />
                <Line type="monotone" dataKey="price" stroke="#836EF9" strokeWidth={4} dot={false} />
                {flock.n > 0 && <ReferenceDot x={flock.n} y={flock.price} r={10} fill="#3DF5A7" stroke="#fff" />}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* QR */}
        <div className="col-span-4 flex flex-col items-center justify-center rounded-3xl bg-white p-8 text-flock-ink">
          <QRCodeSVG value={joinUrl} size={340} />
          <div className="mt-4 text-3xl font-black">Scan to join the flock</div>
          <div className="text-flock-ink/60">email login · no wallet · no gas</div>
        </div>

        {/* progress */}
        <div className="col-span-8 rounded-3xl bg-flock-card p-6">
          <div className="mb-3 flex justify-between text-xl">
            <span className="font-bold">{flock.n} / {flock.maxBuyers} ducks</span>
            <span className="text-flock-gold">{statusLabel}</span>
            <span className="font-mono">⏱ {countdown}</span>
          </div>
          <div className="relative h-6 w-full overflow-hidden rounded-full bg-flock-line">
            <motion.div className="h-full bg-flock-purple" animate={{ width: `${pct}%` }} />
            <div className="absolute top-0 h-full w-1 bg-flock-gold" style={{ left: `${minPct}%` }} />
          </div>
          <div className="mt-2 text-sm text-white/60">
            Gold line = minimum ({flock.minBuyers}). If it isn&apos;t reached by the deadline, everyone gets a full refund + {fmtUsd(flock.bonusPerBuyer)} bonus from the seller.
          </div>
        </div>

        {/* feed */}
        <div className="col-span-4 max-h-[340px] overflow-hidden rounded-3xl bg-flock-card p-6">
          <div className="mb-3 text-sm uppercase tracking-widest text-white/50">Live feed</div>
          <AnimatePresence initial={false}>
            {flock.feed.slice(0, 7).map((e) => (
              <motion.div key={e.id} layout initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="mb-2 rounded-xl bg-flock-ink/60 px-3 py-2">
                <div className="text-sm">{e.text}</div>
                {e.address && <div className="font-mono text-xs text-white/40">{shortAddr(e.address)}</div>}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
