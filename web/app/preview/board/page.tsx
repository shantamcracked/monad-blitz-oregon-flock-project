"use client";
import { useEffect, useState } from "react";
import LiveBoard from "@/components/board/LiveBoard";
import { useMockFlock } from "@/lib/mock";
import type { FlockState, FlockStatus } from "@/lib/types";

function Demo({ large }: { large: boolean }) {
  const [settled, setSettled] = useState<FlockState | null>(null);
  const [status, setStatus] = useState<FlockStatus>("open");
  const [deadline] = useState(() => Date.now() + 47 * 60_000);
  const [joinUrl, setJoinUrl] = useState("https://example.com/f/1");
  useEffect(() => setJoinUrl(`${window.location.origin}/preview/join`), []);
  const { flock } = useMockFlock({ start: 2, everyMs: 2500, base: large ? { maxBuyers: 40, minBuyers: 10, fixedCost: 120, unitCost: 14, title: "OBG × Monad Blitz hoodie" } : {} });
  return <>
    <LiveBoard flock={{ ...(settled ?? flock), deadline, status }} joinUrl={joinUrl} blockTimeMs={300} />
    <div className="fixed bottom-1 left-1 z-50 flex gap-1 rounded-lg bg-flock-ink px-2 text-xs text-white/80" aria-label="Preview status controls">
      {(["open", "success", "failed"] as const).map(value => <button key={value} onClick={() => { setSettled(value === "open" ? null : { ...flock }); setStatus(value); }} aria-pressed={status === value} className="px-2 py-1 hover:text-flock-mint">{value}</button>)}
    </div>
  </>;
}

export default function PreviewBoard() {
  const [large, setLarge] = useState(false);
  return <><Demo key={String(large)} large={large} /><button className="fixed bottom-1 right-1 z-50 rounded-lg bg-flock-ink px-3 py-1 text-xs text-white/80" onClick={() => setLarge(value => !value)}>{large ? "12-duck demo" : "40-duck demo"}</button></>;
}
