"use client";
// OWNER: Teammate A (Board & Story). Home page — an apple.com product page.
// Keep the props interface (LandingProps) exactly the same.
import Link from "next/link";
import { MotionConfig, motion } from "framer-motion";
import { ArrowRight, Bus, CircleDollarSign, Plus, Shirt, ShieldCheck, TrendingDown, Trophy, Users, Utensils, type LucideIcon } from "lucide-react";
import type { FlockState, LandingProps } from "@/lib/types";
import { fmtUsd } from "@/lib/flock-math";
import { makeMockFlock, useMockFlock } from "@/lib/mock";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { GlassCard } from "@/components/ui/GlassCard";
import { PhoneFrame } from "@/components/ui/PhoneFrame";
import { PillButton } from "@/components/ui/PillButton";
import { ProgressRail } from "@/components/ui/ProgressRail";

const SW = 1.75;
const reveal = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { type: "spring", stiffness: 300, damping: 30 },
} as const;

function cleanTitle(title: string): string {
  return title.replace(/[\p{Extended_Pictographic}‍️]/gu, "").replace(/\s{2,}/g, " ").trim();
}

function statusOf(f: FlockState): { label: string; tone: string } {
  if (f.status === "success") return { label: "Flew", tone: "bg-[#30D158]/15 text-[#30D158]" };
  if (f.status === "failed") return { label: "Refunded", tone: "bg-[#FFD60A]/15 text-[#FFD60A]" };
  if (f.n >= f.maxBuyers) return { label: "Full", tone: "bg-white/10 text-white/70" };
  if (f.n >= f.minBuyers) return { label: "Flying", tone: "bg-[#30D158]/15 text-[#30D158]" };
  return { label: "Filling", tone: "bg-[#836EF9]/20 text-[#b5a8ff]" };
}

/* ── phone screen mockups (mock data only) ── */

const MOCK_PASS = makeMockFlock(7);

function PassScreen() {
  return (
    <div className="min-h-full bg-[#0A0A0F] px-6 pt-16 text-white">
      <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#836EF9]">Flock</p>
      <p className="mt-2 text-[32px] font-semibold leading-tight tracking-tight">Van to PDX</p>
      <div className="mt-8 rounded-[28px] bg-[linear-gradient(135deg,#6d5ae6_0%,#836EF9_45%,#4b3bb8_100%)] p-6 shadow-[0_30px_60px_-20px_rgba(131,110,249,0.6)]">
        <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-white/70">Flock pass</p>
        <p className="mt-1 text-[30px] font-semibold tracking-tight">You&apos;re Duck #4</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div>
            <p className="text-[13px] text-white/70">You paid</p>
            <p className="text-[20px] font-semibold tabular-nums">{fmtUsd(75)}</p>
          </div>
          <div>
            <p className="text-[13px] text-white/70">Now everyone pays</p>
            <p className="text-[20px] font-semibold tabular-nums">{fmtUsd(MOCK_PASS.price)}</p>
          </div>
        </div>
        <div className="mt-5 border-t border-dashed border-white/30 pt-4">
          <p className="text-[13px] text-white/80">Money back so far</p>
          <p className="text-[40px] font-semibold tracking-tight text-[#b9ffcb]">+$25.00</p>
        </div>
      </div>
      <div className="mt-6 rounded-[22px] border border-white/10 bg-white/[0.06] p-4">
        <p className="flex items-center gap-2 text-[15px] text-[#30D158]">
          <ShieldCheck size={18} strokeWidth={SW} /> Full refund + bonus if it doesn&apos;t fill
        </p>
      </div>
    </div>
  );
}

