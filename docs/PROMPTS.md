# Flock - every prompt, copy-paste ready

Repo: https://github.com/shantamcracked/uomonadblitzASA

Full plan: Flock_Playbook.pdf. Rules for every Claude session: CLAUDE.md.


## Shantam (lead dev) - branch main


### S0 - Bootstrap the repo (scaffold -> GitHub -> Vercel) (start ~12:50)

**Do by hand first:**

```text
1. Download flock-scaffold.zip from the chat.
2. Terminal:
   git clone https://github.com/shantamcracked/uomonadblitzASA.git
   cd uomonadblitzASA
   unzip -o ~/Downloads/flock-scaffold.zip -d .
   ls     # you should see: CLAUDE.md README.md contracts/ web/ docs/
3. Open Claude Code in this folder (claude) and paste prompt S0.
```

**Paste into Claude Code:**

```text
Read CLAUDE.md. This repo now contains the Flock scaffold (contracts/ + web/ + docs/).
1. cd contracts && npm install && npm test   -> expect "pass 5, fail 0". Show me the summary line.
2. cd ../web && npm install && npm run build -> must succeed. Show me the route table.
3. Make sure no .env / .env.local files exist in git status. Then from the repo root:
   git add -A && git commit -m "chore: Flock scaffold (contracts, web app, docs)" && git push origin main
   (if the remote has an initial commit and the push is rejected: git pull --rebase origin main, then push again)
4. Create and push the two teammate branches from main:
   git branch claude/ui-board && git branch claude/ui-phone && git push origin claude/ui-board claude/ui-phone
5. Print a short checklist of what succeeded.
```

**Then, by hand:**

```text
4. GitHub -> repo -> Settings -> Collaborators -> add both teammates (role: Write). Tell them to accept the email invite NOW.
5. vercel.com -> Add New -> Project -> import uomonadblitzASA -> Root Directory = web -> Framework = Next.js -> Deploy. (It deploys in preview-only mode until contracts exist; that's fine.)
6. Vercel -> Project -> Settings -> Deployment Protection -> turn OFF "Vercel Authentication" (otherwise teammates' previews and the audience's phones hit a login wall).
7. Copy your production URL (e.g. https://uomonadblitzasa.vercel.app). Send the teammates: repo link + "/preview" link.
```


### S1 - Deployer wallet + testnet MON (start ~13:05)

**Do by hand first:**

```text
Use a FRESH testnet-only key. Never your real wallet.
```

**Paste into Claude Code:**

```text
In contracts/: copy .env.example to .env (keep it git-ignored). Generate a fresh testnet-only key:
node --input-type=module -e "import {generatePrivateKey, privateKeyToAccount} from 'viem/accounts'; const k=generatePrivateKey(); console.log(k); console.error('ADDRESS', privateKeyToAccount(k).address)"
Put the key into contracts/.env as DEPLOYER_PRIVATE_KEY (do not print the key back to me again). Print ONLY the ADDRESS so I can fund it. Confirm with git check-ignore that contracts/.env is ignored.
```

**Then, by hand:**

```text
Fund the printed address with testnet MON:
- https://faucet.monad.xyz (official) and the Blitz faucet at https://blitz.devnads.com (hackathon participants), or ask the Monad team at the event.
- Minimum to proceed: ~2 MON. Ideal: 12+ MON (lets you fund 4 relayer wallets; see S4).
- NEVER use look-alike faucet sites.
```


### S2 - Deploy to Monad testnet + seed demo flocks (start ~13:20)

**Paste into Claude Code:**

```text
Read CLAUDE.md. In contracts/:
1. npm test (must pass).
2. npm run deploy   -> deploys FlockUSD + Flock to Monad testnet (chain 10143) and writes web/lib/contracts/deployment.json + ABIs. If it fails with a balance/gas error, stop and tell me how much MON the deployer has.
3. npm run seed     -> creates flock #1 Thanksgiving van -> PDX ($300 setup, min 6, max 12, $2 bonus), #2 OBG x Monad Blitz hoodie ($120 + $14/unit, min 10, max 40, $1 bonus), #3 taco-run fail demo (min 12, $3 bonus).
4. git add contracts/deployments.json web/lib/contracts && git commit -m "feat: deploy Flock to Monad testnet + seed demo flocks" && git push origin main
5. Print: both contract addresses, explorer links (https://testnet.monadexplorer.com/address/<addr>), and the 3 flock ids with their /f/<id> and /board/<id> paths.
```

