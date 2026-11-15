"use client";
// One auth interface for the whole app. Uses Privy (email login → embedded wallet) when
// NEXT_PUBLIC_PRIVY_APP_ID is set; otherwise a harmless stub so previews still render.
import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { PrivyProvider, usePrivy, useWallets } from "@privy-io/react-auth";
import { createWalletClient, custom, type TypedDataDefinition } from "viem";
import { monad, PRIVY_APP_ID } from "./config";

export interface AuthApi {
  enabled: boolean;              // false when Privy isn't configured
  ready: boolean;
  loggedIn: boolean;
  address: `0x${string}` | null; // embedded wallet address
  email: string | null;
  login: () => void;
  logout: () => void;
  signTypedData: (td: TypedDataDefinition) => Promise<`0x${string}`>;
}

const AuthCtx = createContext<AuthApi>({
  enabled: false,
  ready: true,
  loggedIn: false,
  address: null,
  email: null,
  login: () => alert("Login isn't configured yet (NEXT_PUBLIC_PRIVY_APP_ID missing). Use /preview pages for UI work."),
  logout: () => {},
  signTypedData: async () => { throw new Error("Privy not configured"); },
});

export const useAuth = () => useContext(AuthCtx);

function PrivyBridge({ children }: { children: ReactNode }) {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { wallets } = useWallets();
  const embedded = wallets.find((w) => w.walletClientType === "privy") ?? wallets[0];
  const address = (embedded?.address as `0x${string}` | undefined) ?? (user?.wallet?.address as `0x${string}` | undefined) ?? null;

  const signTypedData = useCallback(
    async (td: TypedDataDefinition) => {
      if (!embedded) throw new Error("Wallet not ready yet — wait a second and try again");
      try { await embedded.switchChain(monad.id); } catch {}
      const provider = await embedded.getEthereumProvider();
      const client = createWalletClient({ account: embedded.address as `0x${string}`, chain: monad, transport: custom(provider) });
      return client.signTypedData(td as Parameters<typeof client.signTypedData>[0]);
    },
    [embedded]
  );

  const api = useMemo<AuthApi>(
    () => ({ enabled: true, ready, loggedIn: authenticated, address, email: user?.email?.address ?? null, login, logout, signTypedData }),
    [ready, authenticated, address, user, login, logout, signTypedData]
  );
  return <AuthCtx.Provider value={api}>{children}</AuthCtx.Provider>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  if (!PRIVY_APP_ID) return <>{children}</>;
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ["email", "google"],
        appearance: { theme: "dark", accentColor: "#836EF9", logo: "/flock-logo.svg", landingHeader: "Join the flock 🦆" },
        embeddedWallets: { ethereum: { createOnLogin: "users-without-wallets" }, showWalletUIs: false },
        defaultChain: monad,
        supportedChains: [monad],
      }}
    >
      <PrivyBridge>{children}</PrivyBridge>
    </PrivyProvider>
  );
}
