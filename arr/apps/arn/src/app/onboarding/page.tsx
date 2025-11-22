"use client";

import React from "react";
import { useWeb3Auth } from "../../components/web3auth-provider";

type OrgType =
  | "operational"
  | "resource"
  | "alliance";

type Step = 1 | 2 | 3 | 4 | 5;

export default function OnboardingPage() {
  const { isConnected, userInfo, connect } = useWeb3Auth();

  const [step, setStep] = React.useState<Step>(1);

  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");

  const [orgName, setOrgName] = React.useState("");
  const [orgAddress, setOrgAddress] = React.useState("");
  const [orgType, setOrgType] = React.useState<OrgType | "">("");

  const [consentArnIdentity, setConsentArnIdentity] = React.useState(false);
  const [arnIdentifier, setArnIdentifier] = React.useState<string | null>(null);

  // Prefill from Web3Auth profile when available
  React.useEffect(() => {
    if (userInfo?.name && !firstName && !lastName) {
      const parts = userInfo.name.split(" ");
      setFirstName(parts[0] ?? "");
      setLastName(parts.slice(1).join(" "));
    }
    if (userInfo?.email && !email) {
      setEmail(userInfo.email);
    }
  }, [userInfo, firstName, lastName, email]);

  const handleNextFromStep1 = async () => {
    if (!isConnected) {
      await connect();
    }
    setStep(2);
  };

  const handleCreateArn = () => {
    if (!consentArnIdentity) return;
    // Placeholder ARN identity; in a real implementation this would be created
    // via @agentic-trust/core or a dedicated ARN identity service.
    const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
    setArnIdentifier(`ARN-${rand}`);
    setStep(5);
  };

  const isStep2Valid = firstName && lastName && email;
  const isStep3Valid = orgName && orgAddress && orgType;

  return (
    <section
      style={{
        width: "100%",
        maxWidth: "40rem",
        borderRadius: "1rem",
        background: "rgba(15,23,42,0.96)",
        boxShadow: "0 24px 60px rgba(15,23,42,0.9)",
        padding: "2.25rem 2.5rem"
      }}
    >
      <h1
        style={{
          fontSize: "1.5rem",
          fontWeight: 700,
          marginBottom: "0.5rem"
        }}
      >
        Register your organization
      </h1>
      <p
        style={{
          marginBottom: "1.75rem",
          color: "#9ca3af",
          fontSize: "0.95rem"
        }}
      >
        A short, guided onboarding to connect with your social login, confirm
        your contact information, and create an Agentic Relief Network identity
        for your organization.
      </p>

      <StepIndicator current={step} />

      {step === 1 && (
        <StepCard
          title="1. Connect using your social login"
          description="We use Web3Auth to securely connect your existing social identity (Google, Twitter, etc.) and derive a cryptographic identity under the hood."
        >
          <button
            type="button"
            onClick={handleNextFromStep1}
            style={{
              padding: "0.7rem 1.3rem",
              borderRadius: "9999px",
              border: "none",
              background:
                "linear-gradient(135deg, #38bdf8, #6366f1 40%, #a855f7 80%)",
              color: "#0b1120",
              fontWeight: 600,
              fontSize: "0.95rem",
              cursor: "pointer"
            }}
          >
            {isConnected ? "Continue" : "Connect with Web3Auth"}
          </button>
        </StepCard>
      )}

      {step === 2 && (
        <StepCard
          title="2. Verify your contact details"
          description="Confirm or update the information we inferred from your social login."
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0,1fr))",
              gap: "0.75rem"
            }}
          >
            <LabeledInput
              label="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <LabeledInput
              label="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
          <div style={{ marginTop: "0.75rem" }}>
            <LabeledInput
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div
            style={{
              marginTop: "1.25rem",
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.75rem"
            }}
          >
            <button
              type="button"
              onClick={() => setStep(1)}
              style={secondaryButton}
            >
              Back
            </button>
            <button
              type="button"
              disabled={!isStep2Valid}
              onClick={() => setStep(3)}
              style={{
                ...primaryButton,
                opacity: isStep2Valid ? 1 : 0.4,
                cursor: isStep2Valid ? "pointer" : "not-allowed"
              }}
            >
              Continue
            </button>
          </div>
        </StepCard>
      )}

      {step === 3 && (
        <StepCard
          title="3. Organization details"
          description="Tell us about the organization you are registering with the Agentic Relief Network."
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
            <LabeledInput
              label="Organization name"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
            />
            <LabeledInput
              label="Address"
              value={orgAddress}
              onChange={(e) => setOrgAddress(e.target.value)}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label
                style={{
                  fontSize: "0.8rem",
                  color: "#9ca3af",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em"
                }}
              >
                Organization type
              </label>
              <select
                value={orgType}
                onChange={(e) => setOrgType(e.target.value as OrgType | "")}
                style={{
                  borderRadius: "0.5rem",
                  padding: "0.5rem 0.75rem",
                  border: "1px solid rgba(148,163,184,0.5)",
                  backgroundColor: "#020617",
                  color: "#e5e7eb",
                  fontSize: "0.9rem"
                }}
              >
                <option value="">Select a type</option>
                <option value="operational">
                  Operational Relief Organization
                </option>
                <option value="resource">Resource Organization</option>
                <option value="alliance">Alliance Organization</option>
              </select>
            </div>
          </div>

          <div
            style={{
              marginTop: "1.25rem",
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.75rem"
            }}
          >
            <button
              type="button"
              onClick={() => setStep(2)}
              style={secondaryButton}
            >
              Back
            </button>
            <button
              type="button"
              disabled={!isStep3Valid}
              onClick={() => setStep(4)}
              style={{
                ...primaryButton,
                opacity: isStep3Valid ? 1 : 0.4,
                cursor: isStep3Valid ? "pointer" : "not-allowed"
              }}
            >
              Continue
            </button>
          </div>
        </StepCard>
      )}

      {step === 4 && (
        <StepCard
          title="4. Create ARN identity"
          description="We can now create an Agentic Relief Network (ARN) identity that can be used across participating apps and services."
        >
          <div
            style={{
              padding: "0.85rem 1rem",
              borderRadius: "0.75rem",
              background: "rgba(15,23,42,0.9)",
              border: "1px solid rgba(56,189,248,0.3)",
              fontSize: "0.85rem",
              color: "#cbd5f5"
            }}
          >
            <p style={{ marginBottom: "0.5rem" }}>
              An ARN identity links your social login and organization
              information to a reusable decentralized identifier. This prototype
              flow will simulate identity creation without writing to any live
              blockchain.
            </p>
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "0.6rem",
              marginTop: "1rem",
              fontSize: "0.9rem",
              color: "#e5e7eb"
            }}
          >
            <input
              type="checkbox"
              checked={consentArnIdentity}
              onChange={(e) => setConsentArnIdentity(e.target.checked)}
              style={{ marginTop: "0.15rem" }}
            />
            <span>
              Yes, create an Agentic Relief Network identity for this
              organization using the information I have provided.
            </span>
          </label>

          <div
            style={{
              marginTop: "1.25rem",
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.75rem"
            }}
          >
            <button
              type="button"
              onClick={() => setStep(3)}
              style={secondaryButton}
            >
              Back
            </button>
            <button
              type="button"
              disabled={!consentArnIdentity}
              onClick={handleCreateArn}
              style={{
                ...primaryButton,
                opacity: consentArnIdentity ? 1 : 0.4,
                cursor: consentArnIdentity ? "pointer" : "not-allowed"
              }}
            >
              Create ARN identity
            </button>
          </div>
        </StepCard>
      )}

      {step === 5 && arnIdentifier && (
        <StepCard
          title="5. Your ARN identity"
          description="Here is a placeholder ARN identity based on the information you provided. In a full implementation, this would be backed by on-chain and Veramo-based identity primitives."
        >
          <div
            style={{
              padding: "0.9rem 1rem",
              borderRadius: "0.75rem",
              background: "#020617",
              border: "1px solid rgba(148,163,184,0.6)",
              fontSize: "0.9rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.35rem"
            }}
          >
            <div style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
              ARN Identifier
            </div>
            <div style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace" }}>
              {arnIdentifier}
            </div>

            <hr
              style={{
                borderColor: "rgba(31,41,55,0.8)",
                margin: "0.75rem 0"
              }}
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem" }}>
              <SummaryField label="Name" value={`${firstName} ${lastName}`} />
              <SummaryField label="Email" value={email} />
              <SummaryField label="Organization" value={orgName} />
              <SummaryField label="Org type" value={prettyOrgType(orgType)} />
            </div>
          </div>

          <div
            style={{
              marginTop: "1.25rem",
              display: "flex",
              justifyContent: "flex-end"
            }}
          >
            <button
              type="button"
              onClick={() => setStep(3)}
              style={secondaryButton}
            >
              Edit details
            </button>
          </div>
        </StepCard>
      )}
    </section>
  );
}

