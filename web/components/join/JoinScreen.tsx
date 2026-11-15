"use client";
// OWNER: Teammate B (Phone & Create). The screen every audience member sees after scanning the QR.
// Keep the props interface (JoinScreenProps) exactly the same.
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Clock, Loader2, ShieldCheck, Sparkles, TriangleAlert, Users } from "lucide-react";
import type { JoinScreenProps } from "@/lib/types";
import { fmtUsd } from "@/lib/flock-math";

/* ───────────────────────── helpers ───────────────────────── */

/** Ticks once per second on the client only (avoids SSR hydration mismatch). */
function useNow(): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function fmtCountdown(ms: number): string {
  if (ms <= 0) return "0:00";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

/** Animates a number from its previous value to `value`. */
function useCountUp(value: number, durationMs = 700): number {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  useEffect(() => {
    const from = fromRef.current;
    if (from === value) return;
    let raf = 0;
    const start = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = from + (value - from) * eased;
      fromRef.current = v;
      setDisplay(v);
      if (p < 1) raf = requestAnimationFrame(step);
      else fromRef.current = value;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, durationMs]);
  return display;
}

/* ───────────────────────── sub-components ───────────────────────── */

function Header({ flock, now }: Pick<JoinScreenProps, "flock"> & { now: number | null }) {
  const [imgOk, setImgOk] = useState(true);
  const pct = Math.min(100, (flock.n / Math.max(1, flock.maxBuyers)) * 100);
  const minPct = Math.min(100, (flock.minBuyers / Math.max(1, flock.maxBuyers)) * 100);
  const reachedMin = flock.n >= flock.minBuyers;
  const left = now === null ? null : flock.deadline - now;
  const urgent = left !== null && left < 5 * 60_000;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white/90 shadow-sm">
      <div className="relative h-36 w-full bg-gradient-to-br from-sky-100 via-white to-slate-100">
        {imgOk && flock.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={flock.imageUrl} alt="" className="h-full w-full object-cover object-[center_35%]" onError={() => setImgOk(false)} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-white from-10% via-white/50 via-35% to-transparent" />
        {flock.status === "open" && (
          <div
            className={`absolute right-3 top-3 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold tabular-nums backdrop-blur ${
              urgent ? "bg-rose-700 text-white" : "border border-slate-200 bg-white/90 text-slate-950 shadow-sm"
            }`}
          >
            <Clock size={14} aria-hidden />
            <span className="tabular">{left === null ? "--:--" : fmtCountdown(left)}</span>
          </div>
        )}
      </div>
      <div className="px-5 pb-5 pt-1">
        <h1 className="text-2xl font-semibold leading-tight tracking-tight [overflow-wrap:anywhere]">{flock.title}</h1>
        <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
          <Users size={14} aria-hidden />
          <span className="tabular">
            <b className="text-slate-950">{flock.n}</b> {flock.n === 1 ? "duck" : "ducks"} in · min {flock.minBuyers} · max {flock.maxBuyers}
          </span>
        </div>
        <div className="relative mt-3 h-2 w-full rounded-full bg-slate-200" role="progressbar" aria-valuemin={0} aria-valuemax={flock.maxBuyers} aria-valuenow={flock.n}>
          <motion.div
            className={`h-full rounded-full ${reachedMin ? "bg-emerald-600" : "bg-sky-600"}`}
            initial={false}
            animate={{ width: `${pct}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
          <div className="absolute -top-1 h-4 w-0.5 rounded bg-amber-500" style={{ left: `calc(${minPct}% - 1px)` }} title={`Minimum: ${flock.minBuyers}`} />
        </div>
        <div className="mt-1.5 text-xs text-slate-600">
          {reachedMin ? (
            <span className="font-medium text-emerald-800">Minimum reached — this flock is flying 🦆</span>
          ) : (
            <span>
              {flock.minBuyers - flock.n} more {flock.minBuyers - flock.n === 1 ? "duck" : "ducks"} to reach the minimum
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function JoinedBadge({ flock, me }: Pick<JoinScreenProps, "flock" | "me">) {
  const rebate = useCountUp(Math.max(0, me.rebatesSoFar));
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="rounded-xl border border-emerald-200 bg-white/90 p-5 shadow-sm"
    >
      <div className="inline-block rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">You&apos;re in</div>
      <div className="mt-2 text-3xl font-semibold tracking-tight">You&apos;re Duck #{me.myIndex ?? "?"} 🦆</div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="text-xs text-slate-600">You paid</div>
          <div className="tabular text-xl font-semibold tabular-nums">{fmtUsd(me.paidAtJoin ?? 0)}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="text-xs text-slate-600">Now everyone pays</div>
          <motion.div
            key={flock.price}
            initial={{ scale: 1.2, color: "#047857" }}
            animate={{ scale: 1, color: "#020617" }}
            transition={{ duration: 0.6 }}
            className="tabular origin-left text-xl font-semibold tabular-nums"
          >
            {fmtUsd(flock.price)}
          </motion.div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-4">
        <div className="text-sm text-slate-700">Rebates so far</div>
        <motion.div
          key={me.rebatesSoFar}
          initial={{ scale: 1.15 }}
          animate={{ scale: 1 }}
          className="tabular text-3xl font-bold tabular-nums text-emerald-800"
        >
          +{fmtUsd(rebate)}
        </motion.div>
      </div>
      <div className="mt-3 text-xs text-slate-600">Every new duck lowers your price and sends you the difference — instantly.</div>
    </motion.div>
  );
}

function StatusCard({ flock }: Pick<JoinScreenProps, "flock">) {
  const flew = flock.status === "success";
  return (
    <div className={`rounded-xl border p-5 text-center ${flew ? "border-emerald-200 bg-white/90 shadow-sm" : "border-amber-200 bg-white/90 shadow-sm"}`}>
      <div className="text-4xl">{flew ? "🎉" : "🛟"}</div>
      <div className={`mt-2 text-xl font-semibold ${flew ? "text-emerald-800" : "text-amber-800"}`}>
        {flew ? "This flock flew!" : "Refunded + bonus"}
      </div>
      <div className="mt-1 text-sm text-slate-600">
        {flew
          ? `Final price ${fmtUsd(flock.price)} with ${flock.n} ducks.`
          : `It didn't reach ${flock.minBuyers} ducks — every buyer got a full refund + ${fmtUsd(flock.bonusPerBuyer)} bonus.`}
      </div>
      <a
        href={`/receipt/${flock.id}`}
        className="mt-4 flex min-h-12 w-full items-center justify-center rounded-lg border border-sky-200 bg-white text-base font-semibold text-sky-800 hover:bg-sky-50 active:scale-[0.98]"
      >
        View your receipt →
      </a>
    </div>
  );
}

function HowItWorks() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-slate-200 bg-white/90 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex min-h-12 w-full items-center justify-between px-4 text-left text-sm font-semibold"
      >
        How does this work?
        <ChevronDown size={18} aria-hidden className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden px-4 text-sm text-slate-600"
          >
            <li className="flex gap-2 pb-2">
              <span>💸</span>
              <span>
                <b className="text-slate-950">Price = setup cost ÷ ducks + per-unit cost.</b> More ducks, lower price.
              </span>
            </li>
            <li className="flex gap-2 pb-2">
              <span>⚡</span>
              <span>
                <b className="text-slate-950">Every join rebates everyone instantly</b> — earlier ducks get the difference back in the same Monad block.
              </span>
            </li>
            <li className="flex gap-2 pb-4">
              <span>🛡</span>
              <span>
                <b className="text-slate-950">If it fails, you get a full refund + a bonus</b> paid by the seller.
              </span>
            </li>
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ───────────────────────── main ───────────────────────── */

export default function JoinScreen({ flock, me, loggedIn, busy, error, lastRebateToast, onLogin, onJoin, onLogout }: JoinScreenProps) {
  const now = useNow();
  const closed = flock.status !== "open";
  const full = flock.n >= flock.maxBuyers;
  const pastDeadline = now !== null && flock.deadline <= now;

  // Toast: show whenever lastRebateToast changes to a new non-null value, auto-hide after 2.5s.
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    if (!lastRebateToast) {
      setToast(null); // source cleared → hide now (otherwise the cleanup below would cancel the hide timer)
      return;
    }
    setToast(lastRebateToast);
    try {
      // Chrome blocks (and logs a console error for) vibrate before the user has tapped the page.
      const ua = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation;
      if (!ua || ua.hasBeenActive) navigator.vibrate?.(60);
    } catch {
      /* vibrate unsupported */
    }
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [lastRebateToast]);

  const canJoin = !closed && !full && !pastDeadline;

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col overflow-x-hidden bg-[#f4f7fb] bg-[radial-gradient(ellipse_at_top_left,#e2efff,transparent_55%)] px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-slate-950">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-lg font-semibold tracking-tight"><span className="rounded-lg bg-sky-300/10 p-1.5 text-sky-800">🦆</span>Flock</div>
        {loggedIn && onLogout && (
          <button type="button" onClick={onLogout} className="min-h-12 px-2 text-sm text-slate-600 underline-offset-4 hover:text-slate-950 hover:underline">
            Sign out
          </button>
        )}
      </div>

      <Header flock={flock} now={now} />

      <div className="mt-4 space-y-4">
        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            <TriangleAlert size={18} className="mt-0.5 shrink-0" aria-hidden />
            <span className="[overflow-wrap:anywhere]">{error}</span>
          </div>
        )}

        {me.joined && <JoinedBadge flock={flock} me={me} />}

        {closed ? (
          <StatusCard flock={flock} />
        ) : (
          !me.joined && (
            <div className="rounded-xl border border-slate-200 bg-white/90 p-5 shadow-sm">
              <div className="text-sm text-slate-600">{canJoin ? "Join at" : full ? "This flock is full" : "Deadline passed"}</div>
              <motion.div
                key={flock.nextPrice}
                initial={{ scale: 1.12, color: "#047857" }}
                animate={{ scale: 1, color: "#020617" }}
                transition={{ duration: 0.6 }}
                className="tabular mt-1 origin-left text-6xl font-bold leading-none tracking-tight tabular-nums"
              >
                {fmtUsd(flock.nextPrice)}
              </motion.div>
              <div className="mt-2 text-sm text-slate-600">
                Alone it would be <span className="tabular-nums line-through decoration-rose-600/80">{fmtUsd(flock.soloPrice)}</span>
              </div>

              <button
                type="button"
                onClick={loggedIn ? onJoin : onLogin}
                disabled={busy || (loggedIn && !canJoin)}
                aria-busy={busy}
                className="mt-5 flex min-h-16 w-full items-center justify-center gap-2 rounded-xl bg-sky-800 px-4 py-4 text-xl font-semibold text-white shadow-sm hover:bg-sky-900 transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? (
                  <>
                    <Loader2 size={22} className="animate-spin" aria-hidden />
                    Joining… ~1s on Monad
                  </>
                ) : loggedIn ? (
                  `Join at ${fmtUsd(flock.nextPrice)}`
                ) : (
                  "Sign in with email to join"
                )}
              </button>
              {!loggedIn && <div className="mt-2 text-center text-xs text-slate-600">No wallet or gas needed.</div>}
            </div>
          )
        )}

        <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-slate-700">
          <ShieldCheck size={22} className="shrink-0 text-amber-700" aria-hidden />
          <div>
            If this flock doesn&apos;t reach <b className="text-slate-950">{flock.minBuyers}</b> by the deadline, you get a{" "}
            <b className="text-amber-800">full refund + {fmtUsd(flock.bonusPerBuyer)} bonus</b>. Joining can&apos;t lose.
          </div>
        </div>

        <HowItWorks />
      </div>

      <div className="mt-auto pt-6 text-center text-xs text-slate-500">
        {loggedIn ? <>Test wallet balance <span className="tabular tabular-nums">{fmtUsd(me.balance)}</span> · </> : null}
        Monad testnet
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast}
            role="status"
            aria-live="polite"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-md items-center gap-2 rounded-xl bg-emerald-800 px-4 py-3 font-semibold text-white shadow-lg"
          >
            <Sparkles size={18} className="shrink-0" aria-hidden />
            <span className="[overflow-wrap:anywhere]">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
