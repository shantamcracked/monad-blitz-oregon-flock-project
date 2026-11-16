"use client";
// OWNER: Teammate B (Phone & Create). Seller form to start a new flock.
// Keep the props interface (CreateFlockProps) exactly the same.
// Design: iOS Settings-style grouped inset lists + live price-curve card.
import { useId, useState, type ReactNode } from "react";
import { MotionConfig } from "framer-motion";
import { AlertTriangle, Bus, ShieldCheck, Shirt, Utensils, type LucideIcon } from "lucide-react";
import { Line, LineChart, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from "recharts";
import type { CreateFlockProps, CreateFlockValues } from "@/lib/types";
import { buildCurve, fmtUsd, priceAt } from "@/lib/flock-math";
import { GlassCard } from "@/components/ui/GlassCard";
import { PillButton } from "@/components/ui/PillButton";
import { StatRow } from "@/components/ui/StatRow";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";

const SW = 1.75;

/* ───────────────────────── data ───────────────────────── */

type NumKey = Exclude<keyof CreateFlockValues, "title" | "imageUrl">;
type Draft = { title: string; imageUrl: string } & Record<NumKey, string>;

const PRESETS: { label: string; icon: LucideIcon; values: Partial<Draft> }[] = [
  {
    label: "Van to PDX",
    icon: Bus,
    values: { title: "Van to PDX", fixedCost: "300", unitCost: "0", minBuyers: "6", maxBuyers: "12", bonusPerBuyer: "2", deadlineMinutes: "120", imageUrl: "/img/van.svg" },
  },
  {
    label: "Club hoodies",
    icon: Shirt,
    values: { title: "Club hoodies", fixedCost: "120", unitCost: "14", minBuyers: "10", maxBuyers: "40", bonusPerBuyer: "1", imageUrl: "/img/hoodie.svg" },
  },
  {
    label: "Group dinner",
    icon: Utensils,
    values: { title: "Group dinner", fixedCost: "200", unitCost: "25", minBuyers: "8", maxBuyers: "20", bonusPerBuyer: "2", imageUrl: "/img/tacos.svg" },
  },
];

const DEFAULTS: Draft = {
  title: "Van to PDX",
  imageUrl: "/img/van.svg",
  fixedCost: "300",
  unitCost: "0",
  minBuyers: "6",
  maxBuyers: "12",
  deadlineMinutes: "120",
  bonusPerBuyer: "2",
};

function toNum(s: string): number {
  return s.trim() === "" ? NaN : Number(s);
}

function validate(d: Draft): Partial<Record<keyof Draft, string>> {
  const n = (k: NumKey) => toNum(d[k]);
  const e: Partial<Record<keyof Draft, string>> = {};
  if (!d.title.trim()) e.title = "Give the flock a name.";
  if (!(n("fixedCost") > 0)) e.fixedCost = "Setup cost must be more than $0.";
  if (!(n("unitCost") >= 0)) e.unitCost = "Per-item cost can't be negative.";
  if (!Number.isInteger(n("minBuyers")) || n("minBuyers") < 1) e.minBuyers = "Minimum must be a whole number, 1 or more.";
  if (!Number.isInteger(n("maxBuyers")) || n("maxBuyers") < 1) e.maxBuyers = "Maximum must be a whole number.";
  else if (n("maxBuyers") > 60) e.maxBuyers = "Maximum can be at most 60.";
  else if (!e.minBuyers && n("maxBuyers") < n("minBuyers")) e.maxBuyers = "Maximum must be at least the minimum.";
  if (!Number.isInteger(n("deadlineMinutes")) || n("deadlineMinutes") <= 0) e.deadlineMinutes = "Deadline must be at least 1 minute.";
  if (!(n("bonusPerBuyer") >= 0)) e.bonusPerBuyer = "Bonus can't be negative.";
  return e;
}

function fmtDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return "—";
  const d = Math.floor(minutes / 1440);
  const h = Math.floor((minutes % 1440) / 60);
  const m = Math.round(minutes % 60);
  return [d && `${d}d`, h && `${h}h`, (m || (!d && !h)) && `${m}m`].filter(Boolean).join(" ");
}

/* ───────────────────────── grouped list ───────────────────────── */

