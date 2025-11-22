import type { Metadata } from "next";
import React from "react";
import { Web3AuthProvider } from "../components/web3auth-provider";
import { SiteHeader } from "../components/site-header";

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
        </Web3AuthProvider>
      </body>
    </html>
  );
}


