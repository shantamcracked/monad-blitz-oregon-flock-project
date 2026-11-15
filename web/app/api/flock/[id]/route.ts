import { NextResponse } from "next/server";
import { readFlock, readBalance } from "@/lib/server/read";
import { humanError } from "@/lib/server/chain";

export const dynamic = "force-dynamic";

// GET /api/flock/1?me=0xabc…  → { flock, myBalance }
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const me = new URL(req.url).searchParams.get("me");
    const flock = await readFlock(Number(id));
    if (!flock) return NextResponse.json({ error: "Flock not found" }, { status: 404 });
    const myBalance = me && /^0x[0-9a-fA-F]{40}$/.test(me) ? await readBalance(me as `0x${string}`) : null;
    return NextResponse.json({ flock, myBalance });
  } catch (e) {
    return NextResponse.json({ error: humanError(e) }, { status: 500 });
  }
}
