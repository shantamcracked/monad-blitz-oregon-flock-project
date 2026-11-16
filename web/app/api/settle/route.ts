import { NextResponse } from "next/server";
import { publicClient, adminWallet, relayWrite, humanError, FlockAbi, FLOCK_ADDRESS } from "@/lib/server/chain";

export const dynamic = "force-dynamic";

// POST { id }  header x-admin-secret: <ADMIN_SECRET>
// With the secret → sent from the DEPLOYER (= seller of seeded flocks) so it can close a flock early once min is met.
// Without the secret → sent by a relayer (only works after the deadline).
export async function POST(req: Request) {
  try {
    const { id } = await req.json();
    const isAdmin = !!process.env.ADMIN_SECRET && req.headers.get("x-admin-secret") === process.env.ADMIN_SECRET;
    if (isAdmin) {
      const w = adminWallet();
      const { request } = await publicClient.simulateContract({ account: w.account, address: FLOCK_ADDRESS, abi: FlockAbi, functionName: "settle", args: [BigInt(id)] });
      const est = await publicClient.estimateContractGas({ account: w.account, address: FLOCK_ADDRESS, abi: FlockAbi, functionName: "settle", args: [BigInt(id)] });
      const hash = await w.writeContract({ ...request, gas: (est * 13n) / 10n });
      await publicClient.waitForTransactionReceipt({ hash });
      return NextResponse.json({ hash });
    }
    const { hash } = await relayWrite({ address: FLOCK_ADDRESS, abi: FlockAbi, functionName: "settle", args: [BigInt(id)] });
    return NextResponse.json({ hash });
  } catch (e) {
    return NextResponse.json({ error: humanError(e) }, { status: 400 });
  }
}
