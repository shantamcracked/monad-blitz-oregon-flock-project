"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { Area, CartesianGrid, ComposedChart, Line, ReferenceDot, ResponsiveContainer, XAxis, YAxis } from "recharts";
import confetti from "canvas-confetti";
import type { LiveBoardProps } from "@/lib/types";
import { fmtUsd } from "@/lib/flock-math";
import styles from "./LiveBoard.module.css";

const sparks = [[0, -31], [24, -21], [34, 1], [20, 24], [-4, 29], [-28, 13], [-26, -17]];

function CurveBeacon({ cx, cy, celebrate }: { cx?: number; cy?: number; celebrate: boolean }) {
  if (cx === undefined || cy === undefined) return null;
  return (
    <g transform={`translate(${cx} ${cy})`} aria-hidden="true">
      {celebrate && <>
        <circle className={styles.ripple} r="9" fill="none" stroke="#9fffe1" strokeWidth="1.5" />
        <circle className={`${styles.ripple} ${styles.echo}`} r="9" fill="none" stroke="#f9d695" />
        {sparks.map(([x, y], index) => (
          <path key={index} d="M0 -4 1.3 -1.3 4 0 1.3 1.3 0 4 -1.3 1.3 -4 0 -1.3 -1.3Z"
            className={styles.spark} fill={index % 2 ? "#a7ffe4" : "#ffdf9d"}
            style={{ "--spark-x": `${x}px`, "--spark-y": `${y}px`, animationDelay: `${index * 24}ms` } as React.CSSProperties} />
        ))}
      </>}
      <circle r="16" fill="#67efc0" opacity=".14" />
      <circle className={styles.beacon} r="7" fill="#b5ffe6" stroke="white" strokeWidth="2" />
    </g>
  );
}

