"use client";

import Link from "next/link";
import React from "react";
import { useWeb3Auth } from "../components/web3auth-provider";

export function SiteHeader() {
  const { isConnected, isInitializing, userInfo, connect, logout } =
    useWeb3Auth();

  const displayLabel =
    userInfo?.name || userInfo?.email || "Connected Account";

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        backdropFilter: "blur(12px)",
        background: "rgba(15,23,42,0.85)",
        borderBottom: "1px solid rgba(148,163,184,0.4)"
      }}
    >
      <div
        style={{
          margin: "0 auto",
          maxWidth: "72rem",
          padding: "0.75rem 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            textDecoration: "none"
          }}
        >
          <span
            style={{
              width: "0.75rem",
              height: "0.75rem",
              borderRadius: "9999px",
              background:
                "radial-gradient(circle at 30% 30%, #38bdf8, #6366f1 40%, #a855f7)"
            }}
          />
          <span
            style={{
              fontSize: "1rem",
              fontWeight: 600,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              color: "#e5e7eb"
            }}
          >
            Agentic Relief Network
          </span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Link
            href="/onboarding"
            style={{
              fontSize: "0.875rem",
              color: "#e5e7eb",
              textDecoration: "none"
            }}
          >
            Register organization
          </Link>

          {!isConnected ? (
            <button
              type="button"
              onClick={connect}
              disabled={isInitializing}
              style={{
                fontSize: "0.875rem",
                padding: "0.35rem 0.9rem",
                borderRadius: "9999px",
                border: "1px solid rgba(148,163,184,0.9)",
                background:
                  "linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,64,175,0.9))",
                color: "#e5e7eb",
                cursor: isInitializing ? "wait" : "pointer"
              }}
            >
              {isInitializing ? "Connecting..." : "Connect"}
            </button>
          ) : (
            <button
              type="button"
              onClick={logout}
              style={{
                fontSize: "0.875rem",
                padding: "0.35rem 0.9rem",
                borderRadius: "9999px",
                border: "1px solid rgba(34,197,94,0.9)",
                background:
                  "linear-gradient(135deg, rgba(21,128,61,0.9), rgba(22,163,74,0.9))",
                color: "#ecfdf3",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem"
              }}
            >
              <span
                style={{
                  width: "0.45rem",
                  height: "0.45rem",
                  borderRadius: "9999px",
                  backgroundColor: "#bbf7d0"
                }}
              />
              <span
                style={{
                  maxWidth: "10rem",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}
              >
                {displayLabel}
              </span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}


