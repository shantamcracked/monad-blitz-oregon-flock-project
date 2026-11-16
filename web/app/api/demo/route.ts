import { NextResponse } from "next/server";
import { decodeEventLog, parseUnits } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { publicClient, adminWallet, relayWrite, humanError, FlockAbi, FlockUSDAbi, FLOCK_ADDRESS, USD_ADDRESS } from "@/lib/server/chain";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Stage-demo helpers. Header x-admin-secret: <ADMIN_SECRET>.
//   POST { action: "bot-join", id }  → a fresh simulated buyer gets test dollars and joins flock `id` (real on-chain joinFor)
//   POST { action: "fail-create" }   → creates a short-fuse flock (deadline ~30s) that is meant to miss its minimum
export async function POST(req: Request) {
  if (!process.env.ADMIN_SECRET || req.headers.get("x-admin-secret") !== process.env.ADMIN_SECRET)
    return NextResponse.json({ error: "Admin secret missing or wrong (add ?admin=SECRET to the board URL)" }, { status: 401 });
  try {
    const body = await req.json();

    if (body.action === "bot-join") {
      const id = BigInt(body.id);
      const bot = privateKeyToAccount(generatePrivateKey());
      await relayWrite({ address: USD_ADDRESS, abi: FlockUSDAbi, functionName: "faucet", args: [bot.address] });
      const sigDeadline = BigInt(Math.floor(Date.now() / 1000) + 600);
      const sig = await bot.signTypedData({
        domain: { name: "Flock", version: "1", chainId: 10143, verifyingContract: FLOCK_ADDRESS },
        types: { Join: [{ name: "flockId", type: "uint256" }, { name: "buyer", type: "address" }, { name: "nonce", type: "uint256" }, { name: "deadline", type: "uint256" }] },
        primaryType: "Join",
        message: { flockId: id, buyer: bot.address, nonce: 0n, deadline: sigDeadline },
      });
      const { hash } = await relayWrite({ address: FLOCK_ADDRESS, abi: FlockAbi, functionName: "joinFor", args: [id, bot.address, sigDeadline, sig] });
      return NextResponse.json({ hash, buyer: bot.address });
    }

    if (body.action === "fail-create") {
      const w = adminWallet();
      const seconds = Math.min(Math.max(Number(body.seconds) || 30, 15), 300);
      const deadline = BigInt(Math.floor(Date.now() / 1000) + seconds);
      const $ = (x: number) => parseUnits(String(x), 6);
      // seller (deployer) needs test dollars for the bond
      const bal = (await publicClient.readContract({ address: USD_ADDRESS, abi: FlockUSDAbi, functionName: "balanceOf", args: [w.account.address] })) as bigint;
      if (bal < $(100)) await relayWrite({ address: USD_ADDRESS, abi: FlockUSDAbi, functionName: "faucet", args: [w.account.address] });
      const args = ["Late-night taco run 🌮 (fail demo)", "/img/tacos.svg", $(160), 0n, $(3), deadline, 8, 8] as const;
      const est = await publicClient.estimateContractGas({ account: w.account, address: FLOCK_ADDRESS, abi: FlockAbi, functionName: "createFlock", args });
      const hash = await w.writeContract({ address: FLOCK_ADDRESS, abi: FlockAbi, functionName: "createFlock", args, gas: (est * 13n) / 10n, chain: w.chain, account: w.account });
      const r = await publicClient.waitForTransactionReceipt({ hash });
      let id: string | null = null;
      for (const l of r.logs) {
        try {
          const ev = decodeEventLog({ abi: FlockAbi, data: l.data, topics: l.topics }) as unknown as { eventName: string; args: { id: bigint } };
          if (ev.eventName === "FlockCreated") id = ev.args.id.toString();
        } catch {}
      }
      if (!id) throw new Error("Flock created but id not found");
      return NextResponse.json({ id, hash, deadline: Number(deadline) * 1000 });
    }

    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: humanError(e) }, { status: 400 });
  }
}
