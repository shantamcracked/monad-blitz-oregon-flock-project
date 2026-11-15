// ─────────────────────────────────────────────────────────────────────────────
//  SHARED UI TYPES — the contract between frontend components and live data.
//  ⚠ Teammates: DO NOT change these. Build your components to accept these props.
//  Shantam owns this file. All money values are plain numbers in DOLLARS (e.g. 23.4).
// ─────────────────────────────────────────────────────────────────────────────

export type FlockStatus = "open" | "success" | "failed";

export interface Buyer {
  address: string;     // 0x… wallet
  index: number;       // 1-based: Duck #1, Duck #2…
  joinedAt: number;    // unix ms
  paidAtJoin: number;  // $ they paid when they joined (price at that moment)
}

export interface FeedEvent {
  id: string;
  kind: "created" | "joined" | "settled-success" | "settled-failed";
  text: string;        // e.g. "Duck #14 joined — everyone got $0.70 back"
  at: number;          // unix ms
  address?: string;
  rebatePerBuyer?: number;
}

export interface CurvePoint {
  n: number;           // number of buyers
  price: number;       // $ per buyer at n
}

export interface FlockState {
  id: number;
  title: string;
  imageUrl: string;
  seller: string;
  fixedCost: number;       // F
  unitCost: number;        // c
  bonusPerBuyer: number;   // paid to each buyer if the flock fails
  minBuyers: number;
  maxBuyers: number;
  n: number;               // current buyers
  deadline: number;        // unix ms
  status: FlockStatus;
  price: number;           // current price everyone has paid (net)
  prevPrice: number | null;// price before the latest join (for strikethrough/animation)
  nextPrice: number;       // what the next joiner pays
  soloPrice: number;       // price if only 1 person joined
  buyers: Buyer[];
  feed: FeedEvent[];       // newest first
  curve: CurvePoint[];     // n = 1..maxBuyers
  totalRebated: number;    // $ sent back to earlier buyers so far, all-time
}

/** Personal view for the phone screen. */
export interface MeState {
  address: string | null;
  joined: boolean;
  myIndex: number | null;     // my duck number
  paidAtJoin: number | null;  // what I paid when I joined
  rebatesSoFar: number;       // paidAtJoin - current price
  balance: number;            // my fUSD balance in $
}

/** Props for each screen component (teammates build these). */
export interface LiveBoardProps {
  flock: FlockState;
  joinUrl: string;            // URL encoded in the QR code
  blockTimeMs?: number;       // 300
}

export interface JoinScreenProps {
  flock: FlockState;
  me: MeState;
  loggedIn: boolean;
  busy: boolean;                         // true while a join is in flight
  error: string | null;
  lastRebateToast: string | null;        // e.g. "Duck #15 joined — you got $0.42 back!"
  onLogin: () => void;
  onJoin: () => void;
  onLogout?: () => void;
}

export interface CreateFlockValues {
  title: string;
  imageUrl: string;
  fixedCost: number;
  unitCost: number;
  minBuyers: number;
  maxBuyers: number;
  deadlineMinutes: number;    // from now
  bonusPerBuyer: number;
}

export interface CreateFlockProps {
  loggedIn: boolean;
  busy: boolean;
  error: string | null;
  onLogin: () => void;
  onSubmit: (v: CreateFlockValues) => void;
}

export interface ReceiptProps {
  variant: "success" | "failed" | "pending";
  flock: FlockState;
  me: MeState;
  txHash?: string | null;
  explorerBaseUrl: string;    // e.g. https://testnet.monadexplorer.com
}

export interface LandingProps {
  flocks: FlockState[];
  onStartFlock: () => void;
}
