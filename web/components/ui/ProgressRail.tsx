"use client";
import { motion, useReducedMotion } from "framer-motion";

/** Thin rail showing n/max with a yellow marker at the minimum. */
export function ProgressRail({ n, max, min, className = "", height = 6, labels = true }: { n: number; max: number; min: number; className?: string; height?: number; labels?: boolean }) {
  const reduced = useReducedMotion();
  const pct = Math.min(100, (n / Math.max(1, max)) * 100);
  const minPct = Math.min(100, (min / Math.max(1, max)) * 100);
  const reached = n >= min;
  return (
    <div className={className}>
      <div
        className="relative w-full rounded-full bg-white/10"
        style={{ height }}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={n}
        aria-label={`${n} of ${max} joined, minimum ${min}`}
      >
        <motion.div
          className={`absolute inset-y-0 left-0 rounded-full ${reached ? "bg-[#30D158]" : "bg-[#836EF9]"}`}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 30 }}
        />
        {min < max && <span className="absolute -top-1 -bottom-1 w-[2px] rounded-full bg-[#FFD60A]" style={{ left: `calc(${minPct}% - 1px)` }} aria-hidden="true" />}
      </div>
      {labels && (
        <div className="mt-2 flex justify-between text-[13px] tabular-nums text-white/50">
          <span>
            <span className="font-semibold text-white">{n}</span> / {max} joined
          </span>
          <span className="text-[#FFD60A]/90">min {min}</span>
        </div>
      )}
    </div>
  );
}

export default ProgressRail;
