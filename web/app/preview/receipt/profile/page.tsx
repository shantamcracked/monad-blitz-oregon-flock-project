"use client";

import { Bus, House, Mountain, Sailboat, Tent, TrainFront, Utensils } from "lucide-react";
import { useEffect, useState } from "react";
import BuyerProfile, { type ProfileTransaction } from "@/components/receipt/BuyerProfile";
import type { Guest, ProfileTrip } from "@/components/receipt/TripCard";
import { makeMockFlock } from "@/lib/mock";

const hour = 3_600_000;
const day = 24 * hour;
const guestNames = ["Maya", "Eli", "Jordan", "Noor", "Sam", "Riley", "Avery", "Casey"];

function makeTrips(now: number): ProfileTrip[] {
  const fixtures = [
    { title: "Thanksgiving van to PDX", host: "Maya Chen", icon: Bus, paid: 4, min: 6, max: 12, cost: 300, closes: 0.75 * hour, starts: 10 * day, me: "paid", bonus: 2 },
    { title: "Coast weekend cabin", host: "Coast Cabins", icon: House, paid: 5, min: 5, max: 8, cost: 560, closes: 3 * hour, starts: 13 * day, me: "accepted" },
    { title: "Mount Hood ski shuttle", host: "Summit Shuttles", icon: Mountain, paid: 3, min: 6, max: 8, cost: 288, closes: 20 * hour, starts: 27 * day, me: "invited" },
    { title: "Bend cabin weekend", host: "Juniper Lodging", icon: House, paid: 6, min: 5, max: 6, cost: 720, closes: -day, starts: 16 * day, me: "paid", status: "success" },
    { title: "Columbia Gorge rail trip", host: "Gorge Rail Tours", icon: TrainFront, paid: 5, min: 4, max: 5, cost: 225, closes: -2 * day, starts: 9 * day, me: "paid", status: "success" },
    { title: "Silver Falls camping", host: "Silver Falls Campground", icon: Tent, paid: 4, min: 4, max: 4, cost: 144, closes: -7 * day, starts: -3 * day, me: "paid", status: "success" },
    { title: "Late-night taco run", host: "Late Night Tacos", icon: Utensils, paid: 3, min: 6, max: 10, cost: 160, closes: -2 * day, starts: day, me: "paid", bonus: 3, status: "failed" },
    { title: "Newport sunset sail", host: "Bayfront Sailing", icon: Sailboat, paid: 2, min: 5, max: 8, cost: 360, closes: -hour, starts: 5 * day, me: "paid", bonus: 5 },
  ] as const;

  return fixtures.map((fixture, i) => {
    const status = "status" in fixture ? fixture.status : "open";
    const deadline = now + fixture.closes;
    const flock = makeMockFlock(fixture.paid, {
      id: i + 1, title: fixture.title, minBuyers: fixture.min, maxBuyers: fixture.max,
      fixedCost: fixture.cost, bonusPerBuyer: "bonus" in fixture ? fixture.bonus : 0, deadline, status,
    });
    const guests: Guest[] = [
      { id: "you", name: "You", isYou: true, state: fixture.me },
      ...guestNames.slice(0, fixture.paid - (fixture.me === "paid" ? 1 : 0)).map(name => ({ id: name, name, state: "paid" as const })),
    ];
    if (status === "open" && deadline > now) {
      guests.push({ id: "taylor", name: "Taylor", state: "accepted" }, { id: "alex", name: "Alex", state: "invited" });
    }
    return { flock, guests, host: fixture.host, icon: fixture.icon, startsAt: now + fixture.starts };
  });
}

export default function PreviewBuyerProfile() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => setNow(Date.now()), []);
  if (now === null) return <p className="p-8">Loading bookings…</p>;

  const trips = makeTrips(now);
  const transactions: ProfileTransaction[] = trips.flatMap(({ flock, guests }) => {
    if (!guests.some(guest => guest.isYou && guest.state === "paid")) return [];
    const buyer = flock.buyers[0];
    const paidAt = Math.min(now, flock.deadline) - 3 * hour;
    const rows: ProfileTransaction[] = [{ id: `${flock.id}-join`, flock: flock.title, label: "Join payment", at: paidAt, amount: -buyer.paidAtJoin }];
    const rebates = flock.feed.filter(event => event.kind === "joined" && event.at > buyer.joinedAt && event.rebatePerBuyer).reverse();
    rebates.forEach((event, i) => {
      rows.push({ id: event.id, flock: flock.title, label: "Price-drop rebate", at: paidAt + (i + 1) * 60_000, amount: event.rebatePerBuyer ?? 0 });
    });
    if (flock.status === "failed") {
      rows.push({ id: `${flock.id}-refund`, flock: flock.title, label: "Refund + bonus", at: flock.deadline + 60_000, amount: flock.price + flock.bonusPerBuyer });
    }
    return rows;
  });
  return <BuyerProfile trips={trips} transactions={transactions} asOf={now} preview />;
}