**Then, by hand:**

```text
Vercel auto-redeploys from main. The site now reads live chain data (login still disabled until S3).
```


### S3 - Privy login + Vercel env vars (start ~13:40)

**Do by hand first:**

```text
1. https://dashboard.privy.io -> Create app "Flock".
2. Login methods: enable Email (and Google). Disable everything else.
3. Embedded wallets: Ethereum ON, "Create on login: users without wallets".
4. App settings -> Domains / Allowed origins: add http://localhost:3000 AND your Vercel production URL (and https://*.vercel.app if it lets you, for previews).
5. Copy the App ID.
6. Vercel -> Project -> Settings -> Environment Variables (All environments):
   NEXT_PUBLIC_PRIVY_APP_ID = <app id>
   NEXT_PUBLIC_APP_URL      = https://<your-prod-url>   (no trailing slash; used in the QR code)
   NEXT_PUBLIC_MONAD_RPC_URL = https://testnet-rpc.monad.xyz
   DEPLOYER_PRIVATE_KEY     = <same as contracts/.env>
   RELAYER_PRIVATE_KEYS     = <same as DEPLOYER_PRIVATE_KEY for now>
   ADMIN_SECRET             = <a random word, e.g. quack-9137>
   (optional) MONAD_RPC_URL_SERVER = an Alchemy/QuickNode Monad testnet URL (higher rate limits)
7. Vercel -> Deployments -> latest -> ... -> Redeploy.
```

**Paste into Claude Code:**

```text
Create web/.env.local from web/.env.example using these values: [PASTE YOUR PRIVY APP ID, PROD URL, ADMIN_SECRET; reuse DEPLOYER_PRIVATE_KEY from contracts/.env for both DEPLOYER_PRIVATE_KEY and RELAYER_PRIVATE_KEYS]. Confirm .env.local is git-ignored.
Then smoke-test the PRODUCTION site through the real API (this simulates 3 phones):
cd contracts && npm run loadtest -- https://<PROD-URL> 2 3
Expect 3 lines "duck N: ok ...ms". If you see errors, diagnose using docs/PLAYBOOK troubleshooting (Privy origin, env vars missing on Vercel, no MON on relayer) and tell me exactly what to click.
```

**Then, by hand:**

```text
Phone test yourself: open https://<prod>/f/1 on your phone -> Sign in with email -> Join. Open https://<prod>/board/1 on your laptop: the price should drop and the feed should update within ~1s.
```


### S4 - Relayer pool (smooth joins when 20 phones hit at once) (start ~14:15)

**Do by hand first:**

```text
Only if the deployer has 12+ MON. Otherwise skip: one relayer (the deployer key) works, it just retries more under load.
```

**Paste into Claude Code:**

```text
In contracts/: run npm run relayers:new and put the printed RELAYER_PRIVATE_KEYS line into contracts/.env. Check the deployer balance. ONLY if it is above 12 MON, run npm run relayers:fund 0.5 (sends 0.5 MON to each relayer; Monad's reserve-balance rule can revert transfers that leave an account under ~10 MON, so never fund below that). Then print the exact RELAYER_PRIVATE_KEYS value I must paste into Vercel env vars (it is a secret, testnet only), and remind me to Redeploy on Vercel. Do not commit .env.
```

**Then, by hand:**

```text
Vercel -> Env vars -> RELAYER_PRIVATE_KEYS = <new comma-separated keys> -> Redeploy. Re-run: npm run loadtest -- https://<prod> 2 8 (8 parallel ducks).
```


### S5 - Merge teammates' UI work (run at every checkpoint) (start ~14:30 / 15:30 / 16:30)

**Do by hand first:**

```text
Run at 2:30, 3:30, 4:30. Tell teammates to push before each checkpoint.
```

**Paste into Claude Code:**