function PriceScreen() {
  const { flock } = useMockFlock({ start: 3, everyMs: 2200 });
  return (
    <div className="min-h-full bg-black px-6 pt-16 text-white">
      <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#836EF9]">Live</p>
      <p className="mt-2 text-[28px] font-semibold tracking-tight">Price per person</p>
      <div className="mt-6 text-[76px] font-semibold leading-none tracking-[-0.04em] [text-shadow:0_0_50px_rgba(131,110,249,0.5)]">
        <AnimatedNumber value={flock.price} />
      </div>
      <p className="mt-3 text-[17px] text-white/30 line-through">alone {fmtUsd(flock.soloPrice)}</p>
      <div className="mt-8">
        <ProgressRail n={flock.n} max={flock.maxBuyers} min={flock.minBuyers} />
      </div>
      <div className="mt-8 space-y-2">
        {flock.feed.slice(0, 4).map((e) => (
          <div key={e.id} className="rounded-[18px] border border-white/10 bg-white/[0.06] px-4 py-3 text-[14px] leading-snug text-white/75">
            {e.text}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── sections ── */

const STEPS: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: Users, title: "Start or scan.", body: "Someone sets the costs and group size. Everyone else scans a QR and signs in with email. No wallet, no gas." },
  { icon: TrendingDown, title: "Every Duck lowers the price.", body: "Each person who joins splits the fixed cost further — and everyone already in gets the difference back instantly." },
  { icon: ShieldCheck, title: "It flies, or you get paid.", body: "Hit the minimum and it settles in one Monad block. Miss it and everyone gets a full refund plus a bonus." },
];

const WHY = [
  { title: "Average-cost sharing.", body: "The van costs the same whether 6 or 12 people ride. More riders means a smaller share each." },
  { title: "Instant retroactive rebates.", body: "Joining early never costs more. When the price drops, earlier buyers are refunded in the same ~300ms block." },
  { title: "Dominant assurance contract.", body: "The seller posts a bond. If the flock fails, every buyer is refunded and paid a bonus — so joining is always the right move." },
];

const USES: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: Bus, title: "Van to PDX", body: "Split the rental for the airport run." },
  { icon: Shirt, title: "Club merch", body: "Bulk hoodies get cheaper per order." },
  { icon: Utensils, title: "Group dinners", body: "Private room fee, shared by the table." },
  { icon: Trophy, title: "Game-day bus", body: "Charter the bus once enough fans join." },
];

function FlockCard({ f }: { f: FlockState }) {
  const s = statusOf(f);
  return (
    <Link
      href={`/f/${f.id}`}
      className="group block rounded-[28px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#836EF9] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
    >
      <GlassCard className="flex h-full flex-col p-6 transition-colors group-hover:bg-white/[0.09]">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 text-[19px] font-semibold leading-snug tracking-tight [overflow-wrap:anywhere]">{cleanTitle(f.title)}</h3>
          <span className={`shrink-0 rounded-full px-3 py-1 text-[13px] font-semibold ${s.tone}`}>{s.label}</span>
        </div>
        <div className="mt-5 text-[44px] font-semibold leading-none tracking-[-0.03em]">
          <AnimatedNumber value={f.n ? f.price : f.soloPrice} />
        </div>
        <p className="mt-2 text-[15px] text-white/30 line-through">alone {fmtUsd(f.soloPrice)}</p>
        <ProgressRail className="mt-5" n={f.n} max={f.maxBuyers} min={f.minBuyers} />
        <span className="mt-5 inline-flex items-center gap-1 text-[15px] font-semibold text-[#a796ff]">
          View flock <ArrowRight size={16} strokeWidth={SW} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </GlassCard>
    </Link>
  );
}

export default function Landing({ flocks, onStartFlock }: LandingProps) {
  const ordered = [...flocks.filter((f) => f.status === "open"), ...flocks.filter((f) => f.status !== "open")];
  return (
    <MotionConfig reducedMotion="user">
      <main className="w-full overflow-x-clip bg-black text-white">
        {/* nav */}
        <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-black/60 backdrop-blur-2xl">
          <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-5">
            <span className="text-[17px] font-semibold tracking-tight">Flock</span>
            <div className="flex items-center gap-5 text-[13px] text-white/70">
              <a href="#how" className="hidden hover:text-white sm:inline">How it works</a>
              <a href="#live" className="hidden hover:text-white sm:inline">Live flocks</a>
              <button type="button" onClick={onStartFlock} className="min-h-[44px] rounded-full px-1 font-semibold text-[#a796ff] hover:text-white">
                Start a flock
              </button>
            </div>
          </div>
        </nav>

        {/* hero */}
        <section className="relative mx-auto max-w-6xl px-5 pb-16 pt-14 md:pb-24 md:pt-24">
          <div className="pointer-events-none absolute left-1/2 top-24 h-[620px] w-[820px] max-w-[140vw] -translate-x-1/2 rounded-full bg-[#836EF9] opacity-25 blur-[140px]" aria-hidden="true" />
          <motion.div {...reveal} className="relative text-center">
            <p className="text-[17px] font-semibold text-[#a796ff]">Flock</p>
            <h1 className="mx-auto mt-3 max-w-4xl text-[44px] font-semibold leading-[1.04] tracking-[-0.035em] md:text-[80px] lg:text-[96px]">
              The group buy that gets cheaper every block.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-[17px] leading-relaxed text-white/60 md:text-[21px]">
              Every Duck who joins lowers the price for every Duck already in — and the difference lands back in your wallet in the same ~300ms Monad
              block. If it doesn&apos;t fill, the seller pays you for trying.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <PillButton onClick={onStartFlock} className="w-full sm:w-auto">
                <Plus size={18} strokeWidth={SW} /> Start a flock
              </PillButton>
              <a
                href="#live"
                className="inline-flex min-h-[56px] w-full items-center justify-center gap-1.5 rounded-[22px] border border-white/15 bg-white/10 px-7 text-[17px] font-semibold tracking-tight hover:bg-white/15 sm:w-auto"
              >
                See live flocks <ArrowRight size={18} strokeWidth={SW} />
              </a>
            </div>
          </motion.div>

          {/* 3D phones */}
          <div className="relative mt-14 flex items-start justify-center md:mt-20">
            <div className="relative z-10 -mr-10 mt-10 md:-mr-6 md:mt-16">
              <PhoneFrame width={200} tilt={{ x: 6, y: 18 }} float interactive className="md:hidden">
                <PassScreen />
              </PhoneFrame>
              <PhoneFrame width={300} tilt={{ x: 6, y: 18 }} float interactive className="hidden md:block">
                <PassScreen />
              </PhoneFrame>
            </div>
            <div className="relative z-20">
              <PhoneFrame width={200} tilt={{ x: 6, y: -18 }} float delay={1.5} interactive className="md:hidden">
                <PriceScreen />
              </PhoneFrame>
              <PhoneFrame width={320} tilt={{ x: 6, y: -18 }} float delay={1.5} interactive className="hidden md:block">
                <PriceScreen />
              </PhoneFrame>
            </div>
          </div>
        </section>

        {/* how it works */}
        <section id="how" className="mx-auto max-w-6xl scroll-mt-16 px-5 py-16 md:py-24">
          <motion.h2 {...reveal} className="text-[40px] font-semibold leading-tight tracking-[-0.03em] md:text-[56px]">
            How it works.
          </motion.h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {STEPS.map(({ icon: I, title, body }, i) => (
              <motion.div key={title} {...reveal} transition={{ ...reveal.transition, delay: i * 0.08 }}>
                <GlassCard className="h-full p-7">
                  <span className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[#836EF9]/20 text-[#b5a8ff]">
                    <I size={24} strokeWidth={SW} />
                  </span>
                  <h3 className="mt-6 text-[24px] font-semibold leading-tight tracking-tight">{title}</h3>
                  <p className="mt-3 text-[17px] leading-relaxed text-white/60">{body}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </section>

        {/* why it works */}
        <section className="border-y border-white/[0.06] bg-[#0A0A0F]">
          <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
            <motion.p {...reveal} className="text-[17px] font-semibold text-[#a796ff]">
              Why it works
            </motion.p>
            <div className="mt-8 space-y-12 md:space-y-16">
              {WHY.map((w, i) => (
                <motion.div key={w.title} {...reveal} transition={{ ...reveal.transition, delay: i * 0.05 }} className="grid gap-3 md:grid-cols-[1.2fr_1fr] md:gap-12">
                  <h3 className="text-[32px] font-semibold leading-[1.08] tracking-[-0.03em] md:text-[52px]">{w.title}</h3>
                  <p className="self-end text-[17px] leading-relaxed text-white/60 md:text-[21px]">{w.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* live flocks */}
        <section id="live" className="mx-auto max-w-6xl scroll-mt-16 px-5 py-16 md:py-24">
          <motion.div {...reveal} className="flex items-end justify-between gap-4">
            <h2 className="text-[40px] font-semibold leading-tight tracking-[-0.03em] md:text-[56px]">Live flocks.</h2>
            <span className="pb-2 text-[15px] text-white/50">{flocks.filter((f) => f.status === "open").length} open</span>
          </motion.div>
          {ordered.length ? (
            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {ordered.map((f) => (
                <FlockCard key={f.id} f={f} />
              ))}
            </div>
          ) : (
            <GlassCard className="mt-10 p-8 text-center text-[17px] text-white/50">Loading live flocks…</GlassCard>
          )}
        </section>

        {/* use cases */}
        <section className="mx-auto max-w-6xl px-5 pb-20 md:pb-28">
          <motion.h2 {...reveal} className="text-[32px] font-semibold tracking-[-0.03em] md:text-[40px]">
            Anything better together.
          </motion.h2>
          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {USES.map(({ icon: I, title, body }) => (
              <motion.div key={title} {...reveal}>
                <GlassCard className="h-full p-5">
                  <I size={26} strokeWidth={SW} className="text-[#b5a8ff]" />
                  <p className="mt-4 text-[17px] font-semibold tracking-tight">{title}</p>
                  <p className="mt-1 text-[15px] leading-snug text-white/50">{body}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
          <div className="mt-14 flex justify-center">
            <PillButton onClick={onStartFlock}>
              <CircleDollarSign size={18} strokeWidth={SW} /> Start a flock
            </PillButton>
          </div>
        </section>

        <footer className="border-t border-white/[0.06] px-5 py-8 text-center text-[13px] text-white/40">Built on Monad · Monad Blitz Oregon 2026</footer>
      </main>
    </MotionConfig>
  );
}
