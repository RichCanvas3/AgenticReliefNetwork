import type { Metadata } from "next";
import React from "react";
import dynamic from "next/dynamic";
import { SiteHeader } from "../components/site-header";
import { ConnectionProvider } from "../components/connection-context";
import { AppThemeProvider } from "../components/app-theme-provider";

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
      <body>
        <AppThemeProvider>
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
        </AppThemeProvider>
      </body>
    </html>
  );
}