"use client";
import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { ChevronDown, Info } from "lucide-react";
import JoinScreen from "@/components/join/JoinScreen";
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
  { value: "success", label: "Flew 🎉" },
  { value: "failed", label: "Failed 🛟" },
];

/** Full-width segmented tabs: one big, obvious choice per row. */
function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">{label}</div>
      <div role="tablist" aria-label={label} className="grid grid-flow-col auto-cols-fr gap-1 rounded-2xl bg-flock-ink p-1">
        {options.map((o) => {
          const on = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => onChange(o.value)}
              className={`min-h-12 rounded-xl px-2 text-sm font-bold transition active:scale-[0.97] ${
                on ? "bg-flock-purple text-white shadow-md shadow-flock-purple/30" : "text-white/60"
              }`}
            >
              {o.label}
            </button>
          );
        })}
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
      className={`flex min-h-12 items-center justify-center gap-2 rounded-2xl border px-3 text-sm font-bold transition active:scale-[0.97] ${
        on ? "border-flock-purple bg-flock-purple/20 text-white" : "border-flock-line bg-flock-ink text-white/60"
      }`}
    >
      <span className={`h-2.5 w-2.5 rounded-full ${on ? "bg-flock-mint" : "bg-white/20"}`} aria-hidden />
      {children}
    </button>
  );
}

export default function PreviewJoin() {
  const [who, setWho] = useState<Who>("joined");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [status, setStatus] = useState<FlockStatus>("open");
  const [open, setOpen] = useState(true);
  const [note, setNote] = useState<string | null>(null);
  const { flock, me, lastRebateToast } = useMockFlock({ start: 3, everyMs: 3000, meIndex: who === "joined" ? 2 : 999 });

  useEffect(() => {
    if (!note) return;
    const t = setTimeout(() => setNote(null), 2500);
    return () => clearTimeout(t);
  }, [note]);

  // "Busy" only shows on the join button, so jump to a state where it's visible.
  const toggleBusy = () => {
    if (!busy) {
      if (who === "joined") setWho("loggedIn");
      setStatus("open");
    }
    setBusy(!busy);
  };

  // In the preview, keep the receipt link on this page so the browser's swipe-back/forward
  // gesture doesn't bounce between the preview and a receipt page.
  const stayOnPage = (e: MouseEvent<HTMLDivElement>) => {
    const a = (e.target as HTMLElement).closest("a");
    if (a && a.getAttribute("href")?.startsWith("/receipt")) {
      e.preventDefault();
      setNote("In the real app this opens the receipt.");
    }
  };

  const whoLabel = WHO.find((w) => w.value === who)?.label;
  const statusLabel = STATUS.find((s) => s.value === status)?.label;

  return (
    <div className="min-h-[100dvh] overflow-x-clip bg-flock-ink text-white">
      <div className="sticky top-0 z-40 border-b border-flock-line bg-flock-card/95 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 backdrop-blur">
        <div className="mx-auto max-w-md">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="flex min-h-12 w-full items-center justify-between gap-2 text-left"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="shrink-0 rounded-full bg-flock-gold/20 px-2.5 py-1 text-[11px] font-black uppercase tracking-widest text-flock-gold">
                Preview
              </span>
              <span className="truncate text-sm text-white/70">
                {open ? "Pick what to see" : `${whoLabel} · ${statusLabel}${busy ? " · Busy" : ""}${error ? " · Error" : ""}`}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-white/60">
              {open ? "Hide" : "Show"}
              <ChevronDown size={18} aria-hidden className={`transition-transform ${open ? "rotate-180" : ""}`} />
            </span>
          </button>

          {open && (
            <div className="mt-2 space-y-3">
              <Segmented label="Who's looking" value={who} options={WHO} onChange={setWho} />
              <Segmented label="Flock status" value={status} options={STATUS} onChange={setStatus} />
              <div>
                <div className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">Extras</div>
                <div className="grid grid-cols-2 gap-2">
                  <Toggle on={busy} onClick={toggleBusy}>
                    Busy
                  </Toggle>
                  <Toggle on={error} onClick={() => setError((e) => !e)}>
                    Error
                  </Toggle>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

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

      {note && (
        <div
          role="status"
          className="fixed inset-x-4 top-[calc(5rem+env(safe-area-inset-top))] z-50 mx-auto flex max-w-md items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-flock-ink shadow-xl"
        >
          <Info size={18} className="shrink-0" aria-hidden />
          {note}
        </div>
      )}
    </div>
  );
}
