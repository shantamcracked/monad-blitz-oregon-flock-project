import { NextResponse } from "next/server";
import { readNonce } from "@/lib/server/read";
import { humanError } from "@/lib/server/chain";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const a = new URL(req.url).searchParams.get("address") || "";
    if (!/^0x[0-9a-fA-F]{40}$/.test(a)) return NextResponse.json({ error: "bad address" }, { status: 400 });
    return NextResponse.json({ nonce: (await readNonce(a as `0x${string}`)).toString() });
  } catch (e) {
    return NextResponse.json({ error: humanError(e) }, { status: 500 });
  }
}
