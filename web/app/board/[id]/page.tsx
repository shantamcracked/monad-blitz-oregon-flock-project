"use client";
// OWNER: Shantam (wiring). Projector board. Visuals: components/board/LiveBoard.tsx (Teammate A).
// Admin mode: open /board/3?admin=YOUR_ADMIN_SECRET → shows a small "Settle now" button (for the live fail demo).
import { use, useState } from "react";
import { useSearchParams } from "next/navigation";
import LiveBoard from "@/components/board/LiveBoard";
import { useFlock } from "@/lib/useFlock";
import { APP_URL } from "@/lib/config";
import { NotReady } from "@/components/shared/NotReady";
import { PurchaseBanner } from "@/components/shared/PurchaseBanner";

export default function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number(use(params).id);
  const admin = useSearchParams().get("admin");
  const { flock, error, settlement } = useFlock(id, 500);
  const [msg, setMsg] = useState<string | null>(null);
  if (!flock) return <NotReady error={error} />;
  const base = APP_URL || (typeof window !== "undefined" ? window.location.origin : "");
  const settle = async () => {
    setMsg("settling…");
    const r = await fetch("/api/settle", { method: "POST", headers: { "content-type": "application/json", "x-admin-secret": admin || "" }, body: JSON.stringify({ id }) });
    const j = await r.json();
    setMsg(j.error ? `❌ ${j.error}` : `✅ settled ${j.hash.slice(0, 10)}…`);
  };
  return (
    <>
      <LiveBoard flock={flock} joinUrl={`${base}/f/${id}`} blockTimeMs={300} />
      {settlement && (
        <div className="pointer-events-none fixed inset-x-0 bottom-[5vh] z-50 flex justify-center px-6">
          <PurchaseBanner s={settlement} board className="pointer-events-auto" />
        </div>
      )}
      {admin && flock.status === "open" && (
        <div className="fixed bottom-3 right-3 flex items-center gap-2 rounded-xl bg-black/70 p-2 text-xs">
          <button onClick={settle} className="rounded-lg bg-flock-gold px-3 py-2 font-bold text-black">Settle now</button>
          {msg && <span>{msg}</span>}
        </div>
      )}
    </>
  );
}
