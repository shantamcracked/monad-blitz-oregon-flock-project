import { NextResponse } from "next/server";
import { readFlocks } from "@/lib/server/read";
import { humanError } from "@/lib/server/chain";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ flocks: await readFlocks(12) });
  } catch (e) {
    return NextResponse.json({ error: humanError(e), flocks: [] }, { status: 500 });
  }
}
