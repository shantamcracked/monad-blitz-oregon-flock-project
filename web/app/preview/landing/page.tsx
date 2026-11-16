"use client";
import Landing from "@/components/landing/Landing";
import { MOCK_FLOCKS } from "@/lib/mock";

export default function PreviewLanding() {
  return <Landing flocks={MOCK_FLOCKS} onStartFlock={() => alert("would open /create")} />;
}
