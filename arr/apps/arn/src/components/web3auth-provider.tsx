"use client";

import React from "react";
import { Web3Auth } from "@web3auth/modal";
import { CHAIN_NAMESPACES } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";

type Web3AuthUserInfo = {
  name?: string | null;
  email?: string | null;
};

type Web3AuthContextValue = {
  isInitializing: boolean;
  isConnected: boolean;
  userInfo: Web3AuthUserInfo | null;
  connect: () => Promise<void>;
  logout: () => Promise<void>;
};

const Web3AuthContext = React.createContext<Web3AuthContextValue | undefined>(
  undefined
);

export function Web3AuthProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const web3authRef = React.useRef<Web3Auth | null>(null);
  const [isInitializing, setIsInitializing] = React.useState(false);
  const [isConnected, setIsConnected] = React.useState(false);
  const [userInfo, setUserInfo] = React.useState<Web3AuthUserInfo | null>(null);

  const ensureInstance = React.useCallback(async () => {
    if (typeof window === "undefined") return null;
    if (web3authRef.current) return web3authRef.current;

    const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID;
    if (!clientId) {
      console.warn("NEXT_PUBLIC_WEB3AUTH_CLIENT_ID is not set");
      return null;
    }

    setIsInitializing(true);
    try {
      const chainConfig = {
        chainNamespace: CHAIN_NAMESPACES.EIP155,
        // You can change this to your preferred chain (e.g. Sepolia, Base Sepolia)
        chainId: "0x1",
        rpcTarget: "https://rpc.ankr.com/eth"
      } as const;

      const privateKeyProvider = new EthereumPrivateKeyProvider({
        config: {
          chainConfig
        }
      });

      const web3auth = new Web3Auth({
        clientId,
        web3AuthNetwork: "sapphire_devnet",
        privateKeyProvider
      });

      await web3auth.initModal();
      web3authRef.current = web3auth;
      return web3auth;
    } finally {
      setIsInitializing(false);
    }
  }, []);

  const connect = React.useCallback(async () => {
    const web3auth = await ensureInstance();
    if (!web3auth) return;

    const provider = await web3auth.connect();
    if (!provider) return;

    const info = await web3auth.getUserInfo();
    setUserInfo({
      name: info.name ?? null,
      email: info.email ?? null
    });
    setIsConnected(true);
  }, [ensureInstance]);

  const logout = React.useCallback(async () => {
    const web3auth = web3authRef.current;
    if (!web3auth) return;
    await web3auth.logout();
    setIsConnected(false);
    setUserInfo(null);
  }, []);

  const value: Web3AuthContextValue = {
    isInitializing,
    isConnected,
    userInfo,
    connect,
    logout
  };

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

