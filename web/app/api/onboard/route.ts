import { NextResponse } from "next/server";
import { relayWrite, humanError, FlockUSDAbi, USD_ADDRESS } from "@/lib/server/chain";
import { readBalance } from "@/lib/server/read";

export const dynamic = "force-dynamic";

// POST { address } → gives $500 test dollars if balance < $100. Relayer pays gas.
export async function POST(req: Request) {
  try {
    const { address } = await req.json();
    if (!/^0x[0-9a-fA-F]{40}$/.test(address)) return NextResponse.json({ error: "bad address" }, { status: 400 });
    let balance = await readBalance(address);
    let hash: string | null = null;
    if (balance < 100) {
      const r = await relayWrite({ address: USD_ADDRESS, abi: FlockUSDAbi, functionName: "faucet", args: [address] });
      hash = r.hash;
      balance = await readBalance(address);
    }
    return NextResponse.json({ balance, hash });
  } catch (e) {
    return NextResponse.json({ error: humanError(e) }, { status: 500 });
  }
}
