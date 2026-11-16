"use client";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";

const SCREEN_W = 390;
const SCREEN_H = 844;
const BEZEL = 12;

/**
 * Pure-CSS iPhone-style device. Screen contents render at a true 390px phone width and are
 * scaled to fit, so they stay crisp. Fixed-position children (CTA bars, toasts) are contained
 * inside the screen because the scaled layer is a transformed ancestor.
 */
export function PhoneFrame({
  children,
  width = 320,
  tilt = { x: 0, y: 0 },
  float = false,
  interactive = false,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  width?: number;
  tilt?: { x: number; y: number };
  float?: boolean;
  interactive?: boolean;
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  const [finePointer, setFinePointer] = useState(false);
  useEffect(() => setFinePointer(window.matchMedia("(pointer: fine)").matches), []);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 150, damping: 20 });
  const sy = useSpring(my, { stiffness: 150, damping: 20 });
  const rotateY = useTransform(sx, (v) => tilt.y + (reduced ? 0 : v * 12));
  const rotateX = useTransform(sy, (v) => tilt.x - (reduced ? 0 : v * 12));
  const live = interactive && finePointer && !reduced;

  const innerW = width - BEZEL * 2;
  const scale = innerW / SCREEN_W;
  const innerH = SCREEN_H * scale;

  return (
    <div
      className={`shrink-0 ${className}`}
      style={{ perspective: 1600, width }}
      onMouseMove={
        live
          ? (e) => {
              const r = e.currentTarget.getBoundingClientRect();
              mx.set((e.clientX - r.left) / r.width - 0.5);
              my.set((e.clientY - r.top) / r.height - 0.5);
            }
          : undefined
      }
      onMouseLeave={
        live
          ? () => {
              mx.set(0);
              my.set(0);
            }
          : undefined
      }
    >
      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        animate={float && !reduced ? { y: [0, -8, 0, 8, 0] } : { y: 0 }}
        transition={float && !reduced ? { duration: 6, repeat: Infinity, ease: "easeInOut", delay } : { duration: 0 }}
      >
        <div
          className="relative rounded-[56px] bg-[linear-gradient(145deg,#8d8a86_0%,#3b3a39_18%,#9a9792_42%,#2c2b2a_62%,#7d7a76_85%,#4a4947_100%)] p-[2px] shadow-[0_50px_100px_-30px_rgba(0,0,0,0.9),0_30px_60px_-40px_rgba(131,110,249,0.5)]"
          style={{ width }}
        >
          <div className="rounded-[54px] bg-[#0b0b0c] p-[10px] shadow-[inset_0_0_0_1.5px_rgba(255,255,255,0.06)]">
            <div className="relative overflow-hidden rounded-[44px] bg-black" style={{ width: innerW, height: innerH }}>
              {/* scaled layer = containing block for position:fixed children; inner div scrolls */}
              <div className="absolute left-0 top-0" style={{ width: SCREEN_W, height: SCREEN_H, transform: `scale(${scale})`, transformOrigin: "top left" }}>
                <div className="h-full w-full overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{children}</div>
              </div>
              {/* dynamic island */}
              <div className="pointer-events-none absolute left-1/2 top-[10px] z-[70] h-[26px] w-[34%] -translate-x-1/2 rounded-full bg-black" aria-hidden="true" />
              {/* glass reflection */}
              <div
                className="pointer-events-none absolute inset-0 z-[71] rounded-[44px] bg-[linear-gradient(115deg,rgba(255,255,255,0.10)_0%,rgba(255,255,255,0.02)_28%,transparent_45%)]"
                aria-hidden="true"
              />
            </div>
          </div>
          {/* side buttons */}
          <span className="absolute -left-[3px] top-[22%] h-12 w-[3px] rounded-l bg-[#5c5a57]" aria-hidden="true" />
          <span className="absolute -left-[3px] top-[33%] h-16 w-[3px] rounded-l bg-[#5c5a57]" aria-hidden="true" />
          <span className="absolute -right-[3px] top-[28%] h-20 w-[3px] rounded-r bg-[#5c5a57]" aria-hidden="true" />
        </div>
      </motion.div>
    </div>
  );
}

export default PhoneFrame;
