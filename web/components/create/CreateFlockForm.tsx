"use client";
// OWNER: Teammate B (Phone & Create). Seller form to start a new flock.
// Keep the props interface (CreateFlockProps) exactly the same.
import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";
import type { CreateFlockProps, CreateFlockValues } from "@/lib/types";
import { buildCurve, fmtUsd, priceAt } from "@/lib/flock-math";

const DEFAULTS: CreateFlockValues = {
  title: "Thanksgiving van → PDX 🦃",
  imageUrl: "/img/van.svg",
  fixedCost: 300,
  unitCost: 0,
  minBuyers: 6,
  maxBuyers: 12,
  deadlineMinutes: 120,
  bonusPerBuyer: 2,
};

export default function CreateFlockForm({ loggedIn, busy, error, onLogin, onSubmit }: CreateFlockProps) {
  const [v, setV] = useState<CreateFlockValues>(DEFAULTS);
  const set = (k: keyof CreateFlockValues) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setV({ ...v, [k]: e.target.type === "number" ? Number(e.target.value) : e.target.value });
  const bond = v.bonusPerBuyer * Math.max(0, v.minBuyers - 1);
  const valid = v.title && v.fixedCost > 0 && v.minBuyers >= 1 && v.maxBuyers >= v.minBuyers && v.maxBuyers <= 60 && v.deadlineMinutes > 0;

  const field = (label: string, k: keyof CreateFlockValues, type = "number", hint?: string) => (
    <label className="block">
      <span className="text-sm text-white/70">{label}</span>
      <input type={type} value={v[k] as string | number} onChange={set(k)} className="mt-1 w-full rounded-xl border border-flock-line bg-flock-ink px-3 py-3 font-mono outline-none focus:border-flock-purple" />
      {hint && <span className="text-xs text-white/40">{hint}</span>}
    </label>
  );

  return (
    <div className="mx-auto grid min-h-screen max-w-5xl gap-6 p-6 text-white md:grid-cols-2">
      <div className="space-y-4">
        <h1 className="text-3xl font-black">Start a Flock</h1>
        {field("Title", "title", "text")}
        {field("Setup / fixed cost ($)", "fixedCost", "number", "Van rental, screen-print setup, venue fee… split across everyone")}
        {field("Per-unit cost ($)", "unitCost", "number", "Cost per extra person/item (0 for a van)")}
        <div className="grid grid-cols-2 gap-3">{field("Min buyers", "minBuyers")}{field("Max buyers (≤60)", "maxBuyers")}</div>
        <div className="grid grid-cols-2 gap-3">{field("Deadline (minutes)", "deadlineMinutes")}{field("Failure bonus per buyer ($)", "bonusPerBuyer")}</div>
        <button
          disabled={busy || !valid}
          onClick={() => (loggedIn ? onSubmit(v) : onLogin())}
          className="w-full rounded-2xl bg-flock-purple py-4 text-lg font-black disabled:opacity-50"
        >
          {busy ? "Launching on Monad…" : loggedIn ? "Launch Flock 🚀" : "Sign in to launch"}
        </button>
        {error && <div className="rounded-xl bg-flock-red/20 p-3 text-sm text-flock-red">{error}</div>}
      </div>
      <div className="rounded-3xl bg-flock-card p-6">
        <div className="text-sm text-white/60">Price per person = setup ÷ buyers + per-unit</div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={buildCurve(v.fixedCost || 1, v.unitCost, Math.min(60, Math.max(1, v.maxBuyers)))}>
              <XAxis dataKey="n" stroke="#ffffff55" />
              <YAxis stroke="#ffffff55" />
              <Line dataKey="price" stroke="#836EF9" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 space-y-1 font-mono text-sm">
          <div>Alone: {fmtUsd(priceAt(v.fixedCost, v.unitCost, 1))}</div>
          <div>At minimum ({v.minBuyers}): {fmtUsd(priceAt(v.fixedCost, v.unitCost, v.minBuyers))}</div>
          <div>At maximum ({v.maxBuyers}): {fmtUsd(priceAt(v.fixedCost, v.unitCost, v.maxBuyers))}</div>
          <div className="pt-2 text-flock-gold">Bond you lock: {fmtUsd(bond)} = bonus × (min − 1)</div>
        </div>
        <p className="mt-4 text-xs text-white/50">If the flock fails, every buyer gets a refund + your bonus. That makes joining a no-brainer, so flocks actually fill.</p>
      </div>
    </div>
  );
}