function Group({ title, footer, children }: { title: string; footer?: ReactNode; children: ReactNode }) {
  return (
    <section>
      <h2 className="px-4 pb-2 text-[13px] font-semibold uppercase tracking-[0.06em] text-white/40">{title}</h2>
      <div className="overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl">{children}</div>
      {footer && <p className="px-4 pt-2 text-[13px] leading-snug text-white/40">{footer}</p>}
    </section>
  );
}

function Row({ id, label, error, prefix, suffix, children }: { id: string; label: string; error?: string; prefix?: string; suffix?: string; children: ReactNode }) {
  return (
    <div className="border-b border-white/[0.08] last:border-b-0">
      <label htmlFor={id} className="flex min-h-[52px] cursor-text items-center gap-3 px-4">
        <span className="shrink-0 text-[17px] text-white">{label}</span>
        <span className="ml-auto flex min-w-0 items-center justify-end gap-1 text-[17px] tabular-nums text-white/60">
          {prefix && <span aria-hidden="true">{prefix}</span>}
          {children}
          {suffix && <span aria-hidden="true">{suffix}</span>}
        </span>
      </label>
      {error && (
        <p id={`${id}-err`} className="flex items-center gap-1.5 px-4 pb-3 text-[13px] text-[#FF453A]">
          <AlertTriangle size={13} strokeWidth={SW} aria-hidden="true" /> {error}
        </p>
      )}
    </div>
  );
}

const inputCls =
  "min-w-0 bg-transparent text-right text-[17px] text-white tabular-nums outline-none placeholder:text-white/30 focus:text-[#c4b8ff] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

/* ───────────────────────── preview ───────────────────────── */

function PricePreview({ v, valid }: { v: CreateFlockValues; valid: boolean }) {
  const max = Math.min(60, Math.max(2, Math.floor(v.maxBuyers) || 2));
  const min = Math.min(max, Math.max(1, Math.floor(v.minBuyers) || 1));
  const F = v.fixedCost > 0 ? v.fixedCost : 1;
  const c = v.unitCost >= 0 ? v.unitCost : 0;
  const data = buildCurve(F, c, max).map((p) => ({ ...p, filled: p.n >= min ? p.price : null }));
  const alone = priceAt(F, c, 1);
  const atMin = priceAt(F, c, min);
  const atMax = priceAt(F, c, max);
  const bonus = v.bonusPerBuyer >= 0 ? v.bonusPerBuyer : 0;
  const bond = bonus * Math.max(0, min - 1);

  return (
    <GlassCard className="overflow-hidden">
      <div className="flex items-start justify-between gap-3 px-6 pt-6">
        <div>
          <p className="text-[15px] text-white/50">Per person at minimum</p>
          <div className="mt-1 text-[48px] font-semibold leading-none tracking-[-0.035em]">
            <AnimatedNumber value={atMin} />
          </div>
        </div>
        <span className={`rounded-full px-3 py-1 text-[13px] font-semibold ${valid ? "bg-[#30D158]/15 text-[#30D158]" : "bg-[#FF453A]/15 text-[#FF453A]"}`}>
          {valid ? "Ready" : "Needs fixes"}
        </span>
      </div>
      <div className="mt-4 h-44 px-2" aria-label="Price curve">
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 320, height: 176 }}>
          <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
            <XAxis dataKey="n" type="number" domain={[1, max]} allowDecimals={false} tickCount={5} axisLine={false} tickLine={false} tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 12 }} />
            <YAxis tickFormatter={(x) => `$${Math.round(x)}`} width={46} tickCount={3} axisLine={false} tickLine={false} tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 12 }} />
            <Line type="monotone" dataKey="price" stroke="#836EF9" strokeOpacity={0.35} strokeWidth={2} dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="filled" stroke="#a796ff" strokeWidth={2.5} dot={false} isAnimationActive={false} style={{ filter: "drop-shadow(0 0 6px rgba(131,110,249,0.7))" }} />
            <ReferenceLine x={min} stroke="#FFD60A" strokeOpacity={0.7} strokeDasharray="3 4" label={{ value: "Min", position: "insideTopRight", fill: "#FFD60A", fontSize: 11 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="px-6 pb-2">
        <StatRow label="Alone" value={<span className="text-white/40 line-through">{fmtUsd(alone)}</span>} />
        <StatRow label={`At minimum (${min})`} value={fmtUsd(atMin)} />
        <StatRow label={`At maximum (${max})`} value={fmtUsd(atMax)} tone="mint" />
        <StatRow label="Deadline" value={`${fmtDuration(v.deadlineMinutes)} from launch`} />
      </div>
      <div className="mx-4 mb-4 rounded-[18px] bg-[#FFD60A]/10 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-[15px] font-semibold text-[#FFD60A]">
            <ShieldCheck size={16} strokeWidth={SW} aria-hidden="true" /> Bond you lock
          </p>
          <strong className="text-[17px] tabular-nums text-[#FFD60A]">{fmtUsd(bond)}</strong>
        </div>
        <p className="mt-1 text-[13px] tabular-nums text-white/50">
          Bonus × (min − 1) = {fmtUsd(bonus)} × {Math.max(0, min - 1)}
        </p>
        <p className="mt-2 text-[13px] leading-snug text-white/60">
          If the flock misses its minimum, the bond pays every buyer a bonus on top of a full refund — joining carries no risk, so it fills faster.
        </p>
      </div>
    </GlassCard>
  );
}