```text
Read CLAUDE.md. Merge the teammates' UI branches into main safely:
1. git fetch origin && git checkout main && git pull origin main
2. For each branch origin/claude/ui-board and origin/claude/ui-phone:
   a. git diff --stat main...origin/<branch>  -> list files. If ANY file outside that teammate's owned folders (see CLAUDE.md) changed, restore those files from main after merging (git checkout main -- <file>) and tell me.
   b. git merge --no-ff origin/<branch> -m "merge <branch>"
3. cd web && npm install && npm run build. If a component's props drifted from web/lib/types.ts, fix the component minimally so the build passes.
4. Quick sanity: npm run dev, then curl -s localhost:3000/preview/board | head -c 200 (should return HTML). Stop the dev server.
5. git push origin main
6. Bring teammates up to date: for b in claude/ui-board claude/ui-phone; do git checkout $b && git merge main -m "sync main" && git push origin $b; done; git checkout main
7. Summarize what merged, any files you reverted, and the commit hash on main.
```

**Then, by hand:**

```text
Check https://<prod>/preview and https://<prod>/board/1 after Vercel finishes (~1 min).
```


### S6 - Stage setup: fresh flocks + demo runbook (start ~16:30)

**Paste into Claude Code:**

```text
Read CLAUDE.md. Prepare the stage demo:
1. cd contracts && npm run seed   -> creates FRESH demo flocks (new ids). Record the new van flock id (call it VAN) and hoodie id.
2. Create docs/DEMO_RUNBOOK.md containing: the prod URL; projector URL https://<prod>/board/VAN ; phone URL https://<prod>/f/VAN ; the exact command to create the fail-demo flock 6 minutes before we go on stage: (cd contracts && npm run seed -- fail 5) and how to open its board with ?admin=<ADMIN_SECRET> to press "Settle now" after the deadline; the backup plan (pre-recorded video path + loadtest command npm run loadtest -- https://<prod> VAN 4 to add ducks if the room is slow).
3. Dry-run the fail path end to end NOW on a throwaway: npm run seed -- fail 2 ; wait 2 minutes; POST to https://<prod>/api/settle with header x-admin-secret and the new id (curl). Confirm status becomes failed and buyers would be refunded (there may be 0 buyers; that's fine).
4. git add docs/DEMO_RUNBOOK.md && git commit -m "docs: demo runbook" && git push origin main
```


### S7 - Code freeze (start ~17:30)

**Paste into Claude Code:**

```text
Final freeze. git fetch origin; make sure main contains the last teammate merges (run the S5 merge steps if branches have new commits). cd web && npm run build must pass. git tag demo-v1 && git push origin main --tags. Print the final commit hash, contract addresses, and the URLs from docs/DEMO_RUNBOOK.md.
```

**Then, by hand:**

```text
Do not deploy anything after this unless something is broken.
```


## Teammate A - Board & Story - branch claude/ui-board


### A0 - Setup (no code) (start ~12:50)

**Do by hand first:**

```text
1. Accept the GitHub invite email from Shantam (repo shantamcracked/uomonadblitzASA).
2. Go to https://claude.ai/code -> connect GitHub -> pick the repo uomonadblitzASA.
   (No Claude Code? Use the FALLBACK at the end of this section.)
3. Open the preview playground Shantam sends you: https://<prod-url>/preview  (mock data, no login).
4. Your screens: Live Board (projector), Receipt, Landing page. Your branch: claude/ui-board.
5. Every prompt below already tells Claude to pull the latest code, build, commit, and push to YOUR branch. You never touch main.
```


### A1 - Projector Live Board (the money shot) (start ~13:00)

**Paste into Claude Code:**

