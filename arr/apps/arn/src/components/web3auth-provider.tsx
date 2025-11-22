"use client";

import * as React from "react";
import type { Web3Auth } from "@web3auth/modal";

export interface Web3AuthProfile {
  name: string | null;
  email: string | null;
}

interface Web3AuthContextValue {
  web3auth: Web3Auth | null;
  isInitializing: boolean;
  error: string | null;
  isConnected: boolean;
  userInfo: Web3AuthProfile | null;
  connect: () => Promise<boolean>;
  logout: () => Promise<void>;
  getUserInfo: () => Promise<Web3AuthProfile | null>;
}

const Web3AuthContext = React.createContext<Web3AuthContextValue | undefined>(
  undefined
);

export function Web3AuthProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const [web3auth, setWeb3auth] = React.useState<Web3Auth | null>(null);
  const [isInitializing, setIsInitializing] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isConnected, setIsConnected] = React.useState<boolean>(false);
  const [userInfo, setUserInfo] = React.useState<Web3AuthProfile | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function initWeb3Auth() {
      if (typeof window === "undefined") return;

      try {
        const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID;
        if (!clientId) {
          setError(
            "Web3Auth client ID is not configured. Set NEXT_PUBLIC_WEB3AUTH_CLIENT_ID to enable social login."
          );
          return;
        }

        const { Web3Auth } = await import("@web3auth/modal");
        const { OpenloginAdapter } = await import(
          "@web3auth/openlogin-adapter"
        );
        const { EthereumPrivateKeyProvider } = await import(
          "@web3auth/ethereum-provider"
        );
        const { CHAIN_NAMESPACES } = await import("@web3auth/base");

        const chainIdHex = process.env.NEXT_PUBLIC_CHAIN_ID || "0xaa36a7"; // default Sepolia
        const rpcUrl =
          process.env.NEXT_PUBLIC_AGENTIC_TRUST_RPC_URL_SEPOLIA ||
          "https://rpc.ankr.com/eth_sepolia";

        const chainConfig = {
          chainNamespace: CHAIN_NAMESPACES.EIP155,
          chainId: chainIdHex,
          rpcTarget: rpcUrl,
          displayName: "EVM Chain",
          ticker: "ETH",
          tickerName: "Ethereum",
          decimals: 18
        };

        const privateKeyProvider = new EthereumPrivateKeyProvider({
          config: { chainConfig }
        });

        const web3authInstance = new Web3Auth({
          clientId,
          web3AuthNetwork: "sapphire_devnet",
          privateKeyProvider
        });

        const openloginAdapter = new OpenloginAdapter({
          loginSettings: {
            mfaLevel: "optional"
          }
        });

        web3authInstance.configureAdapter(openloginAdapter);
        await web3authInstance.initModal();

        if (!cancelled) {
          setWeb3auth(web3authInstance);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setError("Failed to initialize Web3Auth. Please try again later.");
        }
      } finally {
        if (!cancelled) {
          setIsInitializing(false);
        }
      }
    }

    void initWeb3Auth();

    return () => {
      cancelled = true;
    };
  }, []);

  const normalizeUserInfo = React.useCallback((info: unknown): Web3AuthProfile => {
    const record = (info ?? {}) as Record<string, unknown>;
    const nameValue = record.name;
    const emailValue = record.email;
    return {
      name: typeof nameValue === "string" ? nameValue : null,
      email: typeof emailValue === "string" ? emailValue : null
    };
  }, []);

  const connect = React.useCallback(async () => {
    if (!web3auth) return false;
    const provider = await web3auth.connect();
    if (!provider) return false;

    try {
      const rawInfo = await web3auth.getUserInfo();
      const profile = normalizeUserInfo(rawInfo);
      setUserInfo(profile);
    } catch (e) {
      console.error(e);
      setUserInfo(null);
    }

    setIsConnected(true);
    return true;
  }, [normalizeUserInfo, web3auth]);

  const logout = React.useCallback(async () => {
    if (!web3auth) return;
    await web3auth.logout();
    setIsConnected(false);
    setUserInfo(null);
  }, [web3auth]);

  const getUserInfo = React.useCallback(async () => {
    if (!web3auth) return null;
    try {
      const rawInfo = await web3auth.getUserInfo();
      const profile = normalizeUserInfo(rawInfo);
      setUserInfo(profile);
      setIsConnected(true);
      return profile;
    } catch (e) {
      console.error(e);
      setUserInfo(null);
      return null;
    }
  }, [normalizeUserInfo, web3auth]);

  const value = React.useMemo(
    () => ({
      web3auth,
      isInitializing,
      error,
      isConnected,
      userInfo,
      connect,
      logout,
      getUserInfo
    }),
    [web3auth, isInitializing, error, isConnected, userInfo, connect, logout, getUserInfo]
  );

  return (
    <Web3AuthContext.Provider value={value}>
      {children}
    </Web3AuthContext.Provider>
  );
}

export function useWeb3Auth() {
  const ctx = React.useContext(Web3AuthContext);
  if (!ctx) {
    throw new Error("useWeb3Auth must be used within a Web3AuthProvider");
  }
  return ctx;
}