/* ───────────────────────── main ───────────────────────── */

export default function CreateFlockForm({ loggedIn, busy, error, onLogin, onSubmit }: CreateFlockProps) {
  const uid = useId();
  const [d, setD] = useState<Draft>(DEFAULTS);
  const [preset, setPreset] = useState<string | null>("Van to PDX");
  const errors = validate(d);
  const valid = Object.keys(errors).length === 0;

  const values: CreateFlockValues = {
    title: d.title.trim(),
    imageUrl: d.imageUrl,
    fixedCost: toNum(d.fixedCost),
    unitCost: toNum(d.unitCost),
    minBuyers: toNum(d.minBuyers),
    maxBuyers: toNum(d.maxBuyers),
    deadlineMinutes: toNum(d.deadlineMinutes),
    bonusPerBuyer: toNum(d.bonusPerBuyer),
  };

  const update = (k: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setD((cur) => ({ ...cur, [k]: e.target.value }));
    setPreset(null);
  };
  const applyPreset = (p: (typeof PRESETS)[number]) => {
    setD((cur) => ({ ...cur, ...p.values }));
    setPreset(p.label);
  };

  const num = (k: NumKey, width: string, step = "1") => (
    <input
      id={`${uid}-${k}`}
      type="number"
      inputMode={step === "1" ? "numeric" : "decimal"}
      step={step}
      min={0}
      value={d[k]}
      onChange={update(k)}
      aria-invalid={!!errors[k]}
      aria-describedby={errors[k] ? `${uid}-${k}-err` : undefined}
      className={`${inputCls} ${width}`}
    />
  );

  const submit = () => {
    if (!loggedIn) return onLogin();
    if (valid && !busy) onSubmit(values);
  };

  const bondNow = values.bonusPerBuyer * Math.max(0, values.minBuyers - 1);
  const cta = (
    <PillButton type="submit" loading={busy} loadingLabel="Launching on Monad…" disabled={loggedIn && !valid} className="w-full">
      {loggedIn ? "Launch flock" : "Sign in with email to launch"}
    </PillButton>
  );

  return (
    <MotionConfig reducedMotion="user">
      <main className="@container relative min-h-[100dvh] w-full overflow-x-clip bg-[#0A0A0F] text-white">
        <div className="pointer-events-none absolute -top-40 right-0 h-[480px] w-[480px] rounded-full bg-[#836EF9] opacity-20 blur-[140px]" aria-hidden="true" />
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="relative mx-auto max-w-md px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[calc(9rem+env(safe-area-inset-bottom))] @3xl:max-w-6xl @3xl:px-8 @3xl:pb-16"
        >
          <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#836EF9]">Flock</p>
          <h1 className="mt-2 text-[34px] font-semibold leading-tight tracking-[-0.02em] @3xl:text-[48px]">Start a flock</h1>
          <p className="mt-1 text-[17px] text-white/50">Set the costs and group size. The price drops for everyone as people join.</p>

          {/* presets */}
          <div className="mt-6 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" role="group" aria-label="Presets">
            {PRESETS.map((p) => {
              const I = p.icon;
              const on = preset === p.label;
              return (
                <button
                  key={p.label}
                  type="button"
                  aria-pressed={on}
                  onClick={() => applyPreset(p)}
                  className={`inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-full border px-4 text-[15px] font-semibold transition active:scale-[0.97] ${
                    on ? "border-[#836EF9] bg-[#836EF9]/25 text-white" : "border-white/10 bg-white/[0.06] text-white/70 hover:text-white"
                  }`}
                >
                  <I size={16} strokeWidth={SW} aria-hidden="true" /> {p.label}
                </button>
              );
            })}
          </div>

          <div className="mt-8 grid items-start gap-8 @3xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
            <div className="space-y-7">
              <Group title="Details">
                <Row id={`${uid}-title`} label="Name" error={errors.title}>
                  <input
                    id={`${uid}-title`}
                    value={d.title}
                    onChange={update("title")}
                    placeholder="Van to PDX"
                    aria-invalid={!!errors.title}
                    aria-describedby={errors.title ? `${uid}-title-err` : undefined}
                    className={`${inputCls} w-full`}
                  />
                </Row>
              </Group>

              <Group title="Costs" footer="Setup cost is split across everyone (a van, a venue fee). Per-item cost is added for each person — use 0 for a shared ride.">
                <Row id={`${uid}-fixedCost`} label="Setup cost" prefix="$" error={errors.fixedCost}>
                  {num("fixedCost", "w-24", "0.01")}
                </Row>
                <Row id={`${uid}-unitCost`} label="Per-item cost" prefix="$" error={errors.unitCost}>
                  {num("unitCost", "w-24", "0.01")}
                </Row>
              </Group>

              <Group title="Group size" footer="Below the minimum by the deadline, everyone is refunded. Up to 60 people.">
                <Row id={`${uid}-minBuyers`} label="Minimum" suffix="people" error={errors.minBuyers}>
                  {num("minBuyers", "w-14")}
                </Row>
                <Row id={`${uid}-maxBuyers`} label="Maximum" suffix="people" error={errors.maxBuyers}>
                  {num("maxBuyers", "w-14")}
                </Row>
              </Group>

              <Group
                title="Deadline & guarantee"
                footer={
                  <>
                    Closes {fmtDuration(values.deadlineMinutes)} after launch. The bonus is paid from your bond on top of each refund.
                  </>
                }
              >
                <Row id={`${uid}-deadlineMinutes`} label="Deadline" suffix="min" error={errors.deadlineMinutes}>
                  {num("deadlineMinutes", "w-16")}
                </Row>
                <Row id={`${uid}-bonusPerBuyer`} label="Bonus if it fails" prefix="$" error={errors.bonusPerBuyer}>
                  {num("bonusPerBuyer", "w-16", "0.01")}
                </Row>
                <div className="flex min-h-[52px] items-center justify-between px-4 text-[17px]">
                  <span className="text-white">Bond</span>
                  <span className="tabular-nums text-[#FFD60A]">{Number.isFinite(bondNow) ? fmtUsd(bondNow) : "—"}</span>
                </div>
              </Group>

              {error && (
                <div role="alert" className="rounded-[22px] border border-[#FF453A]/30 bg-[#FF453A]/10 px-5 py-4 text-[15px] text-[#ff8a82] [overflow-wrap:anywhere]">
                  <p className="flex items-center gap-2 font-semibold text-[#FF453A]">
                    <AlertTriangle size={16} strokeWidth={SW} aria-hidden="true" /> Couldn&apos;t launch
                  </p>
                  <p className="mt-1">{error}</p>
                </div>
              )}

              <div className="hidden @3xl:block">{cta}</div>
            </div>

            <div className="@3xl:sticky @3xl:top-6">
              <PricePreview v={values} valid={valid} />
            </div>
          </div>

          {/* sticky submit bar (mobile) */}
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0A0A0F]/70 px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-2xl @3xl:hidden">
            <div className="mx-auto max-w-md">
              {cta}
              <p className="mt-2 text-center text-[12px] text-white/40">
                {loggedIn ? `Locks a ${Number.isFinite(bondNow) ? fmtUsd(bondNow) : "—"} bond from your test wallet.` : "Email login · no wallet · no gas"}
              </p>
            </div>
          </div>
        </form>
      </main>
    </MotionConfig>
  );
}