```text
CONTEXT (read first): You are helping Teammate A ("Board & Story") on the Flock hackathon repo. Read CLAUDE.md at the repo root and follow its rules exactly. You may ONLY edit: web/components/board/**, web/components/receipt/**, web/components/landing/**, web/app/preview/board/**, web/app/preview/receipt/**, web/app/preview/landing/**. Never edit web/lib/**, never add npm packages, no shadcn/ui, no next/font/google. Keep each component's default export and its exact props type from web/lib/types.ts.

GIT FIRST: git fetch origin && git checkout claude/ui-board && git merge origin/main   (if the branch doesn't exist locally: git checkout -b claude/ui-board origin/claude/ui-board)

TASK: Redesign web/components/board/LiveBoard.tsx into a jaw-dropping projector screen for a live hackathon demo in a ballroom. Look at web/lib/types.ts (LiveBoardProps, FlockState) and web/lib/mock.ts first. Preview page: /preview/board (a new buyer "duck" joins every 2.5s).
Requirements:
- Designed for 1920x1080, no scrolling; still fine at 1366x768. Readable from the back of the room: price >= 140px, labels >= 20px.
- Dark background bg-flock-ink, cards bg-flock-card, accent flock-purple, money-back in flock-mint, bonus in flock-gold.
- HERO: giant current price (font-mono, tabular). When flock.price changes: animate the number counting DOWN from the old value to the new one over ~600ms, flash mint green, and pop a badge "-$X.XX for everyone" (X = prevPrice - price) that floats up and fades.
- Show "Alone: $soloPrice" crossed out and "Next duck pays: $nextPrice".
- DUCK GRID: one duck (use a rounded square with the emoji or a lucide icon) per buyer, numbered #1..#n, empty dashed slots up to maxBuyers, a gold line/marker after slot minBuyers. New duck pops in with a spring bounce; when the price drops, every earlier duck briefly shows a small "+$" coin float-up animation.
- Price curve (recharts LineChart): full curve in purple, the already-reached part thicker/brighter, current point glowing mint.
- Big QR code (qrcode.react, value = joinUrl) in a white card with "Scan to join - email login, no wallet, no gas".
- Badge "Monad testnet - ~300ms blocks" with a dot that pulses every blockTimeMs milliseconds.
- Countdown to deadline (mm:ss, hours if > 60 min) and "N more ducks to take off" until minBuyers is reached.
- Live feed of flock.feed (newest on top, max 6 items, slide-in animation).
- STATUS OVERLAYS: if flock.status === "success": full-width banner "THE FLOCK FLEW" + canvas-confetti burst once. If "failed": banner "Didn't fill - everyone refunded + $bonus bonus" in gold.
Keep: default export, props signature LiveBoardProps. Only use tailwind, framer-motion, lucide-react, recharts, qrcode.react, canvas-confetti.

FINISH (do all of these, in order):
1. cd web && npm install && npm run build  -> must end with no errors. If it fails, fix ONLY files you are allowed to edit and rebuild.
2. git add -A && git commit -m "feat(board): projector live board v2"
3. git push origin claude/ui-board
4. If no pull request from claude/ui-board into main exists yet, open one titled "UI: Board & Story" (use gh pr create --base main --head claude/ui-board --title "UI: Board & Story" --body "UI work for Flock" ; if gh is unavailable, tell me to click "Compare & pull request" on GitHub).
5. Reply with: what you changed (3 bullets), the commit hash, and remind me to check the Vercel preview for branch claude/ui-board at the path /preview/board.
```


### A2 - Receipt screen (success + failure) (start ~14:15)

**Paste into Claude Code:**

```text
CONTEXT (read first): You are helping Teammate A ("Board & Story") on the Flock hackathon repo. Read CLAUDE.md at the repo root and follow its rules exactly. You may ONLY edit: web/components/board/**, web/components/receipt/**, web/components/landing/**, web/app/preview/board/**, web/app/preview/receipt/**, web/app/preview/landing/**. Never edit web/lib/**, never add npm packages, no shadcn/ui, no next/font/google. Keep each component's default export and its exact props type from web/lib/types.ts.

GIT FIRST: git fetch origin && git checkout claude/ui-board && git merge origin/main   (if the branch doesn't exist locally: git checkout -b claude/ui-board origin/claude/ui-board)

TASK: Polish web/components/receipt/Receipt.tsx (props ReceiptProps). Preview: /preview/receipt (buttons switch success / failed / pending).
Requirements:
- Mobile-first (390px wide), dark theme, big friendly headline.
- success: confetti once, "The flock flew!", rows: Ducks, Final price, You first paid, Rebated to you (+mint), Saved vs going solo (%). Add a "share card" (a nice rounded card with the flock title, final price, "I saved X% with Flock", "Built on Monad") that people could screenshot.
- failed: headline "Didn't fill - you got paid for trying", rows: Refunded, Seller's bonus (+gold), Total back. Short line explaining the dominant assurance bonus in plain English.
- pending: "Still flying..." with current price and n/max.
- Badge "Settled on Monad in ~0.6s" and a "View transaction" link to `${explorerBaseUrl}/tx/${txHash}` when txHash exists.
Keep default export + ReceiptProps.

FINISH (do all of these, in order):
1. cd web && npm install && npm run build  -> must end with no errors. If it fails, fix ONLY files you are allowed to edit and rebuild.
2. git add -A && git commit -m "feat(receipt): success/failure receipts + share card"
3. git push origin claude/ui-board
4. If no pull request from claude/ui-board into main exists yet, open one titled "UI: Board & Story" (use gh pr create --base main --head claude/ui-board --title "UI: Board & Story" --body "UI work for Flock" ; if gh is unavailable, tell me to click "Compare & pull request" on GitHub).
5. Reply with: what you changed (3 bullets), the commit hash, and remind me to check the Vercel preview for branch claude/ui-board at the path /preview/receipt.
```


