"use client";
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "light";

const STYLES: Record<Variant, string> = {
  primary: "bg-[#836EF9] text-white shadow-[0_8px_30px_-8px_rgba(131,110,249,0.7)] hover:bg-[#8f7cff]",
  secondary: "bg-white/10 text-white border border-white/15 hover:bg-white/15",
  ghost: "bg-transparent text-white/70 hover:text-white",
  light: "bg-white text-black hover:bg-white/90",
};

export function Spinner({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`inline-block h-[1em] w-[1em] animate-spin rounded-full border-2 border-current border-t-transparent ${className}`} />;
}

/** Apple-style pill button with press-scale and a loading state. */
export function PillButton({
  children,
  variant = "primary",
  loading = false,
  loadingLabel,
  disabled,
  onClick,
  type = "button",
  className = "",
  size = "lg",
  ...aria
}: {
  children: ReactNode;
  variant?: Variant;
  loading?: boolean;
  loadingLabel?: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
  size?: "md" | "lg";
  "aria-label"?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      whileTap={reduced || disabled || loading ? undefined : { scale: 0.97 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`inline-flex items-center justify-center gap-2 rounded-[22px] font-semibold tracking-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#836EF9] focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:opacity-50 ${
        size === "lg" ? "min-h-[56px] px-7 text-[17px]" : "min-h-[44px] px-5 text-[15px]"
      } ${STYLES[variant]} ${className}`}
      {...aria}
    >
      {loading ? (
        <>
          <Spinner />
          {loadingLabel ?? children}
        </>
      ) : (
        children
      )}
    </motion.button>
  );
}

export default PillButton;
