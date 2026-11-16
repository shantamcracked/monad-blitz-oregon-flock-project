"use client";
import { useEffect, useState } from "react";
import LiveBoard from "@/components/board/LiveBoard";
import { useMockFlock } from "@/lib/mock";
import type { FlockState, FlockStatus } from "@/lib/types";

const chip = (on: boolean) => `min-h-9 rounded-full px-3 text-[13px] font-semibold capitalize transition ${on ? "bg-white/20 text-white" : "text-white/60 hover:text-white"}`;

function Demo({ large }: { large: boolean }) {
  const [settled, setSettled] = useState<FlockState | null>(null);
  const [status, setStatus] = useState<FlockStatus>("open");
  const [deadline] = useState(() => Date.now() + 47 * 60_000);
  const [joinUrl, setJoinUrl] = useState("https://example.com/f/1");
  useEffect(() => setJoinUrl(`${window.location.origin}/preview/join`), []);
  const { flock } = useMockFlock({ start: 2, everyMs: 2500, base: large ? { maxBuyers: 40, minBuyers: 10, fixedCost: 120, unitCost: 14, title: "OBG × Monad Blitz hoodie" } : {} });
  return (
    <>
      <LiveBoard flock={{ ...(settled ?? flock), deadline, status }} joinUrl={joinUrl} blockTimeMs={300} />
      <div className="fixed bottom-3 left-3 z-50 flex gap-1 rounded-full border border-white/10 bg-black/60 p-1 backdrop-blur-xl" aria-label="Preview status controls">
        {(["open", "success", "failed"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setSettled(value === "open" ? null : { ...flock });
              setStatus(value);
            }}
            aria-pressed={status === value}
            className={chip(status === value)}
          >
            {value}
          </button>
        ))}
      </div>
    </>
  );
}

export default function PreviewBoard() {
  const [large, setLarge] = useState(false);
  return (
    <>
      <Demo key={String(large)} large={large} />
      <button
        type="button"
        className="fixed bottom-3 right-3 z-50 min-h-9 rounded-full border border-white/10 bg-black/60 px-4 text-[13px] font-semibold text-white/70 backdrop-blur-xl hover:text-white"
        onClick={() => setLarge((v) => !v)}
      >
        {large ? "12-duck demo" : "40-duck demo"}
      </button>
    </>
  );
}
