"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { useConnection } from "./connection-context";
import { useWeb3Auth } from "./web3auth-provider";

export function SiteHeader() {
  const router = useRouter();
  const { user, setUser } = useConnection();
  const { connect, getUserInfo, logout, web3auth } = useWeb3Auth();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isConnecting, setIsConnecting] = React.useState(false);

  const handleDisconnect = React.useCallback(async () => {
    try {
      await logout();
    } catch (e) {
      console.error(e);
    } finally {
      setUser(null);
      setIsMenuOpen(false);
      router.push("/onboarding");
    }
  }, [logout, router, setUser]);

  const handleNavigate = React.useCallback(
    (path: string) => {
      setIsMenuOpen(false);
      router.push(path);
    },
    [router]
  );

  const iconBaseStyle: React.CSSProperties = {
    width: "1.1rem",
    height: "1.1rem",
    borderRadius: "9999px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.65rem",
    fontWeight: 600,
    marginRight: "0.5rem"
  };

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        borderBottom: "1px solid rgba(148, 163, 184, 0.4)",
        backgroundColor: "rgba(15,23,42,0.96)",
        backdropFilter: "blur(10px)",
        color: "white"
      }}
    >
      <div
        style={{
          maxWidth: "72rem",
          margin: "0 auto",
          padding: "0.75rem 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span
            style={{
              width: "1.75rem",
              height: "1.75rem",
              borderRadius: "9999px",
              background:
                "radial-gradient(circle at 30% 20%, #38bdf8, #4f46e5 60%, #1d4ed8)",
              boxShadow:
                "0 10px 15px -3px rgba(37, 99, 235, 0.7), 0 4px 6px -4px rgba(37, 99, 235, 0.8)"
            }}
          />
          <div>
            <span style={{ fontWeight: 600, letterSpacing: "0.03em" }}>
              Agentic Relief Network
            </span>
          </div>
        </div>

        <div style={{ fontSize: "0.9rem" }}>
          {!user ? (
            <button
              type="button"
              onClick={async () => {
                if (!web3auth) return;
                setIsConnecting(true);
                try {
                  await connect();
                  const info = await getUserInfo();
                  setUser({
                    name: info?.name ?? "Unknown user",
                    email: info?.email ?? "unknown@example.com"
                  });
                } catch (e) {
                  console.error(e);
                } finally {
                  setIsConnecting(false);
                }
              }}
              style={{
                padding: "0.5rem 1.1rem",
                borderRadius: "9999px",
                border: "1px solid rgba(148, 163, 184, 0.9)",
                color: "white",
                backgroundColor: "transparent",
                textDecoration: "none",
                fontWeight: 500,
                cursor: !web3auth || isConnecting ? "not-allowed" : "pointer",
                opacity: !web3auth || isConnecting ? 0.7 : 1
              }}
              disabled={!web3auth || isConnecting}
            >
              {isConnecting ? "Connecting…" : "Connect"}
            </button>
          ) : (
            <div style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setIsMenuOpen((open) => !open)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.45rem 0.9rem",
                  borderRadius: "9999px",
                  border: "1px solid rgba(148, 163, 184, 0.9)",
                  background:
                    "linear-gradient(to right, rgba(30,64,175,0.9), rgba(37,99,235,0.9))",
                  color: "white",
                  fontWeight: 500,
                  cursor: "pointer"
                }}
              >
                <span
                  style={{
                    maxWidth: "10rem",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    textAlign: "left"
                  }}
                >
                  {user.name || "Account"}
                </span>
                <span style={{ fontSize: "0.6rem", opacity: 0.8 }}>
                  ▼
                </span>
              </button>

              {isMenuOpen && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    marginTop: "0.5rem",
                    minWidth: "13rem",
                    borderRadius: "0.75rem",
                    backgroundColor: "rgba(15,23,42,0.98)",
                    border: "1px solid rgba(148, 163, 184, 0.5)",
                    boxShadow:
                      "0 10px 25px -8px rgba(15,23,42,0.9), 0 0 0 1px rgba(15,23,42,0.2)",
                    padding: "0.4rem 0",
                    backdropFilter: "blur(16px)"
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleNavigate("/app")}
                    style={{
                      width: "100%",
                      padding: "0.45rem 0.9rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      background: "transparent",
                      border: "none",
                      color: "white",
                      cursor: "pointer",
                      fontSize: "0.9rem"
                    }}
                  >
                    <span
                      style={{
                        ...iconBaseStyle,
                        background:
                          "radial-gradient(circle at 30% 20%, #22c55e, #16a34a)"
                      }}
                    >
                      O
                    </span>
                    My Organization
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavigate("/app")}
                    style={{
                      width: "100%",
                      padding: "0.45rem 0.9rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      background: "transparent",
                      border: "none",
                      color: "white",
                      cursor: "pointer",
                      fontSize: "0.9rem"
                    }}
                  >
                    <span
                      style={{
                        ...iconBaseStyle,
                        background:
                          "radial-gradient(circle at 30% 20%, #38bdf8, #0ea5e9)"
                      }}
                    >
                      A
                    </span>
                    My Alliances
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavigate("/app")}
                    style={{
                      width: "100%",
                      padding: "0.45rem 0.9rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      background: "transparent",
                      border: "none",
                      color: "white",
                      cursor: "pointer",
                      fontSize: "0.9rem"
                    }}
                  >
                    <span
                      style={{
                        ...iconBaseStyle,
                        background:
                          "radial-gradient(circle at 30% 20%, #f97316, #ea580c)"
                      }}
                    >
                      I
                    </span>
                    My Initiatives
                  </button>
                  <div
                    style={{
                      borderTop: "1px solid rgba(51, 65, 85, 0.9)",
                      margin: "0.25rem 0"
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    style={{
                      width: "100%",
                      padding: "0.45rem 0.9rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      background: "transparent",
                      border: "none",
                      color: "#fecaca",
                      cursor: "pointer",
                      fontSize: "0.9rem"
                    }}
                  >
                    <span
                      style={{
                        ...iconBaseStyle,
                        background:
                          "radial-gradient(circle at 30% 20%, #f97373, #b91c1c)"
                      }}
                    >
                      ⏻
                    </span>
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}