export default function LiveBoard({ flock, joinUrl, blockTimeMs = 300 }: LiveBoardProps) {
  const reduced = useReducedMotion();
  const chartId = useId();
  const [now, setNow] = useState<number | null>(null);
  const [price, setPrice] = useState(flock.price);
  const [drop, setDrop] = useState<{ amount: number; serial: number; earlier: number } | null>(null);
  const previous = useRef({ id: flock.id, price: flock.price, n: flock.n });
  const displayed = useRef(flock.price);
  const celebrated = useRef<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const old = previous.current;
    previous.current = { id: flock.id, price: flock.price, n: flock.n };
    const falling = old.id === flock.id && old.price > flock.price;
    setDrop(falling ? { amount: old.price - flock.price, serial: Date.now(), earlier: old.n } : null);
    if (!falling || reduced) {
      displayed.current = flock.price;
      setPrice(flock.price);
      return;
    }
    const from = displayed.current;
    const start = performance.now();
    let frame: number;
    const tick = (time: number) => {
      const progress = Math.min(1, (time - start) / 600);
      displayed.current = from + (flock.price - from) * (1 - Math.pow(1 - progress, 3));
      setPrice(displayed.current);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [flock.id, flock.price, flock.n, reduced]);

  useEffect(() => {
    if (flock.status === "success" && celebrated.current !== flock.id) {
      celebrated.current = flock.id;
      if (!reduced) void confetti({ particleCount: 160, spread: 100, origin: { y: 0.35 }, colors: ["#9FCBFF", "#8BF1CD", "#FFDA98"], disableForReducedMotion: true });
    }
  }, [flock.id, flock.status, reduced]);

  const seconds = now === null ? null : Math.max(0, Math.ceil((flock.deadline - now) / 1000));
  const countdown = seconds === null ? "--:--" : `${seconds >= 3600 ? `${Math.floor(seconds / 3600)}:` : ""}${String(Math.floor(seconds / 60) % 60).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const remaining = Math.max(0, flock.minBuyers - flock.n);
  const curve = useMemo(() => flock.curve.map(point => ({
    ...point,
    reached: point.n <= flock.n ? point.price : null,
  })), [flock.curve, flock.n]);
  const currentPoint = curve.find(point => point.n === flock.n);
  const full = flock.n >= flock.maxBuyers;

  return (
    <main className={`${styles.board} bg-flock-ink text-white`}>
      <header className={styles.header}>
        <div className="min-w-0">
          <div className="text-flock-purple font-bold tracking-[0.2em] uppercase">🦆 Flock · Live board</div>
          <h1 className={styles.title}>{flock.title}</h1>
        </div>
        <div className={`${styles.network} rounded-full border border-flock-line`}>
          <motion.span className="inline-block h-3 w-3 rounded-full bg-flock-mint" animate={reduced ? {} : { opacity: [1, 0.3, 1] }} transition={{ duration: Math.max(100, blockTimeMs) / 1000, repeat: Infinity }} />
          Monad testnet · ~{blockTimeMs}ms blocks
        </div>
      </header>

      {flock.status !== "open" && <div role="status" className={`${styles.banner} ${flock.status === "success" ? "bg-flock-mint text-flock-ink" : "bg-flock-gold text-flock-ink"}`}>
        {flock.status === "success" ? "THE FLOCK FLEW 🦆" : `Didn't fill — everyone refunded + ${fmtUsd(flock.bonusPerBuyer)} bonus`}
      </div>}

      <div className={styles.layout}>
        <section className={`${styles.hero} ${styles.card} bg-flock-card`} aria-label="Current group price">
          <div className="flex items-center justify-between gap-4 text-white/75"><span>PRICE PER PERSON</span><span className="text-flock-mint">Better together</span></div>
          <div className={styles.priceRow}>
            <motion.div key={`${flock.id}-${flock.price}`} initial={false} animate={{ color: drop ? ["#3DF5A7", "#3DF5A7", "#ffffff"] : "#ffffff" }} transition={{ duration: reduced ? 0 : 1.2 }} className={`${styles.price} font-mono tabular-nums font-black`}>{fmtUsd(price)}</motion.div>
            <AnimatePresence>{drop && <motion.div key={drop.serial} className={styles.drop} initial={{ opacity: 1, y: 10, scale: 0.9 }} animate={{ opacity: [1, 1, 0], y: -40, scale: 1 }} transition={{ duration: reduced ? 0 : 2 }}>-{fmtUsd(drop.amount)} for everyone</motion.div>}</AnimatePresence>
          </div>
          <div className={styles.priceDetails}><span className="text-white/70">Alone: <s>{fmtUsd(flock.soloPrice)}</s></span><span>{flock.status !== "open" ? "Settled" : full ? "Flock is full" : <>Next duck pays: <strong className="text-flock-mint">{fmtUsd(flock.nextPrice)}</strong></>}</span></div>
          <div className={styles.chart} aria-label="Price falls as more ducks join">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={curve} margin={{ top: 17, right: 28, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id={`${chartId}-line`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#9ac5ff" />
                    <stop offset="100%" stopColor="#8bf1cd" />
                  </linearGradient>
                  <linearGradient id={`${chartId}-fill`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#75d9c2" stopOpacity={0.29} />
                    <stop offset="100%" stopColor="#75d9c2" stopOpacity={0.015} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#a8c7e5" strokeOpacity={0.17} strokeDasharray="3 6" />
                <XAxis dataKey="n" type="number" domain={[1, Math.max(2, flock.maxBuyers)]} allowDecimals={false} tickLine={false} axisLine={false} minTickGap={28} tick={{ fill: "#b6c9dc", fontSize: 20 }} />
                <YAxis tickFormatter={value => `$${value}`} tickLine={false} axisLine={false} width={76} tick={{ fill: "#b6c9dc", fontSize: 20 }} tickCount={3} />
                <Area type="monotone" dataKey="reached" fill={`url(#${chartId}-fill)`} stroke="none" isAnimationActive={false} />
                <Line type="monotone" dataKey="price" stroke="#81adf0" strokeOpacity={0.62} strokeDasharray="5 7" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="reached" className={styles.curveGlow} stroke={`url(#${chartId}-line)`} strokeWidth={5} strokeLinecap="round" dot={false} isAnimationActive={false} />
                {currentPoint && <ReferenceDot key={`${flock.id}-${flock.n}`} x={currentPoint.n} y={currentPoint.price} shape={<CurveBeacon celebrate={flock.status === "open" && !reduced} />} />}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between gap-3 text-white/75"><span>More friends, lower prices</span><span className="text-flock-mint">{fmtUsd(flock.totalRebated)} paid back</span></div>
        </section>

        <aside className={`${styles.qr} rounded-3xl bg-white text-flock-ink`}>
          <div className="font-black text-3xl">Good things split well.</div>
          <QRCodeSVG value={joinUrl} size={320} marginSize={4} level="M" className={styles.qrCode} title="Scan to join this flock" />
          <div className="font-black text-3xl">Scan to join</div>
          <p className="text-center">Email login · no wallet · no gas</p>
        </aside>

        <section className={`${styles.ducks} ${styles.card} bg-flock-card`}>
          <div className={styles.duckHeading}><strong>{flock.n} / {flock.maxBuyers} ducks</strong><span className="text-flock-gold">{flock.status !== "open" ? "Settled" : seconds === 0 ? "Awaiting settlement" : remaining ? `${remaining} more ducks to take off` : "Minimum reached ✓"}</span><span className="font-mono tabular-nums">{flock.status === "open" ? countdown : "Closed"}</span></div>
          <div className={styles.duckGrid} style={{ gridTemplateColumns: `repeat(${Math.min(flock.maxBuyers, flock.maxBuyers > 24 ? 20 : 12)}, minmax(0, 1fr))` }}>
            {Array.from({ length: flock.maxBuyers }, (_, i) => {
              const buyer = flock.buyers.find(b => b.index === i + 1);
              return <div key={`${flock.id}-${i}`} className={`${styles.slot} ${buyer ? "bg-flock-purple/25 border-flock-purple" : "border-dashed border-flock-line"}`}>
                {buyer ? <motion.span key={buyer.address} initial={reduced ? false : { scale: 0, y: 15 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 350, damping: 14 }}>🦆</motion.span> : <span className="text-white/25">·</span>}
                <span className={styles.duckNumber}>#{i + 1}</span>
                {i + 1 === flock.minBuyers && <span title={`Minimum: ${flock.minBuyers} ducks`} className={styles.minimum} />}
                {buyer && drop && buyer.index <= drop.earlier && <motion.span key={drop.serial} className={styles.coin} initial={{ opacity: 1, y: 0 }} animate={{ opacity: [1, 1, 0], y: -35 }} transition={{ duration: reduced ? 0 : 1.8 }}>+$</motion.span>}
              </div>;
            })}
          </div>
          <p className="text-white/75"><span className="text-flock-gold">Gold marker = minimum {flock.minBuyers}.</span> Miss it? Full refund + <span className="text-flock-gold">{fmtUsd(flock.bonusPerBuyer)} bonus</span>.</p>
        </section>

        <section className={`${styles.feed} ${styles.card} bg-flock-card`} aria-label="Live activity">
          <div className="flex justify-between"><strong>Live activity</strong><span className="text-flock-mint">● Live</span></div>
          <div className={styles.feedItems}>
            <AnimatePresence initial={false}>
              {flock.feed.slice(0, 6).map(event => <motion.div key={event.id} layout initial={{ opacity: 0, x: 35 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : 0.3 }} className={styles.event}>
                <span className="text-flock-mint">↗</span><p>{event.text}</p>
              </motion.div>)}
            </AnimatePresence>
          </div>
        </section>
      </div>
    </main>
  );
}