### A3 - Landing page (start ~15:15)

**Paste into Claude Code:**

```text
CONTEXT (read first): You are helping Teammate A ("Board & Story") on the Flock hackathon repo. Read CLAUDE.md at the repo root and follow its rules exactly. You may ONLY edit: web/components/board/**, web/components/receipt/**, web/components/landing/**, web/app/preview/board/**, web/app/preview/receipt/**, web/app/preview/landing/**. Never edit web/lib/**, never add npm packages, no shadcn/ui, no next/font/google. Keep each component's default export and its exact props type from web/lib/types.ts.

GIT FIRST: git fetch origin && git checkout claude/ui-board && git merge origin/main   (if the branch doesn't exist locally: git checkout -b claude/ui-board origin/claude/ui-board)

TASK: Polish web/components/landing/Landing.tsx (props LandingProps). Preview: /preview/landing.
Sections:
1. Hero: "The group buy that gets cheaper every block." Sub: "Every Duck who joins lowers the price for every Duck already in - the difference lands back in your wallet in the same ~300ms Monad block. If the flock doesn't fill, the seller pays you for trying." Primary button "Start a flock" (calls onStartFlock), secondary anchor "See live flocks".
2. How it works - 3 steps with icons: (1) A seller posts the real cost: setup / n + per-unit. (2) Every new buyer drops the price for everyone - earlier buyers are rebated instantly. (3) Miss the minimum? Full refund + a bonus the seller locked up front.
3. "Why it works (the economics)": 3 small cards: Average-cost sharing (no reason to wait - everyone ends at the same price), Retroactive rebates (joining early costs nothing), Dominant assurance contract (joining can't lose, so flocks actually fill).
4. Live flocks grid: card per flock with title, current price (or solo price if n = 0), mini progress bar n/max with min marker, status pill (open / flew / refunded), link to /f/{id}.
5. Use cases row: Thanksgiving van to PDX, club merch runs, group dinners/venue bookings, game-day party bus.
6. Footer: "Built on Monad testnet at Monad Blitz Oregon 2026".
Responsive (mobile + desktop). Keep default export + LandingProps.

FINISH (do all of these, in order):
1. cd web && npm install && npm run build  -> must end with no errors. If it fails, fix ONLY files you are allowed to edit and rebuild.
2. git add -A && git commit -m "feat(landing): landing page"
3. git push origin claude/ui-board
4. If no pull request from claude/ui-board into main exists yet, open one titled "UI: Board & Story" (use gh pr create --base main --head claude/ui-board --title "UI: Board & Story" --body "UI work for Flock" ; if gh is unavailable, tell me to click "Compare & pull request" on GitHub).
5. Reply with: what you changed (3 bullets), the commit hash, and remind me to check the Vercel preview for branch claude/ui-board at the path /preview/landing.
```


### A4 - Demo crew + backup video (no code) (start ~16:15)

**Do by hand first:**

