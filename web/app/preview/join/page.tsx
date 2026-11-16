"use client";
import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { ChevronDown, Info } from "lucide-react";
import JoinScreen from "@/components/join/JoinScreen";
import { PhoneFrame } from "@/components/ui/PhoneFrame";
import { useMockFlock } from "@/lib/mock";
import type { FlockStatus } from "@/lib/types";

type Who = "loggedOut" | "loggedIn" | "joined";

const WHO: { value: Who; label: string }[] = [
  { value: "loggedOut", label: "Signed out" },
  { value: "loggedIn", label: "Signed in" },
  { value: "joined", label: "Joined" },
];

const STATUS: { value: FlockStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "success", label: "Flew" },
  { value: "failed", label: "Failed" },
];

function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">{label}</div>
      <div role="tablist" aria-label={label} className="grid auto-cols-fr grid-flow-col gap-1 rounded-[14px] bg-white/[0.06] p-1">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={o.value === value}
            onClick={() => onChange(o.value)}
            className={`min-h-11 rounded-[10px] px-2 text-[14px] font-semibold transition active:scale-[0.97] ${o.value === value ? "bg-white/15 text-white" : "text-white/60"}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Toggle({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`flex min-h-11 items-center justify-center gap-2 rounded-[14px] border px-3 text-[14px] font-semibold transition active:scale-[0.97] ${
        on ? "border-[#836EF9]/60 bg-[#836EF9]/20 text-white" : "border-white/10 bg-white/[0.04] text-white/60"
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${on ? "bg-[#30D158]" : "bg-white/20"}`} aria-hidden />
      {children}
    </button>
  );
}

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

export default function PreviewJoin() {
  const [who, setWho] = useState<Who>("joined");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [status, setStatus] = useState<FlockStatus>("open");
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const desktop = useIsDesktop();
  const { flock, me, lastRebateToast } = useMockFlock({ start: 3, everyMs: 3000, meIndex: who === "joined" ? 2 : 999 });

  useEffect(() => {
    if (!note) return;
    const t = setTimeout(() => setNote(null), 2500);
    return () => clearTimeout(t);
  }, [note]);

  const toggleBusy = () => {
    if (!busy) {
      if (who === "joined") setWho("loggedIn");
      setStatus("open");
    }
    setBusy(!busy);
  };

  const stayOnPage = (e: MouseEvent<HTMLDivElement>) => {
    const href = (e.target as HTMLElement).closest("a")?.getAttribute("href") ?? "";
    if (href.startsWith("/receipt") || href.startsWith("/f/")) {
      e.preventDefault();
      setNote("In the real app this opens that page.");
    }
  };

  const controls = (
    <div className="space-y-3">
      <Segmented label="Who's looking" value={who} options={WHO} onChange={setWho} />
      <Segmented label="Flock status" value={status} options={STATUS} onChange={setStatus} />
      <div>
        <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">Extras</div>
        <div className="grid grid-cols-2 gap-2">
          <Toggle on={busy} onClick={toggleBusy}>
            Busy
          </Toggle>
          <Toggle on={error} onClick={() => setError((x) => !x)}>
            Error
          </Toggle>
        </div>
      </div>
    </div>
  );

  const screen = (
    <div onClickCapture={stayOnPage}>
      <JoinScreen
        flock={{ ...flock, status }}
        me={me}
        loggedIn={who !== "loggedOut"}
        busy={busy}
        error={error ? "Transaction failed: insufficient test balance. Try again in a moment." : null}
        lastRebateToast={who === "joined" ? lastRebateToast : null}
        onLogin={() => setWho("loggedIn")}
        onJoin={() => setWho("joined")}
        onLogout={() => setWho("loggedOut")}
      />
    </div>
  );

  const toastNote = note && (
    <div role="status" className="fixed inset-x-4 bottom-28 z-[80] mx-auto flex max-w-md items-center gap-2 rounded-[18px] bg-white px-4 py-3 text-sm font-semibold text-black shadow-lg">
      <Info size={18} className="shrink-0" aria-hidden />
      {note}
    </div>
  );

  if (desktop) {
    return (
      <div className="relative flex min-h-[100dvh] items-center justify-center gap-16 overflow-hidden bg-black px-10 py-12 text-white">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#836EF9] opacity-20 blur-[160px]" aria-hidden />
        <div className="relative w-80 rounded-[28px] border border-white/10 bg-white/[0.06] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl">
          <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#836EF9]">Preview</p>
          <h1 className="mt-1 text-[28px] font-semibold tracking-tight">Join screen</h1>
          <p className="mb-5 mt-1 text-[15px] text-white/50">Mock data · a new Duck joins every 3s.</p>
          {controls}
        </div>
        <PhoneFrame width={380} interactive>
          {screen}
        </PhoneFrame>
        {toastNote}
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
      {screen}
      {toastNote}
    </div>
  );
}
