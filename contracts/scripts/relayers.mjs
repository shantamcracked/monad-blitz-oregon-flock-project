// Relayer wallets pay gas for everyone's joins (users never need MON).
//   npm run relayers:new         → prints 4 fresh private keys → paste into web/.env.local RELAYER_PRIVATE_KEYS
//   npm run relayers:fund 0.5    → sends 0.5 MON from the deployer to each key in RELAYER_PRIVATE_KEYS (contracts/.env)
// ⚠ Monad's reserve-balance rule can revert transfers that leave an account under ~10 MON.
//   Keep the deployer ABOVE 10 MON after funding. If you can't, skip this and just set
//   RELAYER_PRIVATE_KEYS=<deployer key> (one relayer works fine, it just retries more).
import "dotenv/config";
import { createPublicClient, createWalletClient, http, parseEther, formatEther } from "viem";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import { monadTestnet } from "viem/chains";

const [, , cmd, amt] = process.argv;
if (cmd === "new") {
  const keys = Array.from({ length: 4 }, () => generatePrivateKey());
  console.log("RELAYER_PRIVATE_KEYS=" + keys.join(","));
  keys.forEach((k) => console.log("  address:", privateKeyToAccount(k).address));
  process.exit(0);
}
const rpc = process.env.MONAD_RPC_URL || "https://testnet-rpc.monad.xyz";
const pk = process.env.DEPLOYER_PRIVATE_KEY;
const account = privateKeyToAccount(pk.startsWith("0x") ? pk : `0x${pk}`);
const pub = createPublicClient({ chain: monadTestnet, transport: http(rpc) });
const wallet = createWalletClient({ chain: monadTestnet, account, transport: http(rpc) });
const keys = (process.env.RELAYER_PRIVATE_KEYS || "").split(",").map((s) => s.trim()).filter(Boolean);
if (!keys.length) throw new Error("Put RELAYER_PRIVATE_KEYS=0x..,0x.. in contracts/.env first");
const value = parseEther(amt || "0.5");
console.log("deployer balance:", formatEther(await pub.getBalance({ address: account.address })), "MON");
for (const k of keys) {
  const to = privateKeyToAccount(k).address;
  if (to === account.address) { console.log("skip (deployer itself)", to); continue; }
  const hash = await wallet.sendTransaction({ to, value });
  await pub.waitForTransactionReceipt({ hash });
  console.log("funded", to, formatEther(await pub.getBalance({ address: to })), "MON");
}
