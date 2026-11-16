"use client";
// OWNER: Teammate B (Phone & Create). Phone join screen.
// Keep the props interface (JoinScreenProps) exactly the same.
// Design: iOS native app feel — large title, Wallet-style pass, sticky glass CTA bar.
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Clock3, LogOut, ShieldCheck, Sparkles, TrendingDown, Users, XCircle } from "lucide-react";
import type { JoinScreenProps } from "@/lib/types";
import { fmtUsd } from "@/lib/flock-math";
import { GlassCard } from "@/components/ui/GlassCard";
import { PillButton } from "@/components/ui/PillButton";
import { StatRow } from "@/components/ui/StatRow";
import { ProgressRail } from "@/components/ui/ProgressRail";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Countdown, useNow } from "@/components/ui/Countdown";
import { Toast } from "@/components/ui/Toast";

const SW = 1.75;

function cleanTitle(title: string): string {
  return title.replace(/[\p{Extended_Pictographic}‍️]/gu, "").replace(/\s{2,}/g, " ").trim();
}

/** iOS alert-style status card. */
function Alert({ tone, icon, title, body }: { tone: "mint" | "yellow" | "red" | "neutral"; icon: React.ReactNode; title: string; body?: React.ReactNode }) {
  const color = { mint: "text-[#30D158]", yellow: "text-[#FFD60A]", red: "text-[#FF453A]", neutral: "text-white/70" }[tone];
  return (
    <GlassCard strong className="px-5 py-5 text-center" role={tone === "red" ? "alert" : "status"}>
      <div className={`mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.08] ${color}`}>{icon}</div>
      <p className="mt-3 text-[17px] font-semibold tracking-tight">{title}</p>
      {body && <p className="mt-1 text-[15px] leading-snug text-white/60 [overflow-wrap:anywhere]">{body}</p>}
    </GlassCard>
  );
}

