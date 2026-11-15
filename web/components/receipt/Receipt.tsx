"use client";
// OWNER: Teammate A (Board & Story). Shown after a flock settles (success or failure).
// Keep the props interface (ReceiptProps) exactly the same.
import { useEffect } from "react";
import confetti from "canvas-confetti";
import type { ReceiptProps } from "@/lib/types";
import { fmtUsd } from "@/lib/flock-math";

export default function Receipt({ variant, flock, me, txHash, explorerBaseUrl }: ReceiptProps) {
  useEffect(() => { if (variant === "success") confetti({ particleCount: 160, spread: 90, origin: { y: 0.3 } }); }, [variant]);
  const saved = flock.soloPrice > 0 ? Math.round((1 - flock.price / flock.soloPrice) * 100) : 0;
  const Row = ({ k, v, accent }: { k: string; v: string; accent?: boolean }) => (
    <div className="flex justify-between border-b border-flock-line py-3"><span className="text-white/60">{k}</span><span className={`font-mono ${accent ? "text-flock-mint" : ""}`}>{v}</span></div>
  );
  return (
    <div className="mx-auto min-h-screen max-w-md p-6 text-white">
      {variant === "pending" ? (
        <h1 className="text-3xl font-black">Still flying… 🦆</h1>
      ) : variant === "success" ? (
        <h1 className="text-4xl font-black">The flock flew! 🦆</h1>
      ) : (
        <h1 className="text-3xl font-black">Didn&apos;t fill — you got paid for trying 💸</h1>
      )}
      <div className="mt-2 text-white/60">{flock.title}</div>
      <div className="mt-6 rounded-3xl bg-flock-card p-5">
        <Row k="Ducks" v={`${flock.n}`} />
        {variant !== "failed" ? (
          <>
            <Row k="Final price" v={fmtUsd(flock.price)} />
            {me.paidAtJoin !== null && <Row k="You first paid" v={fmtUsd(me.paidAtJoin)} />}
            {me.joined && <Row k="Rebated to you" v={`+${fmtUsd(me.rebatesSoFar)}`} accent />}
            <Row k="Saved vs. going solo" v={`${saved}%`} accent />
          </>
        ) : (
          <>
            <Row k="Refunded" v={fmtUsd(flock.price)} />
            <Row k="Seller's bonus" v={`+${fmtUsd(flock.bonusPerBuyer)}`} accent />
            <Row k="Total back" v={fmtUsd(flock.price + flock.bonusPerBuyer)} accent />
          </>
        )}
      </div>
      <div className="mt-4 inline-block rounded-full border border-flock-line px-3 py-1 text-xs text-white/60">Settled on Monad in ~0.6s</div>
      {txHash && (
        <a className="mt-3 block text-sm text-flock-purple underline" href={`${explorerBaseUrl}/tx/${txHash}`} target="_blank" rel="noreferrer">
          View transaction ↗
        </a>
      )}
    </div>
  );
}
