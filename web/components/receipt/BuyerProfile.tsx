"use client";

import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, CalendarDays, ChevronDown, CircleDollarSign, Clock3, History, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { fmtUsd } from "@/lib/flock-math";

import TripCard, { canJoin, type ProfileTrip } from "./TripCard";

export type ProfileTransaction = {
  id: string;
  flock: string;
  label: "Join payment" | "Price-drop rebate" | "Refund + bonus";
  at: number;
  amount: number;
};

const categories = [
  { id: "current", label: "Current", icon: Clock3 },
  { id: "upcoming", label: "Upcoming", icon: CalendarDays },
  { id: "past", label: "Past", icon: History },
] as const;

function categoryOf(trip: ProfileTrip, now: number) {
  const { flock } = trip;
  if (flock.status === "failed" || (flock.n < flock.minBuyers && now >= flock.deadline)) return "past";
  if (flock.status === "success") return trip.startsAt > now ? "upcoming" : "past";
  return "current";
}

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

export default function BuyerProfile({ trips, transactions, asOf, preview = false }: {
  trips: ProfileTrip[];
  transactions: ProfileTransaction[];
  asOf: number;
  preview?: boolean;
}) {
  const [now, setNow] = useState(asOf);
  const [category, setCategory] = useState<(typeof categories)[number]["id"]>("current");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | "money-in" | "money-out">("all");
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const returned = transactions.reduce((sum, tx) => sum + Math.max(0, tx.amount), 0);
  const held = trips.reduce((sum, { flock, guests }) =>
    sum + (flock.status === "open" && guests.some(guest => guest.isYou && guest.state === "paid") ? flock.price : 0), 0);
  const dueTrips = trips.filter(({ flock, guests }) =>
    canJoin(flock, now) && guests.some(guest => guest.isYou && guest.state === "accepted"));
  const owed = dueTrips.reduce((sum, { flock }) => sum + flock.nextPrice, 0);
  const visibleTrips = trips.filter(trip => categoryOf(trip, now) === category);
  const selectedTrip = visibleTrips.find(({ flock }) => flock.id === selectedId)
    ?? visibleTrips.find(trip => dueTrips.includes(trip))
    ?? visibleTrips[0];
  const history = transactions.filter(tx => filter === "all" || (filter === "money-in" ? tx.amount > 0 : tx.amount < 0))
    .sort((a, b) => b.at - a.at);
  const card = "rounded-xl border border-slate-200 bg-white/90 shadow-sm p-4";

  return (
    <main className="min-h-screen bg-[#f4f7fb] bg-[radial-gradient(ellipse_at_top_left,#e2efff,transparent_55%)] px-4 py-7 text-slate-950 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex items-center justify-between gap-3 border-b border-slate-200 pb-5">
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-sky-300/10 p-2 text-sky-800"><Wallet size={20} aria-hidden="true" /></span>
            <h1 className="text-2xl font-semibold tracking-tight">Your bookings</h1>
          </div>
          {preview && <Link className="text-sm text-slate-600 underline-offset-4 hover:text-slate-950 hover:underline" href="/preview/receipt">Receipt demo</Link>}
        </header>

        <div className="grid items-start gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <aside className="space-y-5">
            <section aria-label="Money overview" className="rounded-xl border border-slate-200 bg-white/90 shadow-sm p-4">
              <div className="flex items-center gap-2 text-sm text-slate-700"><CircleDollarSign size={16} aria-hidden="true" /> You owe</div>
              <p className="mt-1 text-3xl font-semibold tabular-nums">{fmtUsd(owed)}</p>
              {dueTrips.map(({ flock, host }) => (
                <button key={flock.id} type="button" onClick={() => { setCategory("current"); setSelectedId(flock.id); }} className="mt-3 flex w-full items-center justify-between gap-2 text-left text-sm text-amber-800 hover:underline">
                  <span>{host}</span><span className="ml-auto whitespace-nowrap tabular-nums">{fmtUsd(flock.nextPrice)}</span><ArrowUpRight size={15} className="shrink-0" aria-hidden="true" />
                </button>
              ))}
              <dl className="mt-4 space-y-2 border-t border-slate-200 pt-3 text-sm">
                <div className="flex justify-between gap-3"><dt className="text-slate-600">Held in bookings</dt><dd className="tabular-nums">{fmtUsd(held)}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-slate-600">Money returned</dt><dd className="tabular-nums text-emerald-800">{fmtUsd(returned)}</dd></div>
              </dl>
            </section>
            <nav aria-label="Choose booking" className="space-y-3">
              <div role="group" aria-label="Booking category" className="grid grid-cols-3 gap-1 rounded-xl bg-slate-200/70 p-1">
                {categories.map(({ id, label, icon: CategoryIcon }) => (
                  <button key={id} type="button" aria-pressed={category === id}
                    onClick={() => { setCategory(id); setSelectedId(null); }}
                    className="flex items-center justify-center gap-1 rounded-lg px-1 py-2 text-xs font-semibold text-slate-700 hover:bg-white/700 aria-pressed:bg-white aria-pressed:text-slate-950 aria-pressed:shadow-sm">
                    <CategoryIcon size={12} className="shrink-0" aria-hidden="true" />{label}
                  </button>
                ))}
              </div>
              <p className="px-1 text-xs text-slate-600">
                {category === "current" ? "Still filling or awaiting settlement" : category === "upcoming" ? "Paid and confirmed. Trip ahead." : "Finished or canceled bookings"}
              </p>
              <ul className="space-y-1">
                {visibleTrips.map(({ flock, icon: Icon }) => (
                  <li key={flock.id}>
                    <button type="button" aria-current={selectedTrip?.flock.id === flock.id ? "true" : undefined}
                      onClick={() => setSelectedId(flock.id)}
                      className="flex w-full items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-white/70 aria-[current=true]:border-sky-200/20 aria-[current=true]:bg-sky-300/10 aria-[current=true]:text-slate-950">
                      <Icon size={17} className="shrink-0 text-sky-800" aria-hidden="true" /> {flock.title}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
          <section aria-label="Booking details" className="min-w-0">
            {selectedTrip ? trips.map(trip => (
              <div key={trip.flock.id} hidden={trip !== selectedTrip}>
                <TripCard trip={trip} now={now} preview={preview} active={trip === selectedTrip} />
              </div>
            )) : <p className={card}>No bookings in this category.</p>}
          </section>
        </div>

        <details key={category} open={category === "past"} className={`${card} group`}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 font-semibold [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-2"><ArrowDownLeft size={17} aria-hidden="true" /> Transaction history</span>
            <ChevronDown size={17} aria-hidden="true" className="transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">

            <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1" role="group" aria-label="Filter transactions">
              {([["all", "All"], ["money-in", "Money in"], ["money-out", "Money out"]] as const).map(([value, label]) =>
                <button type="button" key={value} onClick={() => setFilter(value)} aria-pressed={value === filter} className={`min-h-10 rounded-lg px-3 text-sm font-semibold ${value === filter ? "bg-sky-200 text-slate-950" : "text-slate-700 hover:bg-sky-200/10"}`}>{label}</button>
              )}
            </div>
          </div>
          {history.length ? <ul className="mt-4 divide-y divide-slate-200">
            {history.map(tx => (
              <li key={tx.id} className="flex items-center justify-between gap-4 py-3">
                <div><div className="font-semibold">{tx.label}</div><div className="text-sm text-slate-700">{tx.flock} · <time dateTime={new Date(tx.at).toISOString()}>{dateFormat.format(tx.at)}</time></div></div>
                <span className={`shrink-0 font-bold tabular-nums ${tx.amount > 0 ? "text-emerald-800" : "text-slate-900"}`}>{tx.amount > 0 ? "+" : "−"}{fmtUsd(Math.abs(tx.amount))}</span>
              </li>
            ))}
          </ul> : <p className="mt-4 text-slate-700">No transactions match this view.</p>}
          </div>
        </details>
      </div>
    </main>
  );
}
