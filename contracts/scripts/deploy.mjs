// Deploys FlockUSD + Flock to Monad testnet and writes addresses + ABIs into ../web/lib/contracts/
// Usage: npm run deploy     (needs DEPLOYER_PRIVATE_KEY in contracts/.env)
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createPublicClient, createWalletClient, http, formatEther, encodeDeployData } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { monadTestnet } from "viem/chains";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const webContracts = path.resolve(root, "../web/lib/contracts");
const rpc = process.env.MONAD_RPC_URL || "https://testnet-rpc.monad.xyz";
const pk = process.env.DEPLOYER_PRIVATE_KEY;
if (!pk) throw new Error("Set DEPLOYER_PRIVATE_KEY in contracts/.env (see .env.example)");

const account = privateKeyToAccount(pk.startsWith("0x") ? pk : `0x${pk}`);
const pub = createPublicClient({ chain: monadTestnet, transport: http(rpc) });
const wallet = createWalletClient({ chain: monadTestnet, account, transport: http(rpc) });
const load = (n) => JSON.parse(fs.readFileSync(path.join(root, "out", `${n}.json`), "utf8"));

const bal = await pub.getBalance({ address: account.address });
console.log(`Deployer ${account.address}  balance ${formatEther(bal)} MON`);
if (bal === 0n) throw new Error("Deployer has 0 MON. Use the faucet first (see PDF section 'Fund wallets').");

async function deploy(name, args = []) {
  const { abi, bytecode } = load(name);
  const gas = await pub.estimateGas({ account, data: encodeDeployData({ abi, bytecode, args }) });
  const hash = await wallet.deployContract({ abi, bytecode, args, gas: (gas * 12n) / 10n });
  const r = await pub.waitForTransactionReceipt({ hash });
  if (r.status !== "success") throw new Error(`${name} deploy reverted: ${hash}`);
  console.log(`${name} → ${r.contractAddress}   tx ${hash}`);
  return r.contractAddress;
}

const usd = await deploy("FlockUSD");
const treasury = process.env.TREASURY_ADDRESS || account.address;
const flock = await deploy("Flock", [usd, treasury]);

const { abi: usdAbi } = load("FlockUSD");
const h = await wallet.writeContract({ address: usd, abi: usdAbi, functionName: "setFlock", args: [flock] });
await pub.waitForTransactionReceipt({ hash: h });
console.log("FlockUSD.setFlock done");

const deployment = { chainId: monadTestnet.id, flock, usd, treasury, deployer: account.address, deployedAt: new Date().toISOString() };
fs.writeFileSync(path.join(root, "deployments.json"), JSON.stringify(deployment, null, 2));
fs.mkdirSync(webContracts, { recursive: true });
fs.writeFileSync(path.join(webContracts, "deployment.json"), JSON.stringify(deployment, null, 2));
fs.writeFileSync(path.join(webContracts, "FlockAbi.json"), JSON.stringify(load("Flock").abi, null, 2));
fs.writeFileSync(path.join(webContracts, "FlockUSDAbi.json"), JSON.stringify(usdAbi, null, 2));
console.log(`\n✅ Wrote web/lib/contracts/deployment.json`);
console.log(`Explorer: https://testnet.monadexplorer.com/address/${flock}`);
