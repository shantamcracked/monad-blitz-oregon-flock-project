import type { ReactNode } from "react";

const TONES = { default: "text-white", mint: "text-[#30D158]", yellow: "text-[#FFD60A]", red: "text-[#FF453A]", muted: "text-white/50" } as const;

/** Label on the left, tabular value on the right, hairline separator. */
export function StatRow({ label, value, tone = "default", className = "" }: { label: ReactNode; value: ReactNode; tone?: keyof typeof TONES; className?: string }) {
  return (
    <div className={`flex min-h-[44px] items-center justify-between gap-4 border-b border-white/[0.08] py-2.5 last:border-b-0 ${className}`}>
      <span className="text-[15px] text-white/50">{label}</span>
      <span className={`text-right text-[17px] font-semibold tabular-nums tracking-tight ${TONES[tone]}`}>{value}</span>
    </div>
  );
}

export default StatRow;
