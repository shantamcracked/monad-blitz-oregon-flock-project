"use client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/** iOS-style notification banner that drops in from the top. The parent controls visibility. */
export function Toast({ message, icon, title = "Flock", sub = "now" }: { message: string | null; icon?: ReactNode; title?: string; sub?: string }) {
  const reduced = useReducedMotion();
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center px-3 pt-[max(2.75rem,env(safe-area-inset-top))]">
      <AnimatePresence>
        {message && (
          <motion.div
            key={message}
            role="status"
            aria-live="polite"
            initial={{ y: -120, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -120, opacity: 0 }}
            transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 30 }}
            className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-[22px] border border-white/10 bg-[#1c1c22]/80 px-4 py-3 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#836EF9] text-white">{icon ?? "🦆"}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[13px] font-semibold text-white">{title}</span>
                <span className="text-[12px] text-white/40">{sub}</span>
              </div>
              <p className="text-[15px] leading-snug text-white/85 [overflow-wrap:anywhere]">{message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Toast;