```text
1. Recruit 12-15 people in the room to be "the flock" during our demo (friends, OBG members, other teams that already presented). Send them this text:
   "Hey! During our demo (~[time]) we need you to scan a QR and tap Join - takes 10 seconds, email login, no wallet/crypto needed. You'll literally get paid back on stage. Sit near the front?"
2. Collect their names in a note; 10 minutes before our slot, re-text: "We're up soon - phones out, be logged in at <prod>/f/<VAN id>". (Logging in early = faster joins on stage.)
3. Backup video (record at ~16:45 once Shantam says the live flow works): on a laptop open /board/<id>; on a phone join; screen-record both (QuickTime "New Screen Recording" on Mac; phone: Control Center screen record). 60-90 seconds. AirDrop/upload to the team Google Drive. Name it flock_backup_demo.mov.
4. Rehearse the demo script (PDF section 9) with Teammate B as the narrator at least twice.
```


## Teammate B - Phone & Create - branch claude/ui-phone


### B0 - Setup (no code) (start ~12:50)

**Do by hand first:**

```text
1. Accept the GitHub invite email from Shantam (repo shantamcracked/uomonadblitzASA).
2. Go to https://claude.ai/code -> connect GitHub -> pick the repo uomonadblitzASA.
   (No Claude Code? Use the FALLBACK at the end of this section.)
3. Open https://<prod-url>/preview on YOUR PHONE - your screens are what the audience sees.
4. Your screens: Phone Join screen, Create-a-Flock form. Your branch: claude/ui-phone.
5. Every prompt below tells Claude to pull the latest code, build, commit, and push to YOUR branch.
```


### B1 - Phone Join screen (what every judge touches) (start ~13:00)

**Paste into Claude Code:**

```text
CONTEXT (read first): You are helping Teammate B ("Phone & Create") on the Flock hackathon repo. Read CLAUDE.md at the repo root and follow its rules exactly. You may ONLY edit: web/components/join/**, web/components/create/**, web/app/preview/join/**, web/app/preview/create/**. Never edit web/lib/**, never add npm packages, no shadcn/ui, no next/font/google. Keep each component's default export and its exact props type from web/lib/types.ts.

GIT FIRST: git fetch origin && git checkout claude/ui-phone && git merge origin/main   (if the branch doesn't exist locally: git checkout -b claude/ui-phone origin/claude/ui-phone)

TASK: Redesign web/components/join/JoinScreen.tsx (props JoinScreenProps) into a delightful mobile screen (390x844, iPhone). Read web/lib/types.ts and web/lib/mock.ts first. Preview: /preview/join (buttons switch loggedOut / loggedIn / joined; when joined, a new duck joins every 3s and lastRebateToast changes).
Requirements:
- Mobile-first, no horizontal scroll, tap targets >= 48px, respects iPhone safe areas (pb-[env(safe-area-inset-bottom)]).
- Top: flock image (flock.imageUrl), title, "n ducks in - min X - max Y", a slim progress bar with the min marker, countdown to deadline.
- BEFORE joining: huge price "Join at $nextPrice" (font-mono), "Alone it would be $soloPrice" crossed out, one giant purple button. loggedIn=false -> label "Sign in with email to join" and onClick=onLogin; loggedIn=true -> "Join at $X" and onClick=onJoin. busy -> spinner + "Joining... ~1s on Monad", disabled.
- AFTER joining (me.joined): a big badge "You're Duck #N", "You paid $paidAtJoin", "Now everyone pays $price", and "Rebates so far +$rebatesSoFar" that animates (count-up, mint color) whenever it changes.
- Toast: when lastRebateToast changes, slide up a mint toast from the bottom with the text, call navigator.vibrate?.(60), auto-hide after 2.5s.
- Always show a shield card: "If this flock doesn't reach {min} by the deadline, you get a full refund + ${bonus} bonus. Joining can't lose."
- Collapsible "How does this work?" with 3 short bullets (price = setup / n + per-unit; every join rebates everyone instantly; failure = refund + bonus).
- error -> red rounded alert; flock.status !== "open" -> replace the button with a status card (flew / refunded + bonus) and a link to /receipt/{flock.id}.
- Small footer: "Test wallet balance $X - Monad testnet".
Keep default export + JoinScreenProps.

FINISH (do all of these, in order):
1. cd web && npm install && npm run build  -> must end with no errors. If it fails, fix ONLY files you are allowed to edit and rebuild.
2. git add -A && git commit -m "feat(join): mobile join screen v2"
3. git push origin claude/ui-phone
4. If no pull request from claude/ui-phone into main exists yet, open one titled "UI: Phone & Create" (use gh pr create --base main --head claude/ui-phone --title "UI: Phone & Create" --body "UI work for Flock" ; if gh is unavailable, tell me to click "Compare & pull request" on GitHub).
5. Reply with: what you changed (3 bullets), the commit hash, and remind me to check the Vercel preview for branch claude/ui-phone at the path /preview/join.
```


