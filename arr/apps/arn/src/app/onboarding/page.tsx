"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { useConnection } from "../../components/connection-context";
import { useWeb3Auth } from "../../components/web3auth-provider";

import {
  createAgentWithWalletForAA,
  getCounterfactualAAAddressByAgentName
} from "@agentic-trust/core/client";
import { keccak256, stringToHex } from "viem";
import { sepolia } from "viem/chains";



type OrgType =
  | "operationalRelief"
  | "resource"
  | "alliance";

interface OrgDetails {
  name: string;
  address: string;
  type: OrgType | "";
}

type Step = 1 | 2 | 3 | 4 | 5;

export default function OnboardingPage() {
  const router = useRouter();
  const { user, setUser } = useConnection();
  const {
    web3auth,
    isInitializing,
    error: authError,
    connect,
    logout,
    getUserInfo
  } = useWeb3Auth();

  const [step, setStep] = React.useState<Step>(1);
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [isCheckingAvailability, setIsCheckingAvailability] =
    React.useState(false);
  const [org, setOrg] = React.useState<OrgDetails>({
    name: "",
    address: "",
    type: ""
  });
  const [arn, setArn] = React.useState<string | null>(null);
  const [walletAddress, setWalletAddress] = React.useState<string | null>(null);
  const [aaAddress, setAaAddress] = React.useState<string | null>(null);
  const [firstName, setFirstName] = React.useState<string>("");
  const [lastName, setLastName] = React.useState<string>("");
  const [isCreatingArn, setIsCreatingArn] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const emailDomain = React.useMemo(() => {
    if (!user?.email) return null;
    const parts = user.email.split("@");
    if (parts.length !== 2) return null;
    return parts[1].toLowerCase();
  }, [user?.email]);

  // Surface any underlying Web3Auth initialization errors into the local error UI.
  React.useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  const handleConnectSocial = React.useCallback(async () => {
    if (!web3auth) return;
    setIsConnecting(true);
    setError(null);

    try {
      await connect();
      const userInfo = await getUserInfo();

      const resolvedName = userInfo?.name ?? "Unknown user";
      const resolvedEmail = userInfo?.email ?? "unknown@example.com";

      setUser({
        name: resolvedName,
        email: resolvedEmail
      });

      // Best-effort split of the display name into first/last.
      if (resolvedName && typeof resolvedName === "string") {
        const parts = resolvedName.split(" ").filter(Boolean);
        setFirstName(parts[0] ?? "");
        setLastName(parts.length > 1 ? parts.slice(1).join(" ") : "");
      }

      // Also resolve and store the connected wallet address (EOA) for display.
      const provider = (web3auth as any)?.provider as
        | { request: (args: { method: string; params?: any[] }) => Promise<any> }
        | undefined;
      if (provider) {
        try {
          const accounts = await provider.request({
            method: "eth_accounts"
          });
          const account = Array.isArray(accounts) && accounts[0];
          if (account && typeof account === "string") {
            setWalletAddress(account);

          }
        } catch (e) {
          console.error("Failed to resolve wallet address after connect:", e);
        }
      }

      setStep(2);
    } catch (e) {
      console.error(e);
      setError("Unable to complete social login. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  }, [web3auth, connect, getUserInfo, setUser]);

  const handleOrgChange = (field: keyof OrgDetails, value: string) => {
    setOrg((prev) => ({ ...prev, [field]: value }));
  };

  const handleOrgNext = React.useCallback(async () => {
    if (!org.name || !org.address || !org.type) {
      setError("Please complete all organization fields before continuing.");
      return;
    }
    if (!emailDomain) {
      setError(
        "We could not determine your email domain. Please disconnect and reconnect, then try again."
      );
      return;
    }

    // Derive candidate agent name from email domain, e.g. "example.org" -> "example-arn".
    const domainParts = emailDomain.split(".");
    const domainBase =
      domainParts.length > 1
        ? domainParts.slice(0, -1).join("-")
        : domainParts[0];
    const candidateName = `${domainBase}-arn`;

    setIsCheckingAvailability(true);
    try {
      const response = await fetch("/api/agent-availability", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name: candidateName })
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(
          payload?.error ??
            "Unable to check ARN domain availability. Please try again."
        );
        return;
      }

      if (!payload.available) {
        setError(
          `An agent already exists with the name "${candidateName}". Please disconnect and sign in with an account whose email domain matches the organization you are registering.`
        );
        return;
      }

      setError(null);
      setStep(4);
    } catch (e) {
      console.error(e);
      setError(
        "Unable to check ARN domain availability. Please try again in a moment."
      );
    } finally {
      setIsCheckingAvailability(false);
    }
  }, [org, emailDomain]);

  const handleDisconnectAndReset = React.useCallback(async () => {
    setError(null);
    try {
      await logout();
    } catch (e) {
      console.error(e);
    } finally {
      setUser(null);
      setOrg({
        name: "",
        address: "",
        type: ""
      });
      setArn(null);
      setWalletAddress(null);
      setAaAddress(null);
      setFirstName("");
      setLastName("");
      setStep(1);
    }
  }, [web3auth]);

  const handleCreateArn = React.useCallback(async () => {
    if (!emailDomain) {
      setError(
        "We could not determine your email domain. Please disconnect and reconnect, then try again."
      );
      return;
    }

    if (!web3auth || !(web3auth as any).provider) {
      setError(
        "Wallet provider is not available. Please complete the social login step first."
      );
      return;
    }

    setIsCreatingArn(true);
    setError(null);

    try {
      // Resolve an EIP-1193 provider (Web3Auth first, then window.ethereum as fallback).
      const eip1193Provider =
        (web3auth as any).provider ??
        (typeof window !== "undefined" ? (window as any).ethereum : null);

      if (!eip1193Provider) {
        setError(
          "No EIP-1193 provider available. Please ensure your wallet is connected."
        );
        return;
      }

      const provider = eip1193Provider as {
        request: (args: { method: string; params?: any[] }) => Promise<any>;
      };

      // Resolve connected account (EOA) from provider
      const accounts = await provider.request({
        method: "eth_accounts"
      });
      const account = Array.isArray(accounts) && accounts[0];

      if (!account || typeof account !== "string") {
        setError(
          "We could not determine your wallet address. Please disconnect and reconnect, then try again."
        );
        return;
      }


      // Strip TLD/extension from the email domain before forming the agent name,
      // e.g. "example.org" -> "example-arn", "example.co.uk" -> "example-co-arn".
      const domainParts = (emailDomain ?? "").split(".");
      const domainBase =
        domainParts.length > 1
          ? domainParts.slice(0, -1).join("-")
          : domainParts[0];
      const agentName = `${domainBase}-arn`;
      // Compute the counterfactual AA address for the agent using the client helper.
      const agentAccountAddress = await getCounterfactualAAAddressByAgentName(
        agentName,
        account as `0x${string}`,
        {
          ethereumProvider: provider as any,
          chain: sepolia
        }
      );

      if (
        !agentAccountAddress ||
        typeof agentAccountAddress !== "string" ||
        !agentAccountAddress.startsWith("0x")
      ) {
        setError(
          "Failed to compute account abstraction address for this agent. Please retry."
        );
        return;
      }

      console.info("......... computedAa (agent AA) ......... ", agentAccountAddress);

      const ensOrgName = "8004-agent";

      console.info("......... eip1193Provider: ", eip1193Provider);

      const result = await createAgentWithWalletForAA({
        agentData: {
          agentName,
          agentAccount: agentAccountAddress as `0x${string}`,
          description: 'arn account',
          image: 'https://www.google.com',
          agentUrl: 'https://www.google.com',
        },
        account: account as `0x${string}`,
        ethereumProvider: eip1193Provider as any,

        useAA: true,
        ensOptions: {
          enabled: true,
          orgName: ensOrgName
        },
        chainId: sepolia.id
      });

      console.info("......... result ......... ", result);
      // After successfully creating the agent AA, create a trust relationship
      // attestation between the individual's AA and the agent AA.
      try {

      } catch (e) {
        console.error(
          "Failed to create trust relationship attestation for agent:",
          e
        );
      }









      // For the ARN onboarding UI, treat a successful client-side flow as success
      // and use the human-readable agent name as the ARN identifier.
      setArn(agentName);
      setStep(5);
    } catch (e) {
      console.error(e);
      setError(
        "Unable to create ARN Identity at this time. Please try again."
      );
    } finally {
      setIsCreatingArn(false);
    }
  }, [emailDomain, org.name, web3auth]);

  const goToAppEnvironment = () => {
    router.push("/app");
  };

  return (
    <main
      style={{
        padding: "3rem 2rem",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        maxWidth: "48rem",
        margin: "0 auto"
      }}
    >
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
          Organization Onboarding
        </h1>
        <p style={{ maxWidth: "40rem", lineHeight: 1.6 }}>
          Follow a few simple steps to register your organization, create an
          ARN Identity, and then continue into the application environment.
        </p>
      </header>

      <section
        style={{
          marginBottom: "1.5rem",
          fontSize: "0.9rem",
          color: "#4b5563"
        }}
      >
        <strong>Step {step} of 5</strong>
      </section>

      {error && (
        <div
          style={{
            marginBottom: "1.5rem",
            padding: "0.75rem 1rem",
            borderRadius: "0.5rem",
            backgroundColor: "#fef2f2",
            color: "#991b1b",
            border: "1px solid #fecaca"
          }}
        >
          {error}
        </div>
      )}

      {step === 1 && (
        <section
          style={{
            padding: "1.75rem 1.5rem",
            borderRadius: "0.75rem",
            border: "1px solid rgba(148, 163, 184, 0.6)",
            backgroundColor: "white"
          }}
        >
          <h2 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>
            1. Connect using your social login
          </h2>
          <p style={{ marginBottom: "1.25rem", lineHeight: 1.5 }}>
            We use Web3Auth to let you sign in with familiar social providers,
            while also preparing a wallet that can be used for ARN operations.
          </p>

          {isInitializing && (
            <p>Initializing Web3Auth widget, please wait…</p>
          )}

          {!isInitializing && !error && (
            <button
              type="button"
              onClick={handleConnectSocial}
              disabled={!web3auth || isConnecting}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "9999px",
                border: "none",
                backgroundColor: "#2563eb",
                color: "white",
                fontWeight: 600,
                cursor: !web3auth || isConnecting ? "not-allowed" : "pointer",
                opacity: !web3auth || isConnecting ? 0.7 : 1
              }}
            >
              {isConnecting ? "Connecting…" : "Connect with social login"}
            </button>
          )}
        </section>
      )}

      {step === 2 && (
        <section
          style={{
            padding: "1.75rem 1.5rem",
            borderRadius: "0.75rem",
            border: "1px solid rgba(148, 163, 184, 0.6)",
            backgroundColor: "white"
          }}
        >
          <h2 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>
            2. Your details
          </h2>

          {user && (
            <div style={{ marginBottom: "1.25rem", lineHeight: 1.5 }}>
              <p>
                Email: <strong>{user.email}</strong>
              </p>
              {walletAddress && (
                <p
                  style={{
                    marginTop: "0.25rem",
                    fontSize: "0.85rem",
                    color: "#6b7280",
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace"
                  }}
                >
                  EOA: <span>{walletAddress}</span>
                </p>
              )}
              {aaAddress && (
                <p
                  style={{
                    marginTop: "0.15rem",
                    fontSize: "0.85rem",
                    color: "#6b7280",
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace"
                  }}
                >
                  AA account: <span>{aaAddress}</span>
                </p>
              )}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span>First name</span>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                style={{
                  padding: "0.5rem 0.75rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #cbd5f5"
                }}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span>Last name</span>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                style={{
                  padding: "0.5rem 0.75rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #cbd5f5"
                }}
              />
            </label>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "1.5rem"
            }}
          >
            <button
              type="button"
              onClick={() => setStep(1)}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "9999px",
                border: "1px solid #cbd5f5",
                backgroundColor: "white",
                cursor: "pointer"
              }}
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              style={{
                padding: "0.5rem 1.25rem",
                borderRadius: "9999px",
                border: "none",
                backgroundColor: "#2563eb",
                color: "white",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Continue
            </button>
          </div>
        </section>
      )}

      {step === 4 && (
        <section
          style={{
            padding: "1.75rem 1.5rem",
            borderRadius: "0.75rem",
            border: "1px solid rgba(148, 163, 184, 0.6)",
            backgroundColor: "white"
          }}
        >
          <h2 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>
            3. Organization details
          </h2>
          {user && (
            <div style={{ marginBottom: "1rem", lineHeight: 1.5 }}>
              <p>
                Signed in as{" "}
                <strong>
                  {user.name} ({user.email})
                </strong>
                .
              </p>
              {walletAddress && (
                <p
                  style={{
                    marginTop: "0.15rem",
                    fontSize: "0.8rem",
                    color: "#6b7280",
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace"
                  }}
                >
                  Wallet:{" "}
                  <span>
                    {walletAddress.slice(0, 6)}...
                    {walletAddress.slice(-4)}
                  </span>
                </p>
              )}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span>Organization name</span>
              <input
                type="text"
                value={org.name}
                onChange={(e) => handleOrgChange("name", e.target.value)}
                style={{
                  padding: "0.5rem 0.75rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #cbd5f5"
                }}
              />
              {emailDomain && (
                <span
                  style={{
                    marginTop: "0.25rem",
                    fontSize: "0.8rem",
                    color: "#6b7280"
                  }}
                >
                  Email domain from your login:{" "}
                  <strong>{emailDomain}</strong>. This domain should be
                  associated with this organization.
                </span>
              )}
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span>Organization address</span>
              <input
                type="text"
                value={org.address}
                onChange={(e) => handleOrgChange("address", e.target.value)}
                style={{
                  padding: "0.5rem 0.75rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #cbd5f5"
                }}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span>Organization type</span>
              <select
                value={org.type}
                onChange={(e) =>
                  handleOrgChange("type", e.target.value as OrgType | "")
                }
                style={{
                  padding: "0.5rem 0.75rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #cbd5f5"
                }}
              >
                <option value="">Select a type…</option>
                <option value="operationalRelief">
                  Operational Relief Organization
                </option>
                <option value="resource">Resource Organization</option>
                <option value="alliance">Alliance Organization</option>
              </select>
            </label>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "1.5rem"
            }}
          >
            <button
              type="button"
              onClick={() => setStep(2)}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "9999px",
                border: "1px solid #cbd5f5",
                backgroundColor: "white",
                cursor: "pointer"
              }}
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleOrgNext}
              disabled={isCheckingAvailability}
              style={{
                padding: "0.5rem 1.25rem",
                borderRadius: "9999px",
                border: "none",
                backgroundColor: "#2563eb",
                color: "white",
                fontWeight: 600,
                cursor: isCheckingAvailability ? "not-allowed" : "pointer",
                opacity: isCheckingAvailability ? 0.7 : 1
              }}
            >
              {isCheckingAvailability ? "Checking availability…" : "Continue"}
            </button>
          </div>

          {emailDomain && (
            <div
              style={{
                marginTop: "1rem",
                fontSize: "0.8rem",
                color: "#6b7280"
              }}
            >
              <span>
                If this domain is not associated with the organization name,
                you can disconnect and choose a different account.
              </span>
              <button
                type="button"
                onClick={handleDisconnectAndReset}
                style={{
                  marginLeft: "0.5rem",
                  padding: 0,
                  border: "none",
                  background: "none",
                  color: "#2563eb",
                  cursor: "pointer",
                  textDecoration: "underline"
                }}
              >
                Disconnect and use another account
              </button>
            </div>
          )}
        </section>
      )}

      {step === 3 && (
        <section
          style={{
            padding: "1.75rem 1.5rem",
            borderRadius: "0.75rem",
            border: "1px solid rgba(148, 163, 184, 0.6)",
            backgroundColor: "white"
          }}
        >
          <h2 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>
            4. Create ARN Identity
          </h2>
          <p style={{ marginBottom: "1rem", lineHeight: 1.5 }}>
            We will create an ARN Identity for this organization. There is no
            manual review step; anyone can create an ARN Identity.
          </p>

          <ul style={{ paddingLeft: "1.25rem", marginBottom: "1.25rem" }}>
            <li>
              <strong>Name:</strong> {org.name}
            </li>
            <li>
              <strong>Address:</strong> {org.address}
            </li>
            {emailDomain && (
              <li>
                <strong>Login email domain:</strong> {emailDomain}
              </li>
            )}
            <li>
              <strong>Type:</strong>{" "}
              {org.type === "operationalRelief"
                ? "Operational Relief Organization"
                : org.type === "resource"
                  ? "Resource Organization"
                  : "Alliance Organization"}
            </li>
          </ul>

          <p style={{ marginBottom: "1.5rem" }}>
            Is it OK to create an ARN Identity for this organization now?
          </p>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              type="button"
              onClick={() => setStep(3)}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "9999px",
                border: "1px solid #cbd5f5",
                backgroundColor: "white",
                cursor: "pointer"
              }}
            >
              Go back
            </button>
            <button
              type="button"
              onClick={handleCreateArn}
              disabled={isCreatingArn}
              style={{
                padding: "0.5rem 1.25rem",
                borderRadius: "9999px",
                border: "none",
                backgroundColor: "#16a34a",
                color: "white",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              {isCreatingArn ? "Creating ARN Identity…" : "Yes, create ARN Identity"}
            </button>
          </div>

          {emailDomain && (
            <p
              style={{
                marginTop: "1rem",
                fontSize: "0.85rem",
                color: "#4b5563"
              }}
            >
              If this email domain is not associated with the organization,
              you can{" "}
              <button
                type="button"
                onClick={handleDisconnectAndReset}
                style={{
                  padding: 0,
                  border: "none",
                  background: "none",
                  color: "#2563eb",
                  cursor: "pointer",
                  textDecoration: "underline",
                  fontSize: "0.85rem"
                }}
              >
                disconnect and sign in with a different account
              </button>{" "}
              before creating the ARN Identity.
            </p>
          )}
        </section>
      )}

      {step === 5 && arn && (
        <section
          style={{
            padding: "1.75rem 1.5rem",
            borderRadius: "0.75rem",
            border: "1px solid rgba(34, 197, 94, 0.7)",
            background:
              "linear-gradient(to bottom right, rgba(22,163,74,0.08), rgba(22,163,74,0.02))"
          }}
        >
          <h2 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>
            5. Your ARN Identity
          </h2>

          <p style={{ marginBottom: "1rem", lineHeight: 1.5 }}>
            The ARN Identity for{" "}
            <strong>{org.name || "your organization"}</strong> has been
            created.
          </p>

          <div
            style={{
              padding: "0.85rem 1rem",
              borderRadius: "0.5rem",
              backgroundColor: "white",
              border: "1px dashed rgba(34, 197, 94, 0.7)",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, monospace"
            }}
          >
            {arn}
          </div>

          <p style={{ marginTop: "1.25rem", marginBottom: "1.25rem" }}>
            Next, you&apos;ll move into the application environment where we
            manage operations, resources, and alliances using this ARN.
          </p>

          <button
            type="button"
            onClick={goToAppEnvironment}
            style={{
              padding: "0.6rem 1.35rem",
              borderRadius: "9999px",
              border: "none",
              backgroundColor: "#2563eb",
              color: "white",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Go to application environment
          </button>
        </section>
      )}
    </main>
  );
}


