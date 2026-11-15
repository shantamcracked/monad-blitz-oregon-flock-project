"use client";
// OWNER: Teammate A (Board & Story). Home page: what Flock is + list of live flocks.
// Keep the props interface (LandingProps) exactly the same.
// Visual language matches the join/create screens (light "bookings" style).
import Link from "next/link";
import {
  ArrowRight,
  Bus,
  CircleDollarSign,
  House,
  Mountain,
  Plus,
  Shirt,
  ShieldCheck,
  TrainFront,
  TrendingDown,
  Users,
  Utensils,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { FlockState, LandingProps } from "@/lib/types";
import { fmtUsd } from "@/lib/flock-math";

const card = "rounded-xl border border-slate-200 bg-white/90 shadow-sm";

function iconFor(title: string): LucideIcon {
  const t = title.toLowerCase();
  if (/van|bus|shuttle|ride|pdx/.test(t)) return t.includes("ski") ? Mountain : Bus;
  if (/cabin|house|lodge|stay|airbnb/.test(t)) return House;
  if (/hoodie|shirt|merch|tee/.test(t)) return Shirt;
  if (/taco|dinner|food|lunch|pizza|meal/.test(t)) return Utensils;
  if (/train|rail/.test(t)) return TrainFront;
  return Users;
}

function cleanTitle(title: string): string {
  return title.replace(/[\p{Extended_Pictographic}‍️]/gu, "").replace(/\s{2,}/g, " ").trim();
}

function statusOf(f: FlockState): { label: string; tone: string } {
  if (f.status === "success") return { label: "Confirmed", tone: "border-emerald-200 bg-emerald-50 text-emerald-800" };
  if (f.status === "failed") return { label: "Canceled", tone: "border-rose-200 bg-rose-50 text-rose-800" };
  if (f.n >= f.maxBuyers) return { label: "Full", tone: "border-slate-200 bg-slate-50 text-slate-700" };
  if (f.n >= f.minBuyers) return { label: "Minimum reached", tone: "border-sky-200 bg-sky-50 text-sky-900" };
  return { label: "Still filling", tone: "border-sky-200 bg-sky-50 text-sky-900" };
}

const STEPS = [
  { icon: TrendingDown, title: "Price drops with every Duck", body: "Each new buyer lowers the price for everyone already in." },
  { icon: CircleDollarSign, title: "Rebates in the same block", body: "The difference lands back in your wallet in ~300ms on Monad." },
  { icon: ShieldCheck, title: "No-lose if it doesn't fill", body: "Full refund plus a seller-funded bonus for trying." },
];

function FlockCard({ f }: { f: FlockState }) {
  const Icon = iconFor(f.title);
  const s = statusOf(f);
  const price = f.n ? f.price : f.soloPrice;
  const pct = Math.min(100, Math.round((f.n / Math.max(1, f.maxBuyers)) * 100));
  const minPct = Math.min(100, Math.round((f.minBuyers / Math.max(1, f.maxBuyers)) * 100));
  return (
    <Link
      href={`/f/${f.id}`}
      className={`${card} group flex min-w-0 flex-col p-5 transition hover:border-sky-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="flex min-w-[10rem] flex-1 items-center gap-2 text-base font-semibold">
          <Icon size={18} className="shrink-0 text-sky-800" aria-hidden="true" />
          <span className="min-w-0 [overflow-wrap:anywhere]">{cleanTitle(f.title)}</span>
        </h3>
        <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${s.tone}`}>{s.label}</span>
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="tabular text-3xl font-semibold tracking-tight">{fmtUsd(price)}</span>
        <span className="text-sm text-slate-600">per person</span>
      </div>
      {f.n > 0 && f.soloPrice > price && (
        <p className="mt-0.5 text-sm text-emerald-700">
          <span className="line-through decoration-slate-400 text-slate-500">{fmtUsd(f.soloPrice)}</span> alone
        </p>
      )}

      <div className="mt-4">
        <div className="relative h-2 overflow-hidden rounded-full bg-slate-200" aria-hidden="true">
          <div className="h-full rounded-full bg-sky-400 transition-[width]" style={{ width: `${pct}%` }} />
          {f.minBuyers < f.maxBuyers && <div className="absolute inset-y-0 w-0.5 bg-slate-500/60" style={{ left: `${minPct}%` }} />}
        </div>
        <p className="mt-2 flex items-center justify-between text-xs text-slate-600">
          <span className="flex items-center gap-1">
            <Users size={13} aria-hidden="true" />
            {f.n}/{f.maxBuyers} ducks
          </span>
          <span>min {f.minBuyers}</span>
        </p>
      </div>

      <span className="mt-4 flex items-center gap-1 text-sm font-semibold text-sky-800">
        View flock <ArrowRight size={15} className="transition group-hover:translate-x-0.5" aria-hidden="true" />
      </span>
    </Link>
  );
}

export default function Landing({ flocks, onStartFlock }: LandingProps) {
  const open = flocks.filter((f) => f.status === "open");
  const closed = flocks.filter((f) => f.status !== "open");
  return (
    <main className="min-h-[100dvh] w-full overflow-x-clip bg-[#f4f7fb] bg-[radial-gradient(ellipse_at_top_left,#e2efff,transparent_55%)] px-4 pt-[max(1.75rem,env(safe-area-inset-top))] pb-[calc(1.75rem+env(safe-area-inset-bottom))] text-slate-950 sm:px-8">
      <div className="mx-auto max-w-md space-y-8 lg:max-w-6xl">
        <header className="flex items-center justify-between gap-3 border-b border-slate-200 pb-5">
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-sky-300/10 p-2 text-sky-800">
              <Wallet size={20} aria-hidden="true" />
            </span>
            <span className="text-2xl font-semibold tracking-tight">Flock</span>
          </div>
          <button
            type="button"
            onClick={onStartFlock}
            className="hidden min-h-11 items-center gap-1.5 rounded-lg border border-sky-200 bg-white px-4 text-sm font-semibold text-sky-800 hover:bg-sky-50 sm:flex"
          >
            <Plus size={16} aria-hidden="true" /> Start a flock
          </button>
        </header>

        <section className="grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">The group buy that gets cheaper every block.</h1>
            <p className="mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
              Every Duck who joins lowers the price for every Duck already in, and the difference lands back in your wallet in the same ~300ms Monad
              block. If the flock doesn&apos;t fill, the seller pays you a bonus for trying.
            </p>
            <button
              type="button"
              onClick={onStartFlock}
              className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-sky-200 px-6 text-base font-semibold text-slate-950 transition hover:bg-sky-300 active:scale-[0.99] sm:w-auto"
            >
              <Plus size={18} aria-hidden="true" /> Start a flock
            </button>
          </div>
          <ul className={`${card} divide-y divide-slate-200`}>
            {STEPS.map(({ icon: I, title, body }) => (
              <li key={title} className="flex gap-3 p-4">
                <span className="h-fit rounded-lg bg-sky-300/10 p-2 text-sky-800">
                  <I size={18} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="mt-0.5 text-sm text-slate-600">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="live-flocks">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 id="live-flocks" className="text-xl font-semibold tracking-tight">Live flocks</h2>
            <span className="text-sm text-slate-600">{open.length} open</span>
          </div>
          {flocks.length ? (
            <div className="grid gap-4 lg:grid-cols-3">
              {[...open, ...closed].map((f) => (
                <FlockCard key={f.id} f={f} />
              ))}
            </div>
          ) : (
            <div className={`${card} p-6 text-center text-sm text-slate-600`}>Loading live flocks…</div>
          )}
        </section>
      </div>
    </main>
  );
}
