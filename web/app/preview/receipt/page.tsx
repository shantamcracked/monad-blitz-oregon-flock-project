"use client";
import { useState } from "react";
import Receipt from "@/components/receipt/Receipt";
import { makeMockFlock } from "@/lib/mock";

export default function PreviewReceipt() {
  const [v, setV] = useState<"success" | "failed" | "pending">("success");
  const flock = v === "failed" ? makeMockFlock(4, { status: "failed", minBuyers: 6 }) : makeMockFlock(12, { status: v === "success" ? "success" : "open" });
  const me = { address: "0xabc", joined: true, myIndex: 2, paidAtJoin: 150, rebatesSoFar: v === "failed" ? 0 : 125, balance: 475 };
  return (
    <div>
      <div className="flex gap-2 p-3">
        {(["success", "failed", "pending"] as const).map((x) => (
          <button key={x} onClick={() => setV(x)} className={`rounded-full px-3 py-1 text-sm ${v === x ? "bg-flock-purple" : "bg-flock-card"}`}>{x}</button>
        ))}
      </div>
      <Receipt variant={v} flock={flock} me={me} txHash="0x1234567890abcdef" explorerBaseUrl="https://testnet.monadexplorer.com" />
    </div>
  );
}
