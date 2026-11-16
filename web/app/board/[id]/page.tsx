"use client";
// OWNER: Shantam (wiring). Projector board. Visuals: components/board/LiveBoard.tsx (Teammate A).
// Admin mode: open /board/1?admin=YOUR_ADMIN_SECRET → demo controls:
//   Fill to buy  → simulated buyers join one by one (real on-chain joins) until the minimum is hit and it buys
//   Fail demo    → creates a 45s flock, 2 buyers join, deadline passes, everyone is refunded + bonus on-chain
//   Settle now   → seller closes / settles the current flock
import { use, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LiveBoard from "@/components/board/LiveBoard";
import { useFlock } from "@/lib/useFlock";
import { APP_URL } from "@/lib/config";
import { NotReady } from "@/components/shared/NotReady";
import { PurchaseBanner } from "@/components/shared/PurchaseBanner";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number(use(params).id);
  const search = useSearchParams();
  const router = useRouter();
  const admin = search.get("admin");
  const autoFail = search.get("demo") === "fail";
  const { flock, error, settlement, refresh } = useFlock(id, 500);
  const [msg, setMsg] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const stop = useRef(false);
  const flockRef = useRef(flock);
  flockRef.current = flock;

  const post = async (url: string, body: unknown) => {
    const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json", "x-admin-secret": admin || "" }, body: JSON.stringify(body) });
    const j = await r.json();
    if (!r.ok || j.error) throw new Error(j.error || `HTTP ${r.status}`);
    return j;
  };

  const settle = async () => {
    setMsg("Settling…");
    try {
      const j = await post("/api/settle", { id });
      setMsg(`✅ Settled ${j.hash.slice(0, 10)}…`);
      refresh();
    } catch (e) {
      setMsg(`❌ ${(e as Error).message}`);
    }
  };

  const botJoins = async (count: number) => {
    for (let i = 0; i < count && !stop.current; i++) {
      const f = flockRef.current;
      if (!f || f.status !== "open" || f.n >= f.maxBuyers) break;
      setMsg(`Duck #${f.n + 1} joining…`);
      try {
        await post("/api/demo", { action: "bot-join", id });
      } catch {
        await sleep(800); // flaky RPC hiccup → one retry with a fresh buyer
        await post("/api/demo", { action: "bot-join", id });
      }
      await refresh();
      await sleep(600); // let the price drop land on screen
    }
  };

  const fill = async () => {
    const f = flockRef.current;
    if (!f) return;
    stop.current = false;
    setRunning(true);
    try {
      await botJoins(Math.max(0, f.minBuyers - f.n));
      setMsg(null);
    } catch (e) {
      setMsg(`❌ ${(e as Error).message}`);
    } finally {
      setRunning(false);
    }
  };

  const startFail = async () => {
    setRunning(true);
    setMsg("Creating a 45-second flock…");
    try {
      const j = await post("/api/demo", { action: "fail-create", seconds: 45 });
      router.push(`/board/${j.id}?admin=${encodeURIComponent(admin || "")}&demo=fail`);
    } catch (e) {
      setMsg(`❌ ${(e as Error).message}`);
      setRunning(false);
    }
  };

  // Second half of the fail demo, on the new flock's board: 2 buyers join, wait out the deadline, settle → refunds.
  const autoRan = useRef(false);
  useEffect(() => {
    if (!autoFail || !admin || !flock || autoRan.current || flock.status !== "open") return;
    autoRan.current = true;
    (async () => {
      setRunning(true);
      try {
        try {
          await botJoins(2);
        } catch {
          /* a missed join just means fewer refunds — keep going to the refund */
        }
        for (;;) {
          const left = (flockRef.current?.deadline ?? 0) - Date.now();
          if (left <= -2500) break;
          setMsg(`Only ${flockRef.current?.n ?? 0} of ${flockRef.current?.minBuyers} — deadline in ${Math.max(0, Math.ceil(left / 1000))}s`);
          await sleep(500);
        }
        for (let tries = 0; tries < 6; tries++) {
          setMsg("Deadline passed — refunding everyone on-chain…");
          try {
            await post("/api/settle", { id });
            break;
          } catch (e) {
            if (tries === 5) throw e;
            await sleep(2000); // chain clock can lag a block or two behind ours
          }
        }
        await refresh();
        setMsg(null);
      } catch (e) {
        setMsg(`❌ ${(e as Error).message}`);
      } finally {
        setRunning(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFail, admin, flock?.id, flock?.status]);

  if (!flock) return <NotReady error={error} />;
  const base = APP_URL || (typeof window !== "undefined" ? window.location.origin : "");
  const btn = "min-h-10 rounded-full px-4 text-[13px] font-semibold transition active:scale-[0.97] disabled:opacity-40";
  return (
    <>
      <LiveBoard flock={flock} joinUrl={`${base}/f/${id}`} blockTimeMs={300} />
      {settlement && (
        <div className="pointer-events-none fixed inset-x-0 bottom-[5vh] z-50 flex justify-center px-6">
          <PurchaseBanner s={settlement} board className="pointer-events-auto" />
        </div>
      )}
      {admin && (
        <div className="fixed bottom-3 right-3 z-[60] flex max-w-[90vw] flex-wrap items-center justify-end gap-2 rounded-full border border-white/10 bg-black/70 p-1.5 text-white backdrop-blur-xl">
          {msg && <span className="px-2 text-[13px] text-white/70">{msg}</span>}
          {flock.status === "open" && (
            <>
              <button type="button" disabled={running} onClick={fill} className={`${btn} bg-[#30D158] text-black`}>
                Fill to buy ({Math.max(0, flock.minBuyers - flock.n)})
              </button>
              <button type="button" disabled={running} onClick={settle} className={`${btn} bg-white/15`}>
                Settle now
              </button>
            </>
          )}
          {running && !autoFail && (
            <button type="button" onClick={() => (stop.current = true)} className={`${btn} bg-white/15`}>
              Stop
            </button>
          )}
          <button type="button" disabled={running} onClick={startFail} className={`${btn} bg-[#FFD60A] text-black`}>
            Fail demo
          </button>
        </div>
      )}
    </>
  );
}
