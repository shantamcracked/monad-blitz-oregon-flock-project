"use client";
import { fmtUsd } from "@/lib/flock-math";

/**
 * Rolls digit-by-digit between values (odometer style) with tabular figures.
 * Digit columns are keyed from the right so they stay aligned as the value changes.
 */
export function AnimatedNumber({ value, format = fmtUsd, className = "" }: { value: number; format?: (v: number) => string; className?: string }) {
  const text = format(value);
  const chars = text.split("");
  return (
    <span className={`inline-flex tabular-nums ${className}`} role="text" aria-label={text}>
      {chars.map((ch, i) => {
        const key = chars.length - i;
        if (!/\d/.test(ch)) {
          return (
            <span key={`s${key}-${ch}`} aria-hidden="true">
              {ch}
            </span>
          );
        }
        const d = Number(ch);
        return (
          <span key={`d${key}`} aria-hidden="true" className="relative inline-block h-[1em] overflow-hidden leading-none" style={{ width: "0.6em" }}>
            <span
              className="absolute left-0 top-0 flex w-full flex-col items-center transition-transform duration-[650ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
              style={{ transform: `translateY(${-d}em)` }}
            >
              {Array.from({ length: 10 }, (_, k) => (
                <span key={k} className="block h-[1em] leading-none">
                  {k}
                </span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
}

export default AnimatedNumber;
