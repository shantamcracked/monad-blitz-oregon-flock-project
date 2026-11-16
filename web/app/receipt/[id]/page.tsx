"use client";
// OWNER: Shantam (wiring). Visuals: components/receipt/Receipt.tsx (Teammate A).
import { use } from "react";
import Receipt from "@/components/receipt/Receipt";
import { useFlock, useFlockActions } from "@/lib/useFlock";
import { EXPLORER_URL } from "@/lib/config";
import { NotReady } from "@/components/shared/NotReady";

export default function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number(use(params).id);
  const { flock, me, error, settlement } = useFlock(id, 1500);
  const { lastTx } = useFlockActions();
  if (!flock) return <NotReady error={error} />;
  const variant = flock.status === "success" ? "success" : flock.status === "failed" ? "failed" : "pending";
  return <Receipt variant={variant} flock={flock} me={me} txHash={settlement?.txHash ?? lastTx} explorerBaseUrl={EXPLORER_URL} />;
}
