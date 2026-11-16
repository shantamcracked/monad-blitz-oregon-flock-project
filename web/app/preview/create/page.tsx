"use client";
import { useEffect, useState } from "react";
import { ChevronDown, Info } from "lucide-react";
import CreateFlockForm from "@/components/create/CreateFlockForm";
import { PhoneFrame } from "@/components/ui/PhoneFrame";
import { fmtUsd } from "@/lib/flock-math";

type Who = "loggedOut" | "loggedIn";

function useIsDesktop() {
  const [d, setD] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(min-width: 900px)");
    const f = () => setD(m.matches);
    f();
    m.addEventListener("change", f);
    return () => m.removeEventListener("change", f);
  }, []);
  return d;
}

export default function PreviewCreate() {
  const [who, setWho] = useState<Who>("loggedIn");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const desktop = useIsDesktop();

  useEffect(() => {
    if (!note) return;
    const t = setTimeout(() => setNote(null), 3500);
    return () => clearTimeout(t);
  }, [note]);

  const seg = (on: boolean) => `min-h-11 flex-1 rounded-[10px] px-2 text-[14px] font-semibold transition active:scale-[0.97] ${on ? "bg-white/15 text-white" : "text-white/60"}`;
  const tog = (on: boolean) =>
    `flex min-h-11 items-center justify-center gap-2 rounded-[14px] border px-3 text-[14px] font-semibold transition active:scale-[0.97] ${
      on ? "border-[#836EF9]/60 bg-[#836EF9]/20 text-white" : "border-white/10 bg-white/[0.04] text-white/60"
    }`;

  const controls = (
    <div className="space-y-3">
      <div>
        <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">Who&apos;s looking</div>
        <div role="tablist" aria-label="Who's looking" className="flex gap-1 rounded-[14px] bg-white/[0.06] p-1">
          <button type="button" role="tab" aria-selected={who === "loggedOut"} onClick={() => setWho("loggedOut")} className={seg(who === "loggedOut")}>
            Signed out
          </button>
          <button type="button" role="tab" aria-selected={who === "loggedIn"} onClick={() => setWho("loggedIn")} className={seg(who === "loggedIn")}>
            Signed in
          </button>
        </div>
      </div>
      <div>
        <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">Extras</div>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" aria-pressed={busy} onClick={() => setBusy((b) => !b)} className={tog(busy)}>
            Busy
          </button>
          <button type="button" aria-pressed={error} onClick={() => setError((e) => !e)} className={tog(error)}>
            Error
          </button>
        </div>
      </div>
    </div>
  );

  const form = (
    <CreateFlockForm
      loggedIn={who === "loggedIn"}
      busy={busy}
      error={error ? "Launch failed: not enough test balance to lock the bond. Try a smaller bonus." : null}
      onLogin={() => setWho("loggedIn")}
      onSubmit={(v) => setNote(`Would launch "${v.title}": ${fmtUsd(v.fixedCost)} setup, ${v.minBuyers}–${v.maxBuyers} people, ${v.deadlineMinutes} min.`)}
    />
  );

  const noteEl = note && (
    <div role="status" className="fixed inset-x-4 bottom-28 z-[80] mx-auto flex max-w-md items-center gap-2 rounded-[18px] bg-white px-4 py-3 text-sm font-semibold text-black shadow-lg">
      <Info size={18} className="shrink-0" aria-hidden />
      <span className="[overflow-wrap:anywhere]">{note}</span>
    </div>
  );

  if (desktop) {
    return (
      <div className="relative flex min-h-[100dvh] items-center justify-center gap-16 overflow-hidden bg-black px-10 py-12 text-white">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#836EF9] opacity-20 blur-[160px]" aria-hidden />
        <div className="relative w-80 rounded-[28px] border border-white/10 bg-white/[0.06] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl">
          <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#836EF9]">Preview</p>
          <h1 className="mt-1 text-[28px] font-semibold tracking-tight">Create a flock</h1>
          <p className="mb-5 mt-1 text-[15px] text-white/50">Open /create for the two-column desktop layout.</p>
          {controls}
        </div>
        <PhoneFrame width={380} interactive>
          {form}
        </PhoneFrame>
        {noteEl}
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] overflow-x-clip bg-[#0A0A0F] text-white">
      <div className="sticky top-0 z-50 border-b border-white/10 bg-black/70 px-4 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 backdrop-blur-2xl">
        <div className="mx-auto max-w-md">
          <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex min-h-11 w-full items-center justify-between gap-2 text-left">
            <span className="flex items-center gap-2">
              <span className="rounded-full bg-[#FFD60A]/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-[#FFD60A]">Preview</span>
              <span className="text-[14px] text-white/60">{open ? "Pick what to see" : "Tap to change state"}</span>
            </span>
            <ChevronDown size={18} aria-hidden className={`text-white/60 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
          {open && <div className="mt-2 pb-2">{controls}</div>}
        </div>
      </div>
      {form}
      {noteEl}
    </div>
  );
}
