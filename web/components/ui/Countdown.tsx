"use client";
import { useEffect, useState } from "react";

/** Ticks on the client only (avoids SSR hydration mismatch). */
export function useNow(intervalMs = 1000): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

export function fmtCountdown(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor(s / 60) % 60;
  const sec = s % 60;
  return `${h ? `${h}:` : ""}${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

/** Live mm:ss / h:mm:ss until the deadline; shows `endedLabel` once it passes. */
export function Countdown({ deadline, className = "", endedLabel = "Ended" }: { deadline: number; className?: string; endedLabel?: string }) {
  const now = useNow();
  const left = now === null ? null : deadline - now;
  return <span className={`tabular-nums ${className}`}>{left === null ? "--:--" : left <= 0 ? endedLabel : fmtCountdown(left)}</span>;
}

export default Countdown;
