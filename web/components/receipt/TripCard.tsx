"use client";

import { ArrowRight, Building2, ChevronDown, Clock3, UserRound, type LucideIcon } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import { Area, CartesianGrid, ComposedChart, Line, ReferenceDot, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { fmtUsd } from "@/lib/flock-math";
import type { FlockState } from "@/lib/types";

export type Guest = { id: string; name: string; state: "invited" | "accepted" | "paid"; isYou?: boolean };

export type ProfileTrip = {
  flock: FlockState;
  host: string;
  startsAt: number;
  icon: LucideIcon;
  guests: Guest[];
};

export function canJoin(flock: FlockState, now: number) {
  return flock.status === "open" && now < flock.deadline && flock.n < flock.maxBuyers;
}

const deadlineFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

export default function TripCard({ trip, now, preview, active }: { trip: ProfileTrip; now: number; preview: boolean; active: boolean }) {
  const { flock, host, icon: Icon } = trip;
  const gradient = useId();
  const [guestName, setGuestName] = useState("");
  const [addedGuests, setAddedGuests] = useState<Guest[]>([]);
  const [accepted, setAccepted] = useState<string[]>([]);
  const guests = [...trip.guests, ...addedGuests];
  const spotsLeft = Math.max(0, flock.maxBuyers - flock.n);
  const needed = Math.max(0, flock.minBuyers - flock.n);
  const closed = !canJoin(flock, now);
  const canceled = flock.status === "failed" || (now >= flock.deadline && needed > 0);
  const minutes = Math.max(0, Math.ceil((flock.deadline - now) / 60_000));
  const remaining = minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m left` : `${minutes} min left`;
  const status = canceled ? "Canceled" : flock.status === "success" ? (now >= trip.startsAt ? "Finished" : "Confirmed") : closed ? "Awaiting settlement" : needed ? "Still filling" : "Minimum reached";
  const owing = closed ? [] : guests.filter(guest => guest.state === "accepted" || accepted.includes(guest.id));
  const youPaid = guests.some(guest => guest.isYou && guest.state === "paid");
  const confirmed = flock.status === "success";
  const paidOutcome = flock.status === "failed" ? "Refund sent" : canceled ? "Refund pending" : confirmed ? "Paid to organizer" : "Held until settlement";
  const data = flock.curve.map(point => ({ ...point, reached: point.n <= flock.n ? point.price : null }));

  function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = guestName.trim();
    if (!name || !canJoin(flock, Date.now())) return;
    setAddedGuests(current => [...current, { id: `demo-${current.length}`, name, state: "invited" }]);
    setGuestName("");
  }

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white/90 shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 p-5">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold"><Icon size={20} className="text-sky-800" aria-hidden="true" />{flock.title}</h2>
          <p className="mt-2 flex flex-wrap items-center gap-1.5 text-sm text-slate-600"><Clock3 size={14} aria-hidden="true" />
            <span>{confirmed ? "Trip" : "Payment deadline"}</span>
            <time dateTime={new Date(confirmed ? trip.startsAt : flock.deadline).toISOString()}>{deadlineFormat.format(confirmed ? trip.startsAt : flock.deadline)}</time>
            {!closed && <span className="ml-2 text-amber-800">· {remaining}</span>}
          </p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${canceled ? "border-rose-200 bg-rose-50 text-rose-800" : "border-sky-200 text-sky-900 bg-sky-50"}`}>{status}</span>
      </header>

      {youPaid && <section aria-label="Your payment status" className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3">
        <div>
          <p className="text-sm font-semibold">{paidOutcome}</p>
          <p className="text-xs text-slate-600">{canceled ? "Includes the missed-minimum bonus" : confirmed ? host : "Released or refunded at settlement"}</p>
        </div>
        <strong className="tabular-nums text-emerald-800">{fmtUsd(flock.price + (canceled ? flock.bonusPerBuyer : 0))}</strong>
      </section>}
      {owing.length > 0 && <section aria-label="Payment connections" className="border-b border-slate-200 px-5 py-4">
        <h3 className="text-sm font-semibold text-slate-800">Who owes whom</h3>
        {(
          <div className="mt-3 grid grid-cols-[minmax(0,1fr)_1.75rem_minmax(0,1fr)] items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 sm:px-4">
            <ul className="space-y-2 py-1">
              {owing.map(guest => (
                <li key={guest.id} className="rounded-lg bg-white px-2 py-2 text-sm sm:px-3">
                  <span className="flex items-center gap-1.5 font-medium"><UserRound size={14} className="shrink-0 text-slate-500" aria-hidden="true" /><span className="break-words min-w-0">{guest.name}</span></span>
                  <span className="mt-0.5 block font-semibold tabular-nums text-amber-800">{fmtUsd(flock.nextPrice)} due</span>
                </li>
              ))}
            </ul>
            <div aria-hidden="true" className="relative flex h-full items-center justify-center text-sky-800 before:absolute before:left-0 before:h-[calc(100%-3rem)] before:border-l before:border-sky-200/35">
              <ArrowRight size={19} />
            </div>
            <div className="min-w-0 rounded-lg border border-sky-200/20 bg-sky-300/10 px-2 py-2 text-sm sm:px-3">
              <span className="flex items-center gap-1.5 font-medium"><Building2 size={14} className="shrink-0 text-sky-800" aria-hidden="true" /><span className="break-words min-w-0">{host}</span></span>
              <span className="mt-0.5 block text-xs text-slate-600">Receives payment</span>
            </div>
          </div>
        )}
      </section>}

      <div className="grid gap-5 p-5">
        <section aria-label={`Price curve for ${flock.title}`} className="min-w-0">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-3xl font-bold tabular-nums text-emerald-800">{fmtUsd(flock.n ? flock.price : flock.soloPrice)}</p>
            <p className="text-sm text-slate-600">{canceled ? "Price before cancellation" : "Price per person"}</p>
          </div>
          {active && <div className="mt-2 h-40 min-w-0 rounded-xl bg-slate-50 py-1">
            <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 320, height: 168 }}>
              <ComposedChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#18826a" stopOpacity={0.42} />
                    <stop offset="100%" stopColor="#18826a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#d7e2ec" strokeDasharray="3 6" />
                <XAxis dataKey="n" type="number" domain={[1, Math.max(2, flock.maxBuyers)]} allowDecimals={false} tickCount={5} axisLine={false} tickLine={false} tick={{ fill: "#52647a", fontSize: 12 }} />
                <YAxis tickFormatter={value => `$${value}`} width={42} tickCount={4} axisLine={false} tickLine={false} tick={{ fill: "#52647a", fontSize: 12 }} />
                <Area type="monotone" dataKey="reached" fill={`url(#${gradient})`} stroke="none" isAnimationActive={false} />
                <Line type="monotone" dataKey="price" stroke="#5c83bb" strokeDasharray="5 6" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="reached" stroke="#18826a" strokeWidth={3} dot={false} isAnimationActive={false} />
                {flock.n > 0 && <ReferenceDot x={flock.n} y={flock.price} r={5} fill="#18826a" stroke="#eafff9" style={{ filter: "drop-shadow(0 0 5px #18826a)" }} />}
              </ComposedChart>
            </ResponsiveContainer>
          </div>}
          <p className="mt-2 text-sm text-slate-600">Price by number of paid spots</p>
          <p className="mt-4 text-sm font-medium">
            {flock.n}/{flock.maxBuyers} paid
            {!closed && <> · {spotsLeft} {spotsLeft === 1 ? "spot" : "spots"} left{needed > 0 && <span className="text-amber-800"> · {needed} more {needed === 1 ? "payment" : "payments"} to confirm</span>}</>}
          </p>
          {!closed && needed > 0 && guests.some(guest => guest.isYou && guest.state === "paid") &&
            <p className="mt-1 text-sm text-emerald-800">{fmtUsd(flock.price + flock.bonusPerBuyer)} back to you if canceled, including the bonus.</p>}
          {canceled ? <p className="mt-1 text-sm text-rose-800">Missed the {flock.minBuyers}-person minimum. {flock.status === "failed" ? "Paid guests were refunded." : "Refunds are pending settlement."}</p>
            : !closed && <p className="mt-2 flex flex-wrap items-center gap-1.5 text-sm text-slate-600"><Clock3 size={14} aria-hidden="true" />Cancels if fewer than {flock.minBuyers} people pay by the deadline.</p>}
        </section>

        <details className="group min-w-0 border-t border-slate-200 pt-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold [&::-webkit-details-marker]:hidden">Guest list and invitations <ChevronDown size={16} aria-hidden="true" className="transition-transform group-open:rotate-180" /></summary>
          <ul className="mt-2 max-h-52 divide-y divide-sky-200/15 overflow-y-auto">
            {guests.map(guest => {
              const state = accepted.includes(guest.id) ? "accepted" : guest.state;
              const label = state === "paid" ? (canceled ? (flock.status === "failed" ? "Refunded" : "Refund pending") : "Paid")
                : closed ? "Closed" : state === "accepted" ? `Accepted · ${fmtUsd(flock.nextPrice)} due` : "Invited";
              return (
                <li key={guest.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                  <span className="break-words font-medium">{guest.name}</span>
                  <span className={state === "accepted" && !closed ? "text-amber-800" : "text-slate-600"}>{label}</span>
                  {preview && state === "invited" && !closed &&
                    <button type="button" aria-label={`Simulate acceptance by ${guest.name}`} className="rounded-md border border-sky-200 px-2 py-1 text-sky-800 hover:bg-sky-200/10"
                      onClick={() => { if (Date.now() < flock.deadline) setAccepted(current => [...current, guest.id]); }}>Simulate accept</button>}
                </li>
              );
            })}
          </ul>
          {!closed && <p className="mt-2 text-xs text-slate-600">Amounts due use the next join price. Only paid guests count toward the minimum.</p>}
          {preview && !closed && <form onSubmit={invite} className="mt-4 flex flex-wrap gap-2">
            <label className="sr-only" htmlFor={`${gradient}-guest`}>Guest name for {flock.title}</label>
            <input id={`${gradient}-guest`} value={guestName} onChange={event => setGuestName(event.target.value)} maxLength={80} required
              placeholder="Guest name" className="min-w-24 flex-1 rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm" />
            <button type="submit" className="rounded-lg bg-sky-200 px-3 py-2 text-sm font-semibold text-slate-950">Add demo invite</button>
          </form>}
        </details>
      </div>
    </article>
  );
}
