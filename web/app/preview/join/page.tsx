"use client";
import { useState } from "react";
import JoinScreen from "@/components/join/JoinScreen";
import { useMockFlock } from "@/lib/mock";

export default function PreviewJoin() {
  const [state, setState] = useState<"loggedOut" | "loggedIn" | "joined">("joined");
  const { flock, me, lastRebateToast } = useMockFlock({ start: 3, everyMs: 3000, meIndex: state === "joined" ? 2 : 999 });
  return (
    <div>
      <div className="flex gap-2 p-3">
        {(["loggedOut", "loggedIn", "joined"] as const).map((x) => (
          <button key={x} onClick={() => setState(x)} className={`rounded-full px-3 py-1 text-sm ${state === x ? "bg-flock-purple" : "bg-flock-card"}`}>{x}</button>
        ))}
      </div>
      <JoinScreen
        flock={flock}
        me={me}
        loggedIn={state !== "loggedOut"}
        busy={false}
        error={null}
        lastRebateToast={state === "joined" ? lastRebateToast : null}
        onLogin={() => setState("loggedIn")}
        onJoin={() => setState("joined")}
      />
    </div>
  );
}
