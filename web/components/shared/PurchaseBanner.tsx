"use client";
// Shows the on-chain purchase (or refund) tx once a flock settles, with an explorer link.
// `board` = projector size with a QR so the room can open the tx on their phones.
import { ExternalLink, ShoppingBag, Undo2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { Settlement } from "@/lib/useFlock";
import { EXPLORER_URL } from "@/lib/config";
import { fmtUsd } from "@/lib/flock-math";

export function PurchaseBanner({ s, board = false, className = "" }: { s: Settlement; board?: boolean; className?: string }) {
  const url = `${EXPLORER_URL}/tx/${s.txHash}`;
  const short = `${s.txHash.slice(0, 10)}…${s.txHash.slice(-6)}`;
  const purchase = s.kind === "purchase";
  const Icon = purchase ? ShoppingBag : Undo2;
  const headline = purchase
    ? `Purchased on Monad${s.paidToSeller !== null ? ` · ${fmtUsd(s.paidToSeller)} paid to seller` : ""}`
    : "Refunds + bonus sent on Monad";

  if (board) {
    return (
      <div className={`flex items-center gap-[1.5vw] rounded-[28px] border border-white/15 bg-white/[0.08] p-[1.2vw] pr-[2vw] text-white shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-2xl ${className}`}>
        <div className="shrink-0 rounded-[16px] bg-white p-[0.5vw]">
          <QRCodeSVG value={url} size={256} marginSize={1} level="M" className="h-[clamp(84px,7vw,140px)] w-[clamp(84px,7vw,140px)]" title="Scan to view the purchase on the Monad explorer" />
        </div>
        <div className="min-w-0 text-left">
          <div className="flex items-center gap-2 text-[clamp(14px,1.1vw,20px)] font-semibold uppercase tracking-[0.14em] text-[#30D158]">
            <Icon size={20} strokeWidth={1.75} aria-hidden="true" /> {purchase ? "On-chain purchase" : "On-chain refund"}
          </div>
          <div className="mt-1 text-[clamp(20px,1.8vw,34px)] font-semibold tracking-tight">{headline}</div>
          <a href={url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1.5 font-mono text-[clamp(13px,1vw,18px)] text-white/60 hover:text-white">
            tx {short} · block {s.block.toLocaleString()} <ExternalLink size={14} aria-hidden="true" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={`flex min-h-11 items-center gap-3 rounded-[18px] border border-[#30D158]/30 bg-[#30D158]/10 px-4 py-2.5 text-white backdrop-blur-2xl ${className}`}
    >
      <Icon size={18} strokeWidth={1.75} className="shrink-0 text-[#30D158]" aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-semibold leading-tight">{headline}</span>
        <span className="block truncate font-mono text-[12px] text-white/50">tx {short}</span>
      </span>
      <ExternalLink size={16} className="shrink-0 text-white/50" aria-hidden="true" />
    </a>
  );
}
