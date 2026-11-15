// Simulates N phones joining a flock through the real API (onboard → sign → relay).
// Usage: npm run loadtest -- https://your-app.vercel.app 1 8
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";

const [, , base = "http://localhost:3000", idArg = "1", countArg = "5"] = process.argv;
const id = Number(idArg), count = Number(countArg);
const j = async (u, b) => { const r = await fetch(base + u, b ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(b) } : {}); return r.json(); };
const { flock: f0 } = await j(`/api/flock/${id}`);
if (!f0) throw new Error("flock not found — check id / deployment");
console.log(`Flock #${id} "${f0.title}" n=${f0.n} price=$${f0.price}  verifyingContract from deployment`);
const flockAddr = process.env.FLOCK_ADDRESS; // optional override
async function one(k) {
  const acct = privateKeyToAccount(generatePrivateKey());
  await j("/api/onboard", { address: acct.address });
  const { nonce } = await j(`/api/nonce?address=${acct.address}`);
  const sigDeadline = BigInt(Math.floor(Date.now() / 1000) + 600);
  const verifyingContract = flockAddr || (await import("../../web/lib/contracts/deployment.json", { with: { type: "json" } })).default.flock;
  const sig = await acct.signTypedData({
    domain: { name: "Flock", version: "1", chainId: 10143, verifyingContract },
    types: { Join: [{ name: "flockId", type: "uint256" }, { name: "buyer", type: "address" }, { name: "nonce", type: "uint256" }, { name: "deadline", type: "uint256" }] },
    primaryType: "Join", message: { flockId: BigInt(id), buyer: acct.address, nonce: BigInt(nonce), deadline: sigDeadline },
  });
  const t = Date.now();
  const r = await j("/api/join", { id, buyer: acct.address, sigDeadline: sigDeadline.toString(), sig });
  console.log(`duck ${k}: ${r.error ? "❌ " + r.error : "✅ " + (Date.now() - t) + "ms " + r.hash}`);
}
await Promise.all(Array.from({ length: count }, (_, k) => one(k + 1)));
const { flock } = await j(`/api/flock/${id}`);
console.log(`\nNow n=${flock.n} price=$${flock.price} status=${flock.status}`);
