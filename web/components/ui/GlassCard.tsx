import type { HTMLAttributes, ReactNode } from "react";

/** Frosted-glass surface: the base material for every card in Flock. */
export function GlassCard({ children, className = "", strong = false, ...rest }: HTMLAttributes<HTMLDivElement> & { children?: ReactNode; strong?: boolean }) {
  return (
    <div
      {...rest}
      className={`rounded-[28px] border border-white/10 ${strong ? "bg-white/[0.09]" : "bg-white/[0.06]"} shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl ${className}`}
    >
      {children}
    </div>
  );
}

export default GlassCard;
