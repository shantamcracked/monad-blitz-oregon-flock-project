"use client";
import Link from "next/link";
import { useState } from "react";
import Receipt from "@/components/receipt/Receipt";
import { makeMockFlock } from "@/lib/mock";

export default function PreviewReceipt() {
  const [v, setV] = useState<"success" | "failed" | "pending">("success");
  const flock = v === "failed" ? makeMockFlock(4, { status: "failed", minBuyers: 6 }) : makeMockFlock(12, { status: v === "success" ? "success" : "open" });
  const me = { address: "0xabc", joined: true, myIndex: 2, paidAtJoin: 150, rebatesSoFar: v === "failed" ? 0 : 125, balance: 475 };
  return (
    <div className="bg-[#0A0A0F]">
      <div className="sticky top-0 z-50 border-b border-white/10 bg-black/70 px-4 py-2 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-md items-center gap-1 rounded-[14px] bg-white/[0.06] p-1">
          {(["success", "failed", "pending"] as const).map((x) => (
            <button
              key={x}
              type="button"
              onClick={() => setV(x)}
              aria-pressed={v === x}
              className={`min-h-11 flex-1 rounded-[10px] text-[14px] font-semibold capitalize ${v === x ? "bg-white/15 text-white" : "text-white/60"}`}
            >
              {x}
            </button>
          ))}
          <Link href="/preview/receipt/profile" className="flex min-h-11 items-center px-3 text-[14px] font-semibold text-[#a796ff]">
            Profile
          </Link>
        </div>
      </div>
      <Receipt variant={v} flock={flock} me={me} txHash="0x1234567890abcdef" explorerBaseUrl="https://testnet.monadexplorer.com" />
    </div>
  );
}
