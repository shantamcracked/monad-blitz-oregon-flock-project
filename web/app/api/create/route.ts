import { NextResponse } from "next/server";
import { decodeEventLog } from "viem";
import { relayWrite, humanError, FlockAbi, FLOCK_ADDRESS } from "@/lib/server/chain";

export const dynamic = "force-dynamic";

// POST { seller, title, imageUrl, fixedCost, unitCost, bonusPerBuyer, deadline, minBuyers, maxBuyers, sigDeadline, sig }
// (money fields are 6-decimal integer strings; deadline/sigDeadline unix seconds)
export async function POST(req: Request) {
  try {
    const b = await req.json();
    const { hash, receipt } = await relayWrite({
      address: FLOCK_ADDRESS,
      abi: FlockAbi,
      functionName: "createFlockFor",
      args: [b.seller, b.title, b.imageUrl || "", BigInt(b.fixedCost), BigInt(b.unitCost), BigInt(b.bonusPerBuyer), BigInt(b.deadline), Number(b.minBuyers), Number(b.maxBuyers), BigInt(b.sigDeadline), b.sig],
    });
    let id: string | null = null;
    for (const l of receipt.logs) {
      try {
        const ev = decodeEventLog({ abi: FlockAbi, data: l.data, topics: l.topics });
        if (ev.eventName === "FlockCreated") id = String((ev.args as unknown as { id: bigint }).id);
      } catch {}
    }
    return NextResponse.json({ hash, id });
  } catch (e) {
    return NextResponse.json({ error: humanError(e) }, { status: 400 });
  }
}
