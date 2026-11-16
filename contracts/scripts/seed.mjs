// Creates the demo flocks on Monad testnet. Seller = deployer.
// Usage: npm run seed            → creates the 3 standard demo flocks
//        npm run seed -- fail 4  → creates ONLY a "fail demo" flock that expires in 4 minutes
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createPublicClient, createWalletClient, http, parseUnits, decodeEventLog } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { monadTestnet } from "viem/chains";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rpc = process.env.MONAD_RPC_URL || "https://testnet-rpc.monad.xyz";
const pk = process.env.DEPLOYER_PRIVATE_KEY;
const account = privateKeyToAccount(pk.startsWith("0x") ? pk : `0x${pk}`);
const pub = createPublicClient({ chain: monadTestnet, transport: http(rpc) });
const wallet = createWalletClient({ chain: monadTestnet, account, transport: http(rpc) });
const dep = JSON.parse(fs.readFileSync(path.join(root, "deployments.json"), "utf8"));
const flockAbi = JSON.parse(fs.readFileSync(path.join(root, "out", "Flock.json"), "utf8")).abi;
const usdAbi = JSON.parse(fs.readFileSync(path.join(root, "out", "FlockUSD.json"), "utf8")).abi;
const $ = (x) => parseUnits(String(x), 6);
const nowS = () => BigInt(Math.floor(Date.now() / 1000));

async function tx(address, abi, functionName, args) {
  const gas = await pub.estimateContractGas({ account, address, abi, functionName, args });
  const hash = await wallet.writeContract({ address, abi, functionName, args, gas: (gas * 13n) / 10n });
  const r = await pub.waitForTransactionReceipt({ hash });
  if (r.status !== "success") throw new Error(`${functionName} reverted ${hash}`);
  return r;
}

// make sure the seller (deployer) has fUSD for bonds
const usdBal = await pub.readContract({ address: dep.usd, abi: usdAbi, functionName: "balanceOf", args: [account.address] });
if (usdBal < $(100)) await tx(dep.usd, usdAbi, "faucet", [account.address]);

const [, , mode, mins] = process.argv;
const flocks =
  mode === "fail"
    ? [{ title: "Late-night taco run 🌮 (fail demo)", img: "/img/tacos.svg", F: 160, c: 0, bonus: 3, min: 12, max: 20, minutes: Number(mins || 4) }]
    : [
        { title: "Thanksgiving van → PDX 🦃", img: "/img/van.svg", F: 300, c: 0, bonus: 2, min: 6, max: 12, minutes: 8 * 60 },
        { title: "OBG × Monad Blitz hoodie", img: "/img/hoodie.svg", F: 120, c: 14, bonus: 1, min: 10, max: 40, minutes: 8 * 60 },
        { title: "Late-night taco run 🌮 (fail demo)", img: "/img/tacos.svg", F: 160, c: 0, bonus: 3, min: 12, max: 20, minutes: 6 * 60 },
      ];

for (const f of flocks) {
  const deadline = nowS() + BigInt(f.minutes * 60);
  const r = await tx(dep.flock, flockAbi, "createFlock", [f.title, f.img, $(f.F), $(f.c), $(f.bonus), deadline, f.min, f.max]);
  const log = r.logs.map((l) => { try { return decodeEventLog({ abi: flockAbi, ...l }); } catch { return null; } }).find((e) => e?.eventName === "FlockCreated");
  console.log(`#${log.args.id}  ${f.title}  deadline in ${f.minutes} min  → /f/${log.args.id}  board: /board/${log.args.id}`);
}