### B2 - Create-a-Flock form (start ~14:15)

**Paste into Claude Code:**

```text
CONTEXT (read first): You are helping Teammate B ("Phone & Create") on the Flock hackathon repo. Read CLAUDE.md at the repo root and follow its rules exactly. You may ONLY edit: web/components/join/**, web/components/create/**, web/app/preview/join/**, web/app/preview/create/**. Never edit web/lib/**, never add npm packages, no shadcn/ui, no next/font/google. Keep each component's default export and its exact props type from web/lib/types.ts.

GIT FIRST: git fetch origin && git checkout claude/ui-phone && git merge origin/main   (if the branch doesn't exist locally: git checkout -b claude/ui-phone origin/claude/ui-phone)

TASK: Polish web/components/create/CreateFlockForm.tsx (props CreateFlockProps). Preview: /preview/create.
Requirements:
- Preset chips at the top that fill the form: "Van to PDX" (setup 300, unit 0, min 6, max 12, bonus 2, 120 min, imageUrl /img/van.svg), "Club hoodies" (setup 120, unit 14, min 10, max 40, bonus 1, imageUrl /img/hoodie.svg), "Group dinner" (setup 200, unit 25, min 8, max 20, bonus 2, imageUrl /img/tacos.svg).
- Fields with helper text and inline validation (fixedCost > 0, min >= 1, max >= min, max <= 60, deadline > 0 minutes, bonus >= 0). Disable submit until valid.
- Live preview panel: recharts price curve, "Alone / at minimum / at maximum" prices, "Bond you lock = bonus x (min - 1)" in gold, and one sentence on why the bond makes buyers join.
- Responsive: two columns on desktop, stacked on mobile.
- Submit button states: loggedIn=false -> "Sign in to launch" (onLogin); busy -> "Launching on Monad..."; else "Launch Flock" (onSubmit(values)). Show error if present.
Keep default export + CreateFlockProps.

FINISH (do all of these, in order):
1. cd web && npm install && npm run build  -> must end with no errors. If it fails, fix ONLY files you are allowed to edit and rebuild.
2. git add -A && git commit -m "feat(create): create-a-flock form v2"
3. git push origin claude/ui-phone
4. If no pull request from claude/ui-phone into main exists yet, open one titled "UI: Phone & Create" (use gh pr create --base main --head claude/ui-phone --title "UI: Phone & Create" --body "UI work for Flock" ; if gh is unavailable, tell me to click "Compare & pull request" on GitHub).
5. Reply with: what you changed (3 bullets), the commit hash, and remind me to check the Vercel preview for branch claude/ui-phone at the path /preview/create.
```


### B3 - Real-phone QA pass (start ~15:15)

**Paste into Claude Code:**

```text
CONTEXT (read first): You are helping Teammate B ("Phone & Create") on the Flock hackathon repo. Read CLAUDE.md at the repo root and follow its rules exactly. You may ONLY edit: web/components/join/**, web/components/create/**, web/app/preview/join/**, web/app/preview/create/**. Never edit web/lib/**, never add npm packages, no shadcn/ui, no next/font/google. Keep each component's default export and its exact props type from web/lib/types.ts.

GIT FIRST: git fetch origin && git checkout claude/ui-phone && git merge origin/main   (if the branch doesn't exist locally: git checkout -b claude/ui-phone origin/claude/ui-phone)

TASK: Mobile QA of web/components/join/JoinScreen.tsx and web/components/create/CreateFlockForm.tsx. I tested on my phone and saw these issues: [DESCRIBE WHAT LOOKED WRONG - e.g. text too small, button cut off, toast covers button, numbers jump around].
Fix them, then also check: (1) no element wider than 100vw, (2) all numbers use tabular figures so they don't jiggle while animating, (3) contrast of gray text >= white/60 on dark, (4) the join button is visible without scrolling on a 375x667 iPhone SE, (5) long titles wrap nicely.

FINISH (do all of these, in order):
1. cd web && npm install && npm run build  -> must end with no errors. If it fails, fix ONLY files you are allowed to edit and rebuild.
2. git add -A && git commit -m "fix(mobile): QA pass"
3. git push origin claude/ui-phone
4. If no pull request from claude/ui-phone into main exists yet, open one titled "UI: Phone & Create" (use gh pr create --base main --head claude/ui-phone --title "UI: Phone & Create" --body "UI work for Flock" ; if gh is unavailable, tell me to click "Compare & pull request" on GitHub).
5. Reply with: what you changed (3 bullets), the commit hash, and remind me to check the Vercel preview for branch claude/ui-phone at the path /preview/join.
```


