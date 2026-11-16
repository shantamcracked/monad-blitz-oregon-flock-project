# Flock — Monad Blitz Oregon 2026 (READ THIS FIRST, Claude)

Flock = an on-chain group buy where every new buyer lowers the price for everyone and earlier buyers
are rebated the difference in the same ~300ms Monad block. If the flock misses its minimum by the
deadline, every buyer gets a full refund + a seller-funded bonus (dominant assurance contract).

## Repo layout
- `contracts/` — Solidity (Flock.sol, FlockUSD.sol). npm-only toolchain: `npm test`, `npm run deploy`, `npm run seed`. **Owner: Shantam.**
- `web/` — Next.js 15 App Router + Tailwind v4 + Privy (email login → embedded wallet). Server API routes relay transactions so users never need gas.
  - `web/lib/**`, `web/app/api/**`, `web/app/(f|board|receipt|create)/**`, `web/app/page.tsx`, `web/app/layout.tsx`, `next.config.ts`, `package.json` — **Owner: Shantam. Teammates must NOT edit.**
  - `web/components/board/**`, `web/components/receipt/**`, `web/components/landing/**`, `web/app/preview/board|receipt|landing/**`, `web/public/img/**` — **Owner: Teammate A (Board & Story).**
  - `web/components/join/**`, `web/components/create/**`, `web/app/preview/join|create/**` — **Owner: Teammate B (Phone & Create).**
- `docs/PROMPTS.md` — every prompt for every person.

## Hard rules for any Claude session in this repo
1. Only edit files inside the folders your person owns (see above). If a change outside is truly needed, STOP and tell the human to ask Shantam.
2. Never change `web/lib/types.ts`. Components must keep their exact props interface (LiveBoardProps, JoinScreenProps, CreateFlockProps, ReceiptProps, LandingProps).
3. Never add npm dependencies. Available UI libs: tailwindcss v4, framer-motion, lucide-react, recharts, qrcode.react, canvas-confetti. **No shadcn/ui** (not installed), no next/font/google.
4. Brand tokens (Tailwind classes): `flock-purple #836EF9`, `flock-purple-dark`, `flock-ink #0E0B1A` (bg), `flock-card #1A1530`, `flock-line #2E2650`, `flock-mint #3DF5A7` (money back), `flock-gold #FFC94D` (bonus), `flock-red #FF5C7A`.
5. Use `fmtUsd`, `shortAddr`, `priceAt` from `@/lib/flock-math`. Use mock data from `@/lib/mock` in preview pages.
6. Before every push: `cd web && npm install && npm run build` must pass. Fix errors only in your own files.
7. Git: Shantam pushes to `main`. Teammate A pushes to branch `claude/ui-board`. Teammate B pushes to `claude/ui-phone`. Always `git fetch origin && git merge origin/main` before starting work, then commit + push to your branch and open/update a PR into `main`.
8. Never commit `.env`, `.env.local`, or any private key.

## Useful URLs (when running `cd web && npm run dev`)
- /preview — mock-data playground for all screens (no wallet needed)
- /f/1 — phone join page · /board/1 — projector board (add `?admin=SECRET` for the Settle button) · /create · /receipt/1
