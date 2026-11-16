"use client";
// OWNER: Teammate A (Board & Story). Shown after a flock settles (success or failure).
// Keep the props interface (ReceiptProps) exactly the same.
// Design: Apple Wallet pass — tall glass card with a perforation line.
import { useEffect } from "react";
import confetti from "canvas-confetti";
import { MotionConfig, motion } from "framer-motion";
import { ArrowUpRight, CheckCircle2, Clock3, ShieldCheck, Zap } from "lucide-react";
import type { ReceiptProps } from "@/lib/types";
import { fmtUsd } from "@/lib/flock-math";
import { StatRow } from "@/components/ui/StatRow";

const SW = 1.75;

function cleanTitle(title: string): string {
  return title.replace(/[\p{Extended_Pictographic}‍️]/gu, "").replace(/\s{2,}/g, " ").trim();
}

const HEAD = {
  success: { icon: CheckCircle2, color: "text-[#30D158]", title: "The flock flew.", sub: "Everyone paid the lowest price." },
  failed: { icon: ShieldCheck, color: "text-[#FFD60A]", title: "You got paid for trying.", sub: "It didn't fill — full refund plus a bonus." },
  pending: { icon: Clock3, color: "text-[#a796ff]", title: "Still flying.", sub: "Waiting for more Ducks or the deadline." },
} as const;

export default function Receipt({ variant, flock, me, txHash, explorerBaseUrl }: ReceiptProps) {
  useEffect(() => {
    if (variant === "success")
      void confetti({ particleCount: 160, spread: 90, origin: { y: 0.3 }, colors: ["#836EF9", "#30D158", "#FFFFFF", "#FFD60A"], disableForReducedMotion: true });
  }, [variant]);

  const saved = flock.soloPrice > 0 ? Math.round((1 - flock.price / flock.soloPrice) * 100) : 0;
  const h = HEAD[variant];
  const Icon = h.icon;

  return (
    <MotionConfig reducedMotion="user">
      <main className="relative min-h-[100dvh] w-full overflow-x-clip bg-[#0A0A0F] px-5 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] text-white">
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[#836EF9] opacity-25 blur-[120px]" aria-hidden="true" />

        <div className="relative mx-auto max-w-md">
          <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
            <Icon size={40} strokeWidth={SW} className={h.color} aria-hidden="true" />
            <h1 className="mt-4 text-[40px] font-semibold leading-[1.05] tracking-[-0.03em]">{h.title}</h1>
            <p className="mt-2 text-[17px] text-white/60">{h.sub}</p>
          </motion.header>

          <motion.section
            initial={{ opacity: 0, y: 40, rotateX: 8 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
            style={{ transformPerspective: 1200 }}
            className="relative mt-8 overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.06] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl"
            aria-label="Receipt"
          >
            {/* pass header */}
            <div className="bg-[linear-gradient(135deg,#6d5ae6_0%,#836EF9_50%,#4b3bb8_100%)] px-6 pb-6 pt-5">
              <div className="flex items-center justify-between text-[13px] font-semibold uppercase tracking-[0.16em] text-white/75">
                <span>Flock pass</span>
                {me.myIndex !== null && <span>Duck #{me.myIndex}</span>}
              </div>
              <p className="mt-3 text-[24px] font-semibold leading-tight tracking-tight [overflow-wrap:anywhere]">{cleanTitle(flock.title)}</p>
              <p className="mt-1 text-[15px] text-white/75">
                {flock.n} Ducks · {variant === "failed" ? "refunded" : variant === "success" ? "settled" : "open"}
              </p>
            </div>

            {/* perforation */}
            <div className="relative h-0" aria-hidden="true">
              <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-[#0A0A0F]" />
              <span className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-[#0A0A0F]" />
              <div className="mx-5 border-t-2 border-dashed border-white/15" />
            </div>

            <div className="px-6 py-3">
              <StatRow label="Ducks" value={flock.n} />
              {variant !== "failed" ? (
                <>
                  <StatRow label="Final price" value={fmtUsd(flock.price)} />
                  {me.paidAtJoin !== null && <StatRow label="You first paid" value={fmtUsd(me.paidAtJoin)} />}
                  {me.joined && <StatRow label="Rebated to you" value={`+${fmtUsd(me.rebatesSoFar)}`} tone="mint" />}
                  <StatRow label="Saved vs. going solo" value={`${saved}%`} tone="mint" />
                </>
              ) : (
                <>
                  <StatRow label="Refunded" value={fmtUsd(flock.price)} />
                  <StatRow label="Seller's bonus" value={`+${fmtUsd(flock.bonusPerBuyer)}`} tone="yellow" />
                  <StatRow label="Total back" value={fmtUsd(flock.price + flock.bonusPerBuyer)} tone="mint" />
                </>
              )}
            </div>
          </motion.section>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-2 text-[13px] text-white/70">
              <Zap size={14} strokeWidth={SW} className="text-[#836EF9]" aria-hidden="true" />
              Settled on Monad in ~0.6s
            </span>
            {txHash && (
              <a
                href={`${explorerBaseUrl}/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[44px] items-center gap-1 rounded-full px-2 text-[15px] font-semibold text-[#a796ff] hover:text-white"
              >
                View transaction <ArrowUpRight size={16} strokeWidth={SW} aria-hidden="true" />
              </a>
            )}
          </div>
        </div>
      </main>
    </MotionConfig>
  );
}