function StepIndicator({ current }: { current: Step }) {
  const steps: { id: Step; label: string }[] = [
    { id: 1, label: "Connect" },
    { id: 2, label: "Contact" },
    { id: 3, label: "Organization" },
    { id: 4, label: "Identity" },
    { id: 5, label: "Review" }
  ];

  return (
    <ol
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: "0.5rem",
        marginBottom: "1.75rem",
        padding: 0,
        listStyle: "none",
        fontSize: "0.75rem",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        color: "#64748b"
      }}
    >
      {steps.map((step) => {
        const isActive = step.id === current;
        const isComplete = step.id < current;
        return (
          <li
            key={step.id}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: "0.35rem"
            }}
          >
            <span
              style={{
                width: "1.1rem",
                height: "1.1rem",
                borderRadius: "9999px",
                border: isActive
                  ? "2px solid #38bdf8"
                  : "1px solid rgba(148,163,184,0.7)",
                backgroundColor: isComplete ? "#22c55e" : "transparent",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.65rem",
                color: isComplete ? "#022c22" : "#e5e7eb"
              }}
            >
              {step.id}
            </span>
            <span
              style={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                color: isActive ? "#e5e7eb" : undefined
              }}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function StepCard({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2
        style={{
          fontSize: "1.1rem",
          fontWeight: 600,
          marginBottom: "0.4rem"
        }}
      >
        {title}
      </h2>
      <p
        style={{
          marginBottom: "1.25rem",
          fontSize: "0.9rem",
          color: "#9ca3af"
        }}
      >
        {description}
      </p>
      {children}
    </div>
  );
}

function LabeledInput({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
      <span
        style={{
          fontSize: "0.8rem",
          color: "#9ca3af",
          textTransform: "uppercase",
          letterSpacing: "0.06em"
        }}
      >
        {label}
      </span>
      <input
        {...props}
        style={{
          borderRadius: "0.5rem",
          padding: "0.5rem 0.75rem",
          border: "1px solid rgba(148,163,184,0.5)",
          backgroundColor: "#020617",
          color: "#e5e7eb",
          fontSize: "0.9rem"
        }}
      />
    </label>
  );
}

function SummaryField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{label}</div>
      <div style={{ fontSize: "0.9rem" }}>{value}</div>
    </div>
  );
}

function prettyOrgType(type: OrgType | ""): string {
  switch (type) {
    case "operational":
      return "Operational Relief Organization";
    case "resource":
      return "Resource Organization";
    case "alliance":
      return "Alliance Organization";
    default:
      return "";
  }
}

const primaryButton: React.CSSProperties = {
  padding: "0.6rem 1.2rem",
  borderRadius: "9999px",
  border: "none",
  background:
    "linear-gradient(135deg, #38bdf8, #6366f1 40%, #a855f7 80%)",
  color: "#0b1120",
  fontWeight: 600,
  fontSize: "0.9rem"
};

const secondaryButton: React.CSSProperties = {
  padding: "0.55rem 1.1rem",
  borderRadius: "9999px",
  border: "1px solid rgba(148,163,184,0.6)",
  backgroundColor: "transparent",
  color: "#e5e7eb",
  fontSize: "0.85rem",
  cursor: "pointer"
};