### B4 - Pitch deck (no code) (start ~16:15)

**Do by hand first:**

```text
Open claude.ai (regular chat) and paste the DECK PROMPT below. Ask it to make a slide deck (or use Google Slides and paste the content). Export as PDF and also keep it open in a browser tab for the demo. Then rehearse with Teammate A (you narrate slides 1-2 and 4-5; Shantam does the live demo + answers the economics questions).
```


## Deck prompt (Teammate B, B4 - paste into a normal claude.ai chat)

```text
Make a 5-slide pitch deck for our hackathon project "Flock" (Monad Blitz Oregon 2026). Style: dark background #0E0B1A, purple #836EF9 accents, mint #3DF5A7 for money, big type, very few words per slide, a duck motif.
Slide 1 - Problem: Group orders die at the cold start. Nobody wants to commit first, the organizer fronts the money and chases Venmos, and half the people bail. Example: Thanksgiving van Eugene -> PDX costs ~$300 flat (private shuttle quotes $285-$305). Alone: $300. Split 12 ways: $25. But only if 12 people actually commit.
Slide 2 - Flock: The group buy that gets cheaper every block. price = setup / n + per-unit. Every new buyer lowers the price for everyone, and earlier buyers are rebated the difference in the same ~300 ms Monad block. If the flock misses its minimum by the deadline, everyone gets a full refund + a bonus the seller locked up front (a dominant assurance contract - Tabarrok). Lab experiments (Cason, Tabarrok & Zubrickas 2021) found refund bonuses raised campaign success by 50%+.
Slide 3 - LIVE DEMO (just a big title "The room is the flock" and a QR placeholder).
Slide 4 - Market: Pinduoduo built a US$61.75B-revenue business (PDD FY2025) on "team purchase". Tilt started on college campuses pooling money for parties, raised $62M, acquired by Airbnb (2017). University of Oregon: 24,448 students, 47% from out of state -> pooled travel every break; every club buys merch every term. Wedge: UO clubs + Thanksgiving/winter-break rides -> local merchants -> white-label widget for printers and charter operators.
Slide 5 - Business + why Monad: 2.5% fee on every flock that flies (Tilt/PartyBid benchmark). Why Monad: rebates are cents - card rails charge 2.9% + 30c per payment and settle slowly; Monad settles a join + dozens of rebates in one ~600 ms-final transaction for a fraction of a cent, with the escrow and the failure bonus enforced by code instead of a treasurer. Team: Shantam (econ + smart contracts), [Teammate A], [Teammate B].
```


## Fallback if Claude Code isn't available

```text
FALLBACK if Claude Code (claude.ai/code) isn't available to you:
1. Open https://v0.dev (or a normal claude.ai chat). Paste the TASK part of your prompt, plus this line: "Return ONE complete React client component file (TypeScript, 'use client', default export) using only Tailwind classes, framer-motion, lucide-react, recharts, qrcode.react, canvas-confetti. Do not use shadcn/ui. Import types from '@/lib/types' and helpers from '@/lib/flock-math'." Also paste the contents of web/lib/types.ts (open it on GitHub, copy all).
2. On GitHub: switch the branch dropdown to YOUR branch (claude/ui-board or claude/ui-phone) -> open your component file -> pencil icon (Edit) -> select all -> paste the new code -> "Commit changes" (commit directly to your branch).
3. Wait ~1 minute -> open the Vercel preview for your branch (GitHub PR page shows the Vercel link) and check /preview/<screen>.
4. If the Vercel build fails, copy the error from Vercel's build log back into v0/claude and ask it to fix the file, then commit again.
```
