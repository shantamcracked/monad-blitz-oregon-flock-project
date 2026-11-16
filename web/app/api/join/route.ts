import { NextResponse } from "next/server";
import { relayWrite, humanError, FlockAbi, FLOCK_ADDRESS } from "@/lib/server/chain";

export const dynamic = "force-dynamic";

// POST { id, buyer, sigDeadline, sig } → relays Flock.joinFor (buyer signed EIP-712; relayer pays gas)
export async function POST(req: Request) {
  try {
    const { id, buyer, sigDeadline, sig } = await req.json();
    const t0 = Date.now();
    const { hash } = await relayWrite({
      address: FLOCK_ADDRESS,
      abi: FlockAbi,
      functionName: "joinFor",
      args: [BigInt(id), buyer, BigInt(sigDeadline), sig],
    });
    return NextResponse.json({ hash, ms: Date.now() - t0 });
  } catch (e) {
    return NextResponse.json({ error: humanError(e) }, { status: 400 });
  }
}
