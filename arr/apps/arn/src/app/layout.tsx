import type { Metadata } from "next";
import React from "react";
import dynamic from "next/dynamic";
import { SiteHeader } from "../components/site-header";
import { ConnectionProvider } from "../components/connection-context";

const Web3AuthProvider = dynamic(
  () =>
    import("../components/web3auth-provider").then(
      (mod) => mod.Web3AuthProvider
    ),
  { ssr: false }
);

const WalletProvider = dynamic(
  () =>
    import("../components/wallet-provider").then((mod) => mod.WalletProvider),
  { ssr: false }
);

export const metadata: Metadata = {
  title: "Agentic Relief Network",
  description: "Agentic Relief Network ARN App"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100vh",
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
          background:
            "radial-gradient(circle at top, #1d4ed8 0, #020617 40%, #000 100%)",
          color: "#e5e7eb"
        }}
      >
        <Web3AuthProvider>
          <ConnectionProvider>
            <WalletProvider>
              <SiteHeader />
              <main
                style={{
                  minHeight: "calc(100vh - 3rem)",
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "center",
                  padding: "2.5rem 1rem"
                }}
              >
                {children}
              </main>
            </WalletProvider>
          </ConnectionProvider>
        </Web3AuthProvider>
      </body>
    </html>
  );
}

