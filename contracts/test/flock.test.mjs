// Run: npm test   (local in-memory chain via Ganache — no testnet funds needed)
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ganache from "ganache";
import { createWalletClient, createPublicClient, custom, parseUnits, keccak256, toBytes } from "viem";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";

const FlockUSD = JSON.parse(fs.readFileSync(new URL("../out/FlockUSD.json", import.meta.url)));
const Flock = JSON.parse(fs.readFileSync(new URL("../out/Flock.json", import.meta.url)));

const keys = Array.from({ length: 70 }, () => generatePrivateKey());
const provider = ganache.provider({
  logging: { quiet: true },
  wallet: { accounts: keys.map((k) => ({ secretKey: k, balance: "0x" + (10n ** 21n).toString(16) })) },
  chain: { chainId: 10143 },
});
const chain = { id: 10143, name: "local", nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 }, rpcUrls: { default: { http: [] } } };
const pub = createPublicClient({ chain, transport: custom(provider) });
const accts = keys.map((k) => privateKeyToAccount(k));
const wallet = (i) => createWalletClient({ chain, account: accts[i], transport: custom(provider) });
const $ = (x) => parseUnits(String(x), 6);

async function send(i, address, abi, functionName, args = []) {
  const hash = await wallet(i).writeContract({ address, abi, functionName, args, gas: 15_000_000n });
  const r = await pub.waitForTransactionReceipt({ hash });
  assert.equal(r.status, "success", `${functionName} reverted`);
  return r;
}
async function expectRevert(p) {
  let ok = false;
  try { const r = await p; if (r?.status === "reverted") ok = true; } catch { ok = true; }
  assert.ok(ok, "expected revert");
}
async function deploy() {
  const h1 = await wallet(0).deployContract({ abi: FlockUSD.abi, bytecode: FlockUSD.bytecode, gas: 10_000_000n });
  const usd = (await pub.waitForTransactionReceipt({ hash: h1 })).contractAddress;
  const h2 = await wallet(0).deployContract({ abi: Flock.abi, bytecode: Flock.bytecode, args: [usd, accts[0].address], gas: 15_000_000n });
  const flock = (await pub.waitForTransactionReceipt({ hash: h2 })).contractAddress;
  await send(0, usd, FlockUSD.abi, "setFlock", [flock]);
  return { usd, flock };
}
const now = async () => (await pub.getBlock()).timestamp;
const warp = async (s) => { await provider.request({ method: "evm_increaseTime", params: [s] }); await provider.request({ method: "evm_mine", params: [] }); };
const bal = (usd, a) => pub.readContract({ address: usd, abi: FlockUSD.abi, functionName: "balanceOf", args: [a] });

async function signJoin(flock, i, id, sigDeadline) {
  const nonce = await pub.readContract({ address: flock, abi: Flock.abi, functionName: "nonces", args: [accts[i].address] });
  return accts[i].signTypedData({
    domain: { name: "Flock", version: "1", chainId: 10143, verifyingContract: flock },
    types: { Join: [{ name: "flockId", type: "uint256" }, { name: "buyer", type: "address" }, { name: "nonce", type: "uint256" }, { name: "deadline", type: "uint256" }] },
    primaryType: "Join",
    message: { flockId: id, buyer: accts[i].address, nonce, deadline: sigDeadline },
  });
}

test("10 relayed joins: everyone ends at price(10), contract fully collateralized", async () => {
  const { usd, flock } = await deploy();
  const seller = 1;
  await send(seller, usd, FlockUSD.abi, "faucet", [accts[seller].address]);
  const dl = (await now()) + 3600n;
  // van to PDX: $300 fixed, $0 per seat, $1 failure bonus, min 6, max 12
  await send(seller, flock, Flock.abi, "createFlock", ["Thanksgiving van → PDX", "", $(300), 0n, $(1), dl, 6, 12]);
  const id = 1n;
  for (let i = 10; i < 20; i++) {
    await send(0, usd, FlockUSD.abi, "faucet", [accts[i].address]); // relayer pays gas
    const sd = (await now()) + 600n;
    const sig = await signJoin(flock, i, id, sd);
    await send(0, flock, Flock.abi, "joinFor", [id, accts[i].address, sd, sig]); // relayer = account 0
  }
  const p10 = await pub.readContract({ address: flock, abi: Flock.abi, functionName: "priceAt", args: [id, 10n] });
  assert.equal(p10, $(30));
  for (let i = 10; i < 20; i++) assert.equal(await bal(usd, accts[i].address), $(500) - p10, `buyer ${i} net`);
  assert.equal(await bal(usd, flock), p10 * 10n + $(1) * 5n);
});

