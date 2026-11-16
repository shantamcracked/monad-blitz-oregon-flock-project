"use client";
import { IS_DEPLOYED } from "@/lib/config";

// Matches the dark glass design of every screen.
export function NotReady({ error }: { error: string | null }) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#0A0A0F] p-6 text-center text-[15px] text-white/60">
      {!IS_DEPLOYED ? (
        <div>
          Contracts aren&apos;t deployed yet. UI work → use the{" "}
          <a className="font-semibold text-[#a796ff] underline" href="/preview">
            /preview
          </a>{" "}
          pages.
        </div>
      ) : error ? (
        <div role="alert" className="rounded-[22px] border border-[#FF453A]/30 bg-[#FF453A]/10 px-5 py-4 text-[#ff8a82]">
          {error}
        </div>
      ) : (
        <div className="flex items-center gap-2.5">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/15 border-t-[#836EF9] motion-reduce:animate-none" aria-hidden="true" />
          Loading flock from Monad…
        </div>
      )}
    </div>
  );
}
