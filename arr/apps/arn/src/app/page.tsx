import Link from "next/link";

export default function HomePage() {
  return (
    <section
      style={{
        padding: "2.5rem 3rem",
        borderRadius: "1rem",
        background: "rgba(15,23,42,0.95)",
        boxShadow: "0 24px 60px rgba(15,23,42,0.9)",
        maxWidth: "40rem",
        width: "100%"
      }}
    >
      <h1
        style={{
          fontSize: "2rem",
          fontWeight: 700,
          marginBottom: "0.75rem"
        }}
      >
        Agentic Relief Network
      </h1>
      <p
        style={{
          marginBottom: "1.25rem",
          lineHeight: 1.6,
          color: "#9ca3af"
        }}
      >
        Coordinate operational relief, resources, and alliances through a shared
        identity layer. This is the ARN application shell with an onboarding
        flow for registering organizations.
      </p>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
          fontSize: "0.9rem",
          color: "#9ca3af",
          marginBottom: "1.5rem"
        }}
      >
        <span>To get started:</span>
        <ul style={{ paddingLeft: "1.1rem", margin: 0 }}>
          <li>Connect using your social login.</li>
          <li>Confirm your contact details.</li>
          <li>Provide organization information and create an ARN identity.</li>
        </ul>
      </div>
      <Link
        href="/onboarding"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0.75rem 1.5rem",
          borderRadius: "9999px",
          background:
            "linear-gradient(135deg, #38bdf8, #6366f1 40%, #a855f7 80%)",
          color: "#0b1120",
          fontWeight: 600,
          fontSize: "0.95rem",
          textDecoration: "none",
          boxShadow: "0 14px 40px rgba(56,189,248,0.35)"
        }}
      >
        Register your organization
      </Link>
    </section>
  );
}


