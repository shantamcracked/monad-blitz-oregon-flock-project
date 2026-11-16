# 🦆 Flock — the group buy that gets cheaper every block

Built at **Monad Blitz Oregon 2026** (Univ. of Oregon × Monad Foundation).

Every Duck who joins makes it cheaper for every Duck already in — the difference is rebated in the same ~300ms Monad block.
If the flock doesn't fill by the deadline, the seller's pre-locked bonus pays every buyer for trying (a dominant assurance contract).

- `price(n) = ceil(setupCost / n) + unitCost` — average-cost sharing (Moulin)
- Retroactive rebates → everyone ends at the same final price → no reason to wait
- Seller bonds `bonus × (min − 1)` → joining is a dominant strategy (Tabarrok)
- Gasless UX: email login (Privy embedded wallet) → sign → relayed on Monad testnet (chain 10143)

## Quick start
```bash
cd contracts && npm install && npm test          # 5 tests on a local chain
cp .env.example .env                              # add DEPLOYER_PRIVATE_KEY (testnet only!)
npm run deploy && npm run seed                    # Monad testnet
cd ../web && npm install && cp .env.example .env.local && npm run dev
```
Open http://localhost:3000/preview for UI previews, /f/1 to join, /board/1 for the projector.
