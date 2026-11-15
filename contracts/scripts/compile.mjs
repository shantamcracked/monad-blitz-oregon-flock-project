// Compiles src/*.sol with solc-js (no Foundry/Hardhat needed) → out/<Name>.json {abi, bytecode}
import solc from "solc";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = path.join(root, "src");
const sources = {};
for (const f of fs.readdirSync(srcDir).filter((f) => f.endsWith(".sol"))) {
  sources[`src/${f}`] = { content: fs.readFileSync(path.join(srcDir, f), "utf8") };
}

function findImports(p) {
  const candidates = [path.join(root, "node_modules", p), path.join(root, p)];
  for (const c of candidates) if (fs.existsSync(c)) return { contents: fs.readFileSync(c, "utf8") };
  return { error: `not found: ${p}` };
}

const input = {
  language: "Solidity",
  sources,
  settings: {
    optimizer: { enabled: true, runs: 200 },
    viaIR: true,
    evmVersion: "paris",
    outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));
const errors = (output.errors || []).filter((e) => e.severity === "error");
for (const e of output.errors || []) console[e.severity === "error" ? "error" : "warn"](e.formattedMessage);
if (errors.length) process.exit(1);

fs.mkdirSync(path.join(root, "out"), { recursive: true });
for (const [file, contracts] of Object.entries(output.contracts)) {
  if (!file.startsWith("src/")) continue;
  for (const [name, c] of Object.entries(contracts)) {
    fs.writeFileSync(
      path.join(root, "out", `${name}.json`),
      JSON.stringify({ abi: c.abi, bytecode: "0x" + c.evm.bytecode.object }, null, 2)
    );
    console.log(`compiled ${name}`);
  }
}
