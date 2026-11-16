"use client";
// OWNER: Shantam (wiring). Phone join page. Visuals: components/join/JoinScreen.tsx (Teammate B).
import { use, useEffect, useState } from "react";
import JoinScreen from "@/components/join/JoinScreen";
import { useFlock, useFlockActions } from "@/lib/useFlock";
import { NotReady } from "@/components/shared/NotReady";
import { PurchaseBanner } from "@/components/shared/PurchaseBanner";

export default function JoinPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number(use(params).id);
  const { flock, me, error: readErr, toast, settlement } = useFlock(id);
  const a = useFlockActions();
  const [shownToast, setShownToast] = useState<string | null>(null);
  useEffect(() => { if (!toast) return; setShownToast(toast); const t = setTimeout(() => setShownToast(null), 2500); return () => clearTimeout(t); }, [toast]);
  if (!flock) return <NotReady error={readErr} />;
  return (
    <>
    <JoinScreen
      flock={flock}
      me={me}
      loggedIn={a.loggedIn}
      busy={a.busy}
      error={a.error}
      lastRebateToast={shownToast}
      onLogin={a.login}
      onJoin={() => a.join(id)}
      onLogout={a.logout}
    />
    {settlement && (
      <div className="fixed inset-x-0 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] z-[45] px-5">
        <div className="mx-auto max-w-md">
          <PurchaseBanner s={settlement} className="bg-[#0f1a14]/90" />
        </div>
      </div>
    )}
    </>
  );
}