export default function JoinScreen({ flock, me, loggedIn, busy, error, lastRebateToast, onLogin, onJoin, onLogout }: JoinScreenProps) {
  const reduced = useReducedMotion();
  const now = useNow();
  const expired = now !== null && now >= flock.deadline;
  const full = flock.n >= flock.maxBuyers;
  const open = flock.status === "open" && !expired && !full;
  const canJoin = open && !me.joined;
  const needed = Math.max(0, flock.minBuyers - flock.n);
  const title = cleanTitle(flock.title);

  // iOS notification banner for rebates (auto-hide after 2.5s, haptic tick).
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    if (!lastRebateToast) {
      setToast(null);
      return;
    }
    setToast(lastRebateToast);
    try {
      const ua = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation;
      if (!ua || ua.hasBeenActive) navigator.vibrate?.(60);
    } catch {
      /* vibrate unsupported */
    }
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [lastRebateToast]);

  // Shimmer the pass when rebates grow.
  const prevRebate = useRef(me.rebatesSoFar);
  const [shine, setShine] = useState(0);
  useEffect(() => {
    if (me.rebatesSoFar > prevRebate.current + 0.0001) setShine((s) => s + 1);
    prevRebate.current = me.rebatesSoFar;
  }, [me.rebatesSoFar]);

  const shownPrice = flock.n ? flock.price : flock.soloPrice;

  return (
    <MotionConfig reducedMotion="user">
    <main className="relative min-h-[100dvh] w-full overflow-x-clip bg-[#0A0A0F] text-white">
      <Toast message={toast} icon={<TrendingDown size={18} strokeWidth={SW} />} title="Flock · money back" />

      {/* ambient glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-[#836EF9] opacity-25 blur-[120px]" aria-hidden="true" />

      <div className="relative mx-auto max-w-md px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[calc(9rem+env(safe-area-inset-bottom))]">
        {/* nav bar */}
        <div className="flex min-h-[44px] items-center justify-between">
          <span className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#836EF9]">Flock</span>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[13px] text-white/80 backdrop-blur-xl">
              <Clock3 size={14} strokeWidth={SW} aria-hidden="true" />
              <Countdown deadline={flock.deadline} endedLabel="Closed" />
            </span>
            {loggedIn && onLogout && (
              <button type="button" onClick={onLogout} aria-label="Sign out" className="flex h-11 w-11 items-center justify-center rounded-full text-white/50 hover:text-white">
                <LogOut size={18} strokeWidth={SW} />
              </button>
            )}
          </div>
        </div>

        {/* large title */}
        <h1 className="mt-2 text-[34px] font-semibold leading-[1.1] tracking-[-0.02em] [overflow-wrap:anywhere]">{title}</h1>

        {/* hero image */}
        <div className="relative mt-5 overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-[#1b1730] via-[#121218] to-[#0c0c10] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(131,110,249,0.35),transparent_60%)]" aria-hidden="true" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={flock.imageUrl || "/img/van.svg"} alt="" className="relative mx-auto h-40 w-auto object-contain p-6" />
        </div>

        {/* price */}
        <section className="mt-7" aria-label="Price">
          <p className="text-[15px] text-white/50">{me.joined ? "Everyone pays now" : open ? "You'd pay" : "Price per person"}</p>
          <div className="mt-1 text-[64px] font-semibold leading-none tracking-[-0.04em]">
            <AnimatedNumber value={me.joined || !open ? shownPrice : flock.nextPrice} />
          </div>
          <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[15px]">
            <span className="text-white/30 line-through decoration-white/30">alone {fmtUsd(flock.soloPrice)}</span>
            {flock.prevPrice !== null && flock.prevPrice > flock.price && (
              <span className="text-white/50">
                was <span className="tabular-nums">{fmtUsd(flock.prevPrice)}</span>
              </span>
            )}
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-[15px] text-[#30D158]">
            <TrendingDown size={16} strokeWidth={SW} aria-hidden="true" />
            Drops every time someone joins
            {open && <span className="text-white/40">· now {fmtUsd(shownPrice)}</span>}
          </p>
        </section>

        {/* progress */}
        <GlassCard className="mt-6 px-5 py-5">
          <ProgressRail n={flock.n} max={flock.maxBuyers} min={flock.minBuyers} />
          <p className="mt-3 flex items-center gap-1.5 text-[15px] text-white/70">
            <Users size={16} strokeWidth={SW} aria-hidden="true" />
            {flock.status !== "open" ? "Settled" : needed ? `${needed} more to take off` : full ? "Flock is full" : "Minimum reached — it's flying"}
          </p>
        </GlassCard>

        {/* status / error alerts */}
        <div className="mt-4 space-y-4">
          {error && <Alert tone="red" icon={<AlertTriangle size={22} strokeWidth={SW} />} title="Couldn't join" body={error} />}
          {flock.status === "success" && (
            <Alert tone="mint" icon={<CheckCircle2 size={22} strokeWidth={SW} />} title="The flock flew." body={`Final price ${fmtUsd(flock.price)} per person.`} />
          )}
          {flock.status === "failed" && (
            <Alert
              tone="yellow"
              icon={<XCircle size={22} strokeWidth={SW} />}
              title="Didn't fill — everyone refunded"
              body={`Full refund plus a ${fmtUsd(flock.bonusPerBuyer)} bonus for trying.`}
            />
          )}
          {flock.status === "open" && expired && (
            <Alert tone="neutral" icon={<Clock3 size={22} strokeWidth={SW} />} title="Deadline passed" body="Awaiting settlement on Monad." />
          )}
          {flock.status === "open" && !expired && full && !me.joined && (
            <Alert tone="neutral" icon={<Users size={22} strokeWidth={SW} />} title="This flock is full" body="Every spot has been taken." />
          )}
        </div>

        {/* Wallet-style pass */}
        <AnimatePresence>
          {me.joined && (
            <motion.section
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative mt-6 overflow-hidden rounded-[28px] border border-white/15 bg-[linear-gradient(135deg,#6d5ae6_0%,#836EF9_45%,#4b3bb8_100%)] p-6 shadow-[0_30px_60px_-20px_rgba(131,110,249,0.6),inset_0_1px_0_rgba(255,255,255,0.25)]"
              aria-label="Your pass"
            >
              {!reduced && shine > 0 && (
                <motion.div
                  key={shine}
                  className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                  initial={{ x: "0%" }}
                  animate={{ x: "400%" }}
                  transition={{ duration: 1.1, ease: "easeOut" }}
                  aria-hidden="true"
                />
              )}
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-white/70">Flock pass</p>
                  <p className="mt-1 text-[28px] font-semibold tracking-tight">Duck #{me.myIndex ?? "—"}</p>
                </div>
                <span className="rounded-full bg-white/20 px-3 py-1 text-[13px] font-semibold backdrop-blur">{title.length > 18 ? `${title.slice(0, 18)}…` : title}</span>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[13px] text-white/70">You paid</p>
                  <p className="text-[20px] font-semibold tabular-nums tracking-tight">{me.paidAtJoin !== null ? fmtUsd(me.paidAtJoin) : "—"}</p>
                </div>
                <div>
                  <p className="text-[13px] text-white/70">Now everyone pays</p>
                  <p className="text-[20px] font-semibold tabular-nums tracking-tight">{fmtUsd(flock.price)}</p>
                </div>
              </div>
              <div className="mt-5 border-t border-dashed border-white/30 pt-4">
                <p className="text-[13px] text-white/80">Rebates so far</p>
                <p className="text-[34px] font-semibold leading-tight tracking-tight text-[#b9ffcb]">
                  +<AnimatedNumber value={me.rebatesSoFar} />
                </p>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* guarantee */}
        <GlassCard className="mt-6 flex gap-4 px-5 py-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#30D158]/15 text-[#30D158]">
            <ShieldCheck size={22} strokeWidth={SW} aria-hidden="true" />
          </span>
          <div>
            <p className="text-[17px] font-semibold tracking-tight">You can&apos;t lose</p>
            <p className="mt-1 text-[15px] leading-snug text-white/60">
              If fewer than {flock.minBuyers} people join by the deadline, you get a full refund plus a{" "}
              <span className="font-semibold text-[#FFD60A]">{fmtUsd(flock.bonusPerBuyer)} bonus</span>.
            </p>
          </div>
        </GlassCard>

        {/* stats */}
        <GlassCard className="mt-4 px-5 py-1">
          <StatRow label="Next person pays" value={fmtUsd(flock.nextPrice)} />
          <StatRow label="Paid back to everyone" value={`+${fmtUsd(flock.totalRebated)}`} tone="mint" />
          {loggedIn && <StatRow label="Your balance" value={fmtUsd(me.balance)} />}
        </GlassCard>

        {/* activity */}
        {flock.feed.length > 0 && (
          <section className="mt-8" aria-label="Activity">
            <h2 className="text-[22px] font-semibold tracking-tight">Activity</h2>
            <GlassCard className="mt-3 px-5 py-1">
              <ul>
                <AnimatePresence initial={false}>
                  {flock.feed.slice(0, 8).map((e) => (
                    <motion.li
                      key={e.id}
                      layout
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex min-h-[44px] items-start gap-3 border-b border-white/[0.08] py-3 last:border-b-0"
                    >
                      <Sparkles size={16} strokeWidth={SW} className="mt-0.5 shrink-0 text-[#836EF9]" aria-hidden="true" />
                      <span className="text-[15px] leading-snug text-white/80 [overflow-wrap:anywhere]">{e.text}</span>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </GlassCard>
          </section>
        )}
      </div>

      {/* sticky CTA bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0A0A0F]/70 px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-2xl">
        <div className="mx-auto max-w-md">
          {me.joined ? (
            <div className="flex min-h-[56px] items-center justify-center gap-2 rounded-[22px] bg-white/[0.06] text-[17px] font-semibold">
              <CheckCircle2 size={20} strokeWidth={SW} className="text-[#30D158]" aria-hidden="true" />
              You&apos;re in · Duck #{me.myIndex}
            </div>
          ) : !canJoin ? (
            <PillButton variant="secondary" disabled className="w-full">
              {flock.status === "success" ? "The flock flew" : flock.status === "failed" ? "Refunded + bonus" : full ? "Flock is full" : "Joining closed"}
            </PillButton>
          ) : !loggedIn ? (
            <PillButton onClick={onLogin} className="w-full">
              Sign in with email to join
            </PillButton>
          ) : (
            <PillButton onClick={onJoin} loading={busy} loadingLabel="Joining… ~1s on Monad" className="w-full">
              Join at {fmtUsd(flock.nextPrice)}
            </PillButton>
          )}
          <p className="mt-2 text-center text-[12px] text-white/40">Email login · no wallet · no gas</p>
        </div>
      </div>
    </main>
    </MotionConfig>
  );
}
