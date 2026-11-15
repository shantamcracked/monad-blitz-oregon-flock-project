"use client";
// OWNER: Shantam (wiring). Visuals live in components/landing/Landing.tsx (Teammate A).
import { useRouter } from "next/navigation";
import Landing from "@/components/landing/Landing";
import { useFlocks } from "@/lib/useFlock";
import { IS_DEPLOYED } from "@/lib/config";
import { MOCK_FLOCKS } from "@/lib/mock";

export default function Home() {
  const router = useRouter();
  const live = useFlocks();
  return <Landing flocks={IS_DEPLOYED ? live : MOCK_FLOCKS} onStartFlock={() => router.push("/create")} />;
}
