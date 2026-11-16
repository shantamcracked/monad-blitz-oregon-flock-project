"use client";
import { IS_DEPLOYED } from "@/lib/config";

// Light "bookings" look so the loading state matches the join/create/landing screens.
export function NotReady({ error }: { error: string | null }) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#f4f7fb] bg-[radial-gradient(ellipse_at_top_left,#e2efff,transparent_55%)] p-6 text-center text-sm text-slate-600">
      {!IS_DEPLOYED ? (
        <div>Contracts aren&apos;t deployed yet. UI work → use the <a className="font-semibold text-sky-800 underline" href="/preview">/preview</a> pages.</div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-800">{error}</div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-sky-200 border-t-sky-700" aria-hidden="true" />
          Loading flock from Monad…
        </div>
      )}
    </div>
  );
}
