"use client";
import LiveBoard from "@/components/board/LiveBoard";
import { useMockFlock } from "@/lib/mock";

export default function PreviewBoard() {
  const { flock } = useMockFlock({ start: 2, everyMs: 2500 });
  return <LiveBoard flock={flock} joinUrl="https://example.com/f/1" blockTimeMs={300} />;
}
