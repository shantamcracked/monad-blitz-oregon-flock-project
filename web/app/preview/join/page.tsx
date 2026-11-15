"use client";
import { useState } from "react";
import JoinScreen from "@/components/join/JoinScreen";
import { useMockFlock } from "@/lib/mock";
import type { FlockStatus } from "@/lib/types";

export default function PreviewJoin() {
  const [state, setState] = useState<"loggedOut" | "loggedIn" | "joined">("joined");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [status, setStatus] = useState<FlockStatus>("open");
  const { flock, me, lastRebateToast } = useMockFlock({ start: 3, everyMs: 3000, meIndex: state === "joined" ? 2 : 999 });

  const chip = (on: boolean) => `rounded-full px-3 py-1 text-sm ${on ? "bg-flock-purple" : "bg-flock-card"}`;

  return (
    <div className="bg-flock-ink text-white">
      <div className="flex flex-wrap gap-2 p-3">
        {(["loggedOut", "loggedIn", "joined"] as const).map((x) => (
          <button key={x} onClick={() => setState(x)} className={chip(state === x)}>{x}</button>
        ))}
        <button onClick={() => setBusy((b) => !b)} className={chip(busy)}>busy</button>
        <button onClick={() => setError((e) => !e)} className={chip(error)}>error</button>
        {(["open", "success", "failed"] as const).map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={chip(status === s)}>{s}</button>
        ))}
      </div>
      <JoinScreen
        flock={{ ...flock, status }}
        me={me}
        loggedIn={state !== "loggedOut"}
        busy={busy}
        error={error ? "Transaction failed: insufficient test balance. Try again in a moment." : null}
        lastRebateToast={state === "joined" ? lastRebateToast : null}
        onLogin={() => setState("loggedIn")}
        onJoin={() => setState("joined")}
        onLogout={() => setState("loggedOut")}
      />
    </div>
  );
}