test("failed flock refunds price + bonus to everyone in one tx", async () => {
  const { usd, flock } = await deploy();
  await send(1, usd, FlockUSD.abi, "faucet", [accts[1].address]);
  const dl = (await now()) + 120n;
  await send(1, flock, Flock.abi, "createFlock", ["Fail flock", "", $(300), 0n, $(2), dl, 10, 12]);
  for (let i = 10; i < 14; i++) { await send(i, usd, FlockUSD.abi, "faucet", [accts[i].address]); await send(i, flock, Flock.abi, "join", [1n]); }
  await expectRevert(wallet(5).writeContract({ address: flock, abi: Flock.abi, functionName: "settle", args: [1n], gas: 5_000_000n }).then((h) => pub.waitForTransactionReceipt({ hash: h })));
  await warp(200);
  await send(5, flock, Flock.abi, "settle", [1n]); // anyone can trigger
  for (let i = 10; i < 14; i++) assert.equal(await bal(usd, accts[i].address), $(502), "refund + $2 bonus");
  assert.equal(await bal(usd, accts[1].address), $(500) - $(2) * 4n, "seller lost only the bonuses actually paid");
  assert.equal(await bal(usd, flock), 0n);
});

test("filling to max auto-settles; seller gets revenue - 2.5% + bond", async () => {
  const { usd, flock } = await deploy();
  await send(1, usd, FlockUSD.abi, "faucet", [accts[1].address]);
  const dl = (await now()) + 3600n;
  await send(1, flock, Flock.abi, "createFlock", ["Hoodies", "", $(120), $(14), $(1), dl, 3, 5]);
  for (let i = 10; i < 15; i++) { await send(i, usd, FlockUSD.abi, "faucet", [accts[i].address]); await send(i, flock, Flock.abi, "join", [1n]); }
  const v = await pub.readContract({ address: flock, abi: Flock.abi, functionName: "getFlock", args: [1n] });
  assert.equal(v.data.status, 1); // Success
  const gross = $(38) * 5n; // 120/5 + 14
  const fee = (gross * 250n) / 10000n;
  assert.equal(await bal(usd, accts[1].address), $(500) - $(2) + gross - fee + $(2));
  assert.equal(await bal(usd, flock), 0n);
  await expectRevert(wallet(20).writeContract({ address: flock, abi: Flock.abi, functionName: "join", args: [1n], gas: 5_000_000n }).then((h) => pub.waitForTransactionReceipt({ hash: h })));
});

test("bad signature and double-join revert; seller can close early once min reached", async () => {
  const { usd, flock } = await deploy();
  await send(1, usd, FlockUSD.abi, "faucet", [accts[1].address]);
  const dl = (await now()) + 3600n;
  await send(1, flock, Flock.abi, "createFlock", ["Close early", "", $(500), 0n, 0n, dl, 2, 10]);
  await send(10, usd, FlockUSD.abi, "faucet", [accts[10].address]);
  const sd = (await now()) + 600n;
  const sigFromWrongKey = await signJoin(flock, 11, 1n, sd);
  await expectRevert(wallet(0).writeContract({ address: flock, abi: Flock.abi, functionName: "joinFor", args: [1n, accts[10].address, sd, sigFromWrongKey], gas: 5_000_000n }).then((h) => pub.waitForTransactionReceipt({ hash: h })));
  await send(10, flock, Flock.abi, "join", [1n]);
  await expectRevert(wallet(10).writeContract({ address: flock, abi: Flock.abi, functionName: "join", args: [1n], gas: 5_000_000n }).then((h) => pub.waitForTransactionReceipt({ hash: h })));
  await expectRevert(wallet(1).writeContract({ address: flock, abi: Flock.abi, functionName: "settle", args: [1n], gas: 5_000_000n }).then((h) => pub.waitForTransactionReceipt({ hash: h })));
  await send(11, usd, FlockUSD.abi, "faucet", [accts[11].address]);
  await send(11, flock, Flock.abi, "join", [1n]);
  await send(1, flock, Flock.abi, "settle", [1n]); // seller closes early at n=2 >= min
  const v = await pub.readContract({ address: flock, abi: Flock.abi, functionName: "getFlock", args: [1n] });
  assert.equal(v.data.status, 1);
});

test("gas: 60th join (59 push rebates) stays far under Monad's 30M per-tx limit", async () => {
  const { usd, flock } = await deploy();
  await send(1, usd, FlockUSD.abi, "faucet", [accts[1].address]);
  const dl = (await now()) + 3600n;
  await send(1, flock, Flock.abi, "createFlock", ["Big", "", $(400), $(1), 0n, dl, 2, 60]);
  let last;
  for (let i = 10; i < 70; i++) { await send(i, usd, FlockUSD.abi, "faucet", [accts[i].address]); last = await send(i, flock, Flock.abi, "join", [1n]); }
  console.log("   gas used by 60th join:", last.gasUsed.toString());
  assert.ok(last.gasUsed < 3_000_000n);
});
