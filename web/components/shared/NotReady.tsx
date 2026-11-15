"use client";
import { IS_DEPLOYED } from "@/lib/config";

export function NotReady({ error }: { error: string | null }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6 text-center text-white/70">
      {!IS_DEPLOYED ? (
        <div>Contracts aren&apos;t deployed yet. UI work → use the <a className="text-flock-purple underline" href="/preview">/preview</a> pages.</div>
      ) : error ? (
        <div>⚠ {error}</div>
      ) : (
        <div className="animate-pulse">Loading flock from Monad…</div>
      )}
    </div>
  );
}
