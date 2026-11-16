"use client";
// OWNER: Teammate A (Board & Story). Projector board — an Apple keynote slide.
// Keep the props interface (LiveBoardProps) exactly the same.
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { Line, LineChart, ReferenceDot, ResponsiveContainer, XAxis, YAxis } from "recharts";
import confetti from "canvas-confetti";
import { Clock3, ShieldCheck, Sparkles } from "lucide-react";
import type { LiveBoardProps } from "@/lib/types";
import { fmtUsd } from "@/lib/flock-math";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Countdown, useNow } from "@/components/ui/Countdown";

const SW = 1.75;

function cleanTitle(title: string): string {
  return title.replace(/[\p{Extended_Pictographic}‍️]/gu, "").replace(/\s{2,}/g, " ").trim();
}

function GlowDot({ cx, cy }: { cx?: number; cy?: number }) {
  if (cx === undefined || cy === undefined) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={22} fill="#836EF9" opacity={0.18} />
      <circle cx={cx} cy={cy} r={11} fill="#836EF9" opacity={0.35} />
      <circle cx={cx} cy={cy} r={6} fill="#fff" />
    </g>
  );
}

export default function LiveBoard({ flock, joinUrl, blockTimeMs = 300 }: LiveBoardProps) {
  const reduced = useReducedMotion();
  const now = useNow();
  const title = cleanTitle(flock.title);

  // Detect price drops → "−$X for everyone" chip + "+$" flashes on earlier tiles.
  const [drop, setDrop] = useState<{ amount: number; serial: number; earlier: number } | null>(null);
  const previous = useRef({ id: flock.id, price: flock.price, n: flock.n });
  useEffect(() => {
    const old = previous.current;
    previous.current = { id: flock.id, price: flock.price, n: flock.n };
    if (old.id === flock.id && old.price > flock.price) setDrop({ amount: old.price - flock.price, serial: Date.now(), earlier: old.n });
  }, [flock.id, flock.price, flock.n]);
  useEffect(() => {
    if (!drop) return;
    const t = setTimeout(() => setDrop(null), 2600);
    return () => clearTimeout(t);
  }, [drop]);

  // Confetti once per successful flock.
  const celebrated = useRef<number | null>(null);
  useEffect(() => {
    if (flock.status === "success" && celebrated.current !== flock.id) {
      celebrated.current = flock.id;
      if (!reduced) void confetti({ particleCount: 220, spread: 120, origin: { y: 0.4 }, colors: ["#836EF9", "#30D158", "#FFFFFF", "#FFD60A"], disableForReducedMotion: true });
    }
  }, [flock.id, flock.status, reduced]);

  const curve = useMemo(() => flock.curve.map((p) => ({ ...p, reached: p.n <= Math.max(flock.n, 1) ? p.price : null })), [flock.curve, flock.n]);
  const current = curve.find((p) => p.n === flock.n);
  const remaining = Math.max(0, flock.minBuyers - flock.n);
  const expired = now !== null && now >= flock.deadline;
  const full = flock.n >= flock.maxBuyers;
  const shownPrice = flock.n ? flock.price : flock.soloPrice;
  const cols = flock.maxBuyers > 24 ? 10 : flock.maxBuyers > 12 ? 8 : 6;

  return (
    <MotionConfig reducedMotion="user">
      <main className="relative flex h-[100svh] w-full flex-col gap-[1.6vh] overflow-hidden bg-black px-[2.4vw] py-[2.4vh] text-white">
        {/* ambient glow behind the price */}
        <div className="pointer-events-none absolute left-[8%] top-[18%] h-[60vh] w-[45vw] rounded-full bg-[#836EF9] opacity-[0.22] blur-[140px]" aria-hidden="true" />

        {/* top bar */}
        <header className="relative flex items-center justify-between gap-6">
          <div className="min-w-0">
            <p className="text-[clamp(13px,1vw,18px)] font-semibold uppercase tracking-[0.22em] text-[#836EF9]">Flock · Live</p>
            <h1 className="truncate text-[clamp(28px,2.6vw,52px)] font-semibold leading-tight tracking-[-0.02em]">{title}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-[clamp(14px,1vw,20px)] text-white/80 backdrop-blur-xl">
              <Clock3 size={18} strokeWidth={SW} aria-hidden="true" />
              {flock.status === "open" ? <Countdown deadline={flock.deadline} endedLabel="Awaiting settlement" /> : "Closed"}
            </span>
            <span className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-[clamp(14px,1vw,20px)] text-white/80 backdrop-blur-xl">
              <motion.span
                className="h-2.5 w-2.5 rounded-full bg-[#30D158]"
                animate={{ opacity: [1, 0.25, 1], scale: [1, 0.8, 1] }}
                transition={{ duration: Math.max(150, blockTimeMs) / 1000, repeat: Infinity, ease: "easeInOut" }}
                aria-hidden="true"
              />
              Monad testnet · ~{blockTimeMs}ms blocks
            </span>
          </div>
        </header>

        <div className="relative grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_clamp(260px,24vw,440px)] grid-rows-[minmax(0,1.35fr)_minmax(0,1fr)] gap-[1.6vh]">
          {/* hero: price + curve */}
          <section className="grid min-h-0 grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] items-center gap-[2vw]" aria-label="Current group price">
            <div className="min-w-0">
              <p className="text-[clamp(16px,1.2vw,24px)] text-white/50">Price per person</p>
              <div className="relative">
                <div className="text-[clamp(120px,10.5vw,220px)] font-semibold leading-[0.95] tracking-[-0.045em] [text-shadow:0_0_80px_rgba(131,110,249,0.45)]">
                  <AnimatedNumber value={shownPrice} />
                </div>
                <AnimatePresence>
                  {drop && (
                    <motion.div
                      key={drop.serial}
                      initial={{ opacity: 0, y: 20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -16 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      className="absolute -top-[1.2vh] right-0 rounded-full bg-[#30D158] px-4 py-1.5 text-[clamp(16px,1.3vw,26px)] font-semibold tabular-nums text-black shadow-[0_10px_40px_-8px_rgba(48,209,88,0.7)]"
                    >
                      −{fmtUsd(drop.amount)} for everyone
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="mt-[1.4vh] flex flex-wrap items-baseline gap-x-6 gap-y-1 text-[clamp(16px,1.3vw,26px)]">
                <span className="text-white/30 line-through decoration-white/30">alone {fmtUsd(flock.soloPrice)}</span>
                {flock.status === "open" && !full && (
                  <span className="text-white/70">
                    next Duck pays <span className="font-semibold tabular-nums text-white">{fmtUsd(flock.nextPrice)}</span>
                  </span>
                )}
              </div>
              <p className="mt-[0.8vh] text-[clamp(16px,1.3vw,26px)] text-[#30D158]">
                <span className="tabular-nums">{fmtUsd(flock.totalRebated)}</span> paid back to earlier Ducks
              </p>
            </div>

            <div className="h-full min-h-0 min-w-0" aria-label="Price falls as more Ducks join">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={curve} margin={{ top: 30, right: 24, bottom: 4, left: 4 }}>
                  <XAxis dataKey="n" type="number" domain={[1, Math.max(2, flock.maxBuyers)]} allowDecimals={false} tickLine={false} axisLine={false} minTickGap={40} tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 16 }} />
                  <YAxis tickFormatter={(v) => `$${Math.round(v)}`} tickLine={false} axisLine={false} width={64} tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 16 }} tickCount={3} />
                  <Line type="monotone" dataKey="price" stroke="#836EF9" strokeOpacity={0.3} strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="reached" stroke="#a796ff" strokeWidth={2.5} dot={false} isAnimationActive={false} style={{ filter: "drop-shadow(0 0 8px rgba(131,110,249,0.8))" }} />
                  {current && <ReferenceDot x={current.n} y={current.price} shape={<GlowDot />} />}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* QR card */}
          <aside className="row-span-1 flex min-h-0 flex-col items-center justify-center gap-[1.2vh] rounded-[32px] bg-white p-[1.4vw] text-black shadow-[0_40px_80px_-30px_rgba(131,110,249,0.6)]">
            <QRCodeSVG value={joinUrl} size={512} marginSize={2} level="M" className="h-auto max-h-full w-full min-h-0 flex-1" title="Scan to join this flock" />
            <div className="text-center">
              <p className="text-[clamp(20px,1.7vw,34px)] font-semibold tracking-tight">Scan to join</p>
              <p className="text-[clamp(13px,0.95vw,18px)] text-black/50">email · no wallet · no gas</p>
            </div>
          </aside>

          {/* duck grid */}
          <section className="flex min-h-0 flex-col rounded-[28px] border border-white/10 bg-white/[0.06] p-[1.3vw] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl" aria-label="Ducks">
            <div className="flex items-baseline justify-between gap-4">
              <p className="text-[clamp(18px,1.5vw,30px)] font-semibold tracking-tight">
                <span className="tabular-nums">{flock.n}</span>
                <span className="text-white/40"> / {flock.maxBuyers} Ducks</span>
              </p>
              <p className="text-[clamp(14px,1.1vw,22px)] text-[#FFD60A]">
                {flock.status !== "open" ? "Settled" : expired ? "Awaiting settlement" : remaining ? `${remaining} more to take off` : full ? "Full" : "Minimum reached"}
              </p>
            </div>
            <div
              className="mt-[1vh] grid min-h-0 flex-1 gap-[0.5vw]"
              style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${Math.ceil(flock.maxBuyers / cols)}, minmax(0, 1fr))` }}
            >
              {Array.from({ length: flock.maxBuyers }, (_, i) => {
                const idx = i + 1;
                const filled = idx <= flock.n;
                const isMin = idx === flock.minBuyers;
                return (
                  <div
                    key={`${flock.id}-${idx}`}
                    className={`relative flex max-h-[9vh] min-h-0 items-center justify-center rounded-[14px] border text-[clamp(12px,0.9vw,18px)] tabular-nums ${
                      filled ? "border-white/15 bg-white/[0.12] text-white" : "border-white/[0.06] bg-white/[0.02] text-white/20"
                    } ${isMin ? "ring-2 ring-[#FFD60A]/70" : ""}`}
                  >
                    {filled ? (
                      <motion.span key={`f${idx}`} initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 22 }}>
                        #{idx}
                      </motion.span>
                    ) : (
                      <span>{idx}</span>
                    )}
                    {filled && drop && idx <= drop.earlier && (
                      <motion.span
                        key={drop.serial}
                        className="absolute inset-0 flex items-center justify-center rounded-[14px] bg-[#30D158] font-semibold text-black"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 1.4, delay: (idx % cols) * 0.03 }}
                      >
                        +$
                      </motion.span>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="mt-[0.8vh] flex items-center gap-2 text-[clamp(13px,1vw,20px)] text-white/50">
              <ShieldCheck size={18} strokeWidth={SW} className="text-[#30D158]" aria-hidden="true" />
              Under {flock.minBuyers} by the deadline? Full refund + <span className="text-[#FFD60A]">{fmtUsd(flock.bonusPerBuyer)} bonus</span>.
            </p>
          </section>

          {/* feed */}
          <section className="flex min-h-0 flex-col overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.06] p-[1.3vw] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl" aria-label="Live activity">
            <p className="flex items-center justify-between text-[clamp(16px,1.2vw,24px)] font-semibold tracking-tight">
              Activity
              <span className="flex items-center gap-1.5 text-[clamp(12px,0.85vw,16px)] font-normal text-[#30D158]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#30D158]" aria-hidden="true" /> Live
              </span>
            </p>
            <ul className="mt-[0.8vh] min-h-0 flex-1 overflow-hidden">
              <AnimatePresence initial={false}>
                {flock.feed.slice(0, 6).map((e) => (
                  <motion.li
                    key={e.id}
                    layout
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="flex items-start gap-2 border-b border-white/[0.06] py-[0.7vh] text-[clamp(13px,0.95vw,19px)] leading-snug text-white/75 last:border-b-0"
                  >
                    <Sparkles size={16} strokeWidth={SW} className="mt-1 shrink-0 text-[#836EF9]" aria-hidden="true" />
                    <span className="line-clamp-2">{e.text}</span>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </section>
        </div>

        {/* settled overlays */}
        <AnimatePresence>
          {flock.status !== "open" && (
            <motion.div
              key={flock.status}
              role="status"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/85 px-[6vw] text-center backdrop-blur-xl"
            >
              <motion.h2
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.15 }}
                className={`text-[clamp(64px,8vw,160px)] font-semibold leading-none tracking-[-0.04em] ${flock.status === "success" ? "text-white" : "text-[#FFD60A]"}`}
              >
                {flock.status === "success" ? "The flock flew." : `Everyone refunded + ${fmtUsd(flock.bonusPerBuyer)} bonus.`}
              </motion.h2>
              <p className="mt-[3vh] text-[clamp(20px,1.8vw,36px)] text-white/60">
                {flock.status === "success" ? (
                  <>
                    {flock.n} Ducks · final price <span className="tabular-nums text-white">{fmtUsd(flock.price)}</span> · <span className="text-[#30D158]">{fmtUsd(flock.totalRebated)} paid back</span>
                  </>
                ) : (
                  <>Didn&apos;t reach {flock.minBuyers}. Every Duck got their money back — and got paid for trying.</>
                )}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </MotionConfig>
  );
}
