"use client";
// Live data + actions for real pages (Shantam wires these into the teammates' components).
import { useCallback, useEffect, useRef, useState } from "react";
import { keccak256, toBytes, parseUnits } from "viem";
import type { CreateFlockValues, FlockState, MeState } from "./types";
import { fmtUsd } from "./flock-math";
import { FLOCK_ADDRESS } from "./config";
import { useAuth } from "./auth";

const domain = () => ({ name: "Flock", version: "1", chainId: 10143, verifyingContract: FLOCK_ADDRESS });

async function api<T>(url: string, body?: unknown): Promise<T> {
  const r = await fetch(url, body ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) } : { cache: "no-store" });
  const j = await r.json();
  if (!r.ok || j.error) throw new Error(j.error || `HTTP ${r.status}`);
  return j as T;
}

/** Polls one flock every `ms` (default 700ms ≈ 2 Monad blocks). */
export function useFlock(id: number, ms = 700) {
  const { address } = useAuth();
  const [flock, setFlock] = useState<FlockState | null>(null);
  const [myBalance, setMyBalance] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const lastN = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      const j = await api<{ flock: FlockState; myBalance: number | null }>(`/api/flock/${id}${address ? `?me=${address}` : ""}`);
      setFlock(j.flock);
      if (j.myBalance !== null) setMyBalance(j.myBalance);
      setError(null);
      // rebate toast for me when someone new joins after me
      const meIdx = address ? j.flock.buyers.findIndex((b) => b.address.toLowerCase() === address.toLowerCase()) + 1 : 0;
      if (lastN.current !== null && j.flock.n > lastN.current && meIdx > 0 && meIdx < j.flock.n && j.flock.prevPrice) {
        setToast(`Duck #${j.flock.n} joined — you got ${fmtUsd(j.flock.prevPrice - j.flock.price)} back!`);
      }
      lastN.current = j.flock.n;
    } catch (e) {
      setError((e as Error).message);
    }
  }, [id, address]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, ms);
    return () => clearInterval(t);
  }, [refresh, ms]);

  const me: MeState = (() => {
    const idx = flock && address ? flock.buyers.findIndex((b) => b.address.toLowerCase() === address.toLowerCase()) : -1;
    const joined = idx >= 0;
    const paid = joined && flock ? flock.buyers[idx].paidAtJoin : null;
    return {
      address,
      joined,
      myIndex: joined ? idx + 1 : null,
      paidAtJoin: paid,
      rebatesSoFar: joined && flock && paid !== null ? Math.max(0, paid - flock.price) : 0,
      balance: myBalance,
    };
  })();

  return { flock, me, error, toast, refresh };
}

/** Actions: onboard (free test dollars), join (sign + relay), create (sign + relay). */
export function useFlockActions() {
  const auth = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTx, setLastTx] = useState<string | null>(null);

  const onboard = useCallback(async () => {
    if (!auth.address) return;
    try { await api("/api/onboard", { address: auth.address }); } catch (e) { setError((e as Error).message); }
  }, [auth.address]);

  // auto-give test dollars right after login
  useEffect(() => { if (auth.loggedIn && auth.address) onboard(); }, [auth.loggedIn, auth.address, onboard]);

  const join = useCallback(async (id: number) => {
    if (!auth.loggedIn) return auth.login();
    if (!auth.address) return setError("Wallet still loading — try again in a second");
    setBusy(true); setError(null);
    try {
      await onboard();
      const { nonce } = await api<{ nonce: string }>(`/api/nonce?address=${auth.address}`);
      const sigDeadline = BigInt(Math.floor(Date.now() / 1000) + 600);
      const sig = await auth.signTypedData({
        domain: domain(),
        types: { Join: [{ name: "flockId", type: "uint256" }, { name: "buyer", type: "address" }, { name: "nonce", type: "uint256" }, { name: "deadline", type: "uint256" }] },
        primaryType: "Join",
        message: { flockId: BigInt(id), buyer: auth.address, nonce: BigInt(nonce), deadline: sigDeadline },
      });
      const r = await api<{ hash: string }>("/api/join", { id, buyer: auth.address, sigDeadline: sigDeadline.toString(), sig });
      setLastTx(r.hash);
      return r.hash;
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [auth, onboard]);

  const create = useCallback(async (v: CreateFlockValues): Promise<string | undefined> => {
    if (!auth.loggedIn) { auth.login(); return; }
    if (!auth.address) { setError("Wallet still loading"); return; }
    setBusy(true); setError(null);
    try {
      await onboard();
      const { nonce } = await api<{ nonce: string }>(`/api/nonce?address=${auth.address}`);
      const m = (x: number) => parseUnits(x.toFixed(6), 6);
      const msg = {
        seller: auth.address,
        titleHash: keccak256(toBytes(v.title)),
        fixedCost: m(v.fixedCost),
        unitCost: m(v.unitCost),
        bonusPerBuyer: m(v.bonusPerBuyer),
        deadline: BigInt(Math.floor(Date.now() / 1000) + Math.round(v.deadlineMinutes * 60)),
        minBuyers: v.minBuyers,
        maxBuyers: v.maxBuyers,
        nonce: BigInt(nonce),
        sigDeadline: BigInt(Math.floor(Date.now() / 1000) + 600),
      };
      const sig = await auth.signTypedData({
        domain: domain(),
        types: {
          Create: [
            { name: "seller", type: "address" }, { name: "titleHash", type: "bytes32" }, { name: "fixedCost", type: "uint128" },
            { name: "unitCost", type: "uint128" }, { name: "bonusPerBuyer", type: "uint128" }, { name: "deadline", type: "uint64" },
            { name: "minBuyers", type: "uint32" }, { name: "maxBuyers", type: "uint32" }, { name: "nonce", type: "uint256" }, { name: "sigDeadline", type: "uint256" },
          ],
        },
        primaryType: "Create",
        message: msg,
      });
      const r = await api<{ hash: string; id: string }>("/api/create", {
        seller: auth.address, title: v.title, imageUrl: v.imageUrl,
        fixedCost: msg.fixedCost.toString(), unitCost: msg.unitCost.toString(), bonusPerBuyer: msg.bonusPerBuyer.toString(),
        deadline: msg.deadline.toString(), minBuyers: v.minBuyers, maxBuyers: v.maxBuyers, sigDeadline: msg.sigDeadline.toString(), sig,
      });
      setLastTx(r.hash);
      return r.id;
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [auth, onboard]);

  return { ...auth, busy, error, lastTx, join, create, onboard };
}

/** All flocks for the landing page. */
export function useFlocks(ms = 3000) {
  const [flocks, setFlocks] = useState<FlockState[]>([]);
  useEffect(() => {
    let alive = true;
    const go = () => api<{ flocks: FlockState[] }>("/api/flocks").then((j) => alive && setFlocks(j.flocks)).catch(() => {});
    go();
    const t = setInterval(go, ms);
    return () => { alive = false; clearInterval(t); };
  }, [ms]);
  return flocks;
}
