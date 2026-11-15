"use client";
import { useEffect, useState } from "react";
import { ChevronDown, Info } from "lucide-react";
import CreateFlockForm from "@/components/create/CreateFlockForm";
import { fmtUsd } from "@/lib/flock-math";

type Who = "loggedOut" | "loggedIn";

export default function PreviewCreate() {
  const [who, setWho] = useState<Who>("loggedIn");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(true);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    if (!note) return;
    const t = setTimeout(() => setNote(null), 3500);
    return () => clearTimeout(t);
  }, [note]);

  const tab = (on: boolean) =>
    `min-h-12 rounded-lg px-2 text-sm font-semibold transition active:scale-[0.97] ${on ? "bg-white text-slate-950 shadow-sm" : "text-slate-700"}`;
  const toggle = (on: boolean) =>
    `flex min-h-12 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold transition active:scale-[0.97] ${
      on ? "border-sky-300 bg-sky-100 text-slate-950" : "border-slate-200 bg-white text-slate-700"
    }`;
  const dot = (on: boolean) => <span className={`h-2.5 w-2.5 rounded-full ${on ? "bg-emerald-600" : "bg-slate-300"}`} aria-hidden />;

  return (
    <div className="min-h-[100dvh] overflow-x-clip bg-[#f4f7fb] text-slate-950">
      <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 shadow-sm backdrop-blur">
        <div className="mx-auto max-w-md lg:max-w-6xl">
          <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex min-h-12 w-full items-center justify-between gap-2 text-left">
            <span className="flex min-w-0 items-center gap-2">
              <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-amber-800">Preview</span>
              <span className="truncate text-sm text-slate-600">
                {open ? "Pick what to see" : `${who === "loggedIn" ? "Signed in" : "Signed out"}${busy ? " · Busy" : ""}${error ? " · Error" : ""}`}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-slate-600">
              {open ? "Hide" : "Show"}
              <ChevronDown size={18} aria-hidden className={`transition-transform ${open ? "rotate-180" : ""}`} />
            </span>
          </button>
          {open && (
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <div>
                <div className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Who&apos;s looking</div>
                <div role="tablist" aria-label="Who's looking" className="grid grid-cols-2 gap-1 rounded-xl bg-slate-200/70 p-1">
                  <button type="button" role="tab" aria-selected={who === "loggedOut"} onClick={() => setWho("loggedOut")} className={tab(who === "loggedOut")}>
                    Signed out
                  </button>
                  <button type="button" role="tab" aria-selected={who === "loggedIn"} onClick={() => setWho("loggedIn")} className={tab(who === "loggedIn")}>
                    Signed in
                  </button>
                </div>
              </div>
              <div>
                <div className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Extras</div>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" aria-pressed={busy} onClick={() => setBusy((b) => !b)} className={toggle(busy)}>
                    {dot(busy)} Busy
                  </button>
                  <button type="button" aria-pressed={error} onClick={() => setError((e) => !e)} className={toggle(error)}>
                    {dot(error)} Error
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <CreateFlockForm
        loggedIn={who === "loggedIn"}
        busy={busy}
        error={error ? "Launch failed: not enough test balance to lock the bond. Try a smaller bonus." : null}
        onLogin={() => setWho("loggedIn")}
        onSubmit={(v) => setNote(`Would launch "${v.title}": ${fmtUsd(v.fixedCost)} setup, ${v.minBuyers}–${v.maxBuyers} people, ${v.deadlineMinutes} min.`)}
      />

      {note && (
        <div role="status" className="fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-md items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg">
          <Info size={18} className="shrink-0" aria-hidden />
          <span className="[overflow-wrap:anywhere]">{note}</span>
        </div>
      )}
    </div>
  );
}
