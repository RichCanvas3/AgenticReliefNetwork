"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Container,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography
} from "@mui/material";

import { useConnection } from "../../components/connection-context";
import { useWeb3Auth } from "../../components/web3auth-provider";

import {
  createAgentWithWalletForAA,
  getCounterfactualAAAddressByAgentName
} from "@agentic-trust/core/client";
import { sepolia } from "viem/chains";

type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

type OrgType = "operationalRelief" | "resource" | "alliance";

interface OrgDetails {
  name: string;
  address: string;
  type: OrgType | "";
}

type StepId = 1 | 2 | 3 | 4 | 5;

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

  const [step, setStep] = React.useState<StepId>(1);
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
      const socialProvider = web3auth?.provider as Eip1193Provider | undefined;
      if (socialProvider) {
        try {
          const socialResult = await socialProvider.request({
            method: "eth_accounts"
          });
          const accounts = socialResult as string[] | undefined;
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
  }, [logout, setUser]);

  const handleCreateArn = React.useCallback(async () => {
    if (!emailDomain) {
      setError(
        "We could not determine your email domain. Please disconnect and reconnect, then try again."
      );
      return;
    }

    if (!web3auth || !web3auth.provider) {
      setError(
        "Wallet provider is not available. Please complete the social login step first."
      );
      return;
    }

    setIsCreatingArn(true);
    setError(null);

    try {
      // Resolve an EIP-1193 provider (Web3Auth first, then window.ethereum as fallback).
      const eip1193Provider: Eip1193Provider | null =
        (web3auth.provider as Eip1193Provider | undefined) ??
        (typeof window !== "undefined" ? window.ethereum ?? null : null);

      if (!eip1193Provider) {
        setError(
          "No EIP-1193 provider available. Please ensure your wallet is connected."
        );
        return;
      }

      // Resolve connected account (EOA) from provider
      const accountsResult = await eip1193Provider.request({
        method: "eth_accounts"
      });
      const accounts = accountsResult as string[] | undefined;
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
          ethereumProvider: eip1193Provider,
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

      const createResult = await createAgentWithWalletForAA({
        agentData: {
          agentName,
          agentAccount: agentAccountAddress as `0x${string}`,
          description: "arn account",
          image: "https://www.google.com",
          agentUrl: "https://www.google.com"
        },
        account: account as `0x${string}`,
        ethereumProvider: eip1193Provider,
        useAA: true,
        ensOptions: {
          enabled: true,
          orgName: ensOrgName
        },
        chainId: sepolia.id
      });

      console.info("......... result ......... ", createResult);
      // TODO: After successfully creating the agent AA, create a trust relationship
      // attestation between the individual's AA and the agent AA.

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
  }, [emailDomain, web3auth]);

  const goToAppEnvironment = () => {
    router.push("/app");
  };

  return (
    <Container
      maxWidth="md"
      sx={{
        py: 6
      }}
    >
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Organization onboarding
        </Typography>
        <Typography variant="body1" color="text.secondary" maxWidth="40rem">
          Follow these steps to register your organization, create an ARN
          identity, and continue into the application environment.
        </Typography>
      </Box>

      <Box mb={3}>
        <Stepper activeStep={step - 1} alternativeLabel>
          {["Connect", "Your details", "Organization", "ARN identity", "Review"].map(
            (label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            )
          )}
        </Stepper>
      </Box>

      {error && (
        <Box mb={3}>
          <Alert severity="error">{error}</Alert>
        </Box>
      )}

      {step === 1 && (
        <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            1. Connect using your social login
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            We use Web3Auth to let you sign in with familiar social providers,
            while also preparing a wallet that can be used for ARN operations.
          </Typography>

          {isInitializing && (
            <Typography variant="body2">Initializing Web3Auth, please wait…</Typography>
          )}

          {!isInitializing && !error && (
            <Button
              variant="contained"
              color="primary"
              onClick={handleConnectSocial}
              disabled={!web3auth || isConnecting}
            >
              {isConnecting ? "Connecting…" : "Connect with social login"}
            </Button>
          )}
        </Paper>
      )}

      {step === 2 && (
        <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            2. Your details
          </Typography>

          {user && (
            <Box mb={2}>
              <Typography variant="body2">
                Email: <strong>{user.email}</strong>
              </Typography>
              {walletAddress && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mt: 0.5, fontFamily: "monospace" }}
                >
                  EOA: {walletAddress}
                </Typography>
              )}
              {aaAddress && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mt: 0.25, fontFamily: "monospace" }}
                >
                  AA account: {aaAddress}
                </Typography>
              )}
            </Box>
          )}

          <Stack spacing={2}>
            <TextField
              label="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              fullWidth
              size="small"
            />
            <TextField
              label="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              fullWidth
              size="small"
            />
          </Stack>

          <Box mt={3} display="flex" justifyContent="space-between">
            <Button variant="outlined" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setStep(3)}
            >
              Continue
            </Button>
          </Box>
        </Paper>
      )}

      {step === 4 && (
        <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            3. Organization details
          </Typography>
          {user && (
            <Box mb={2}>
              <Typography variant="body2">
                Signed in as{" "}
                <strong>
                  {user.name} ({user.email})
                </strong>
                .
              </Typography>
              {walletAddress && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mt: 0.5, fontFamily: "monospace" }}
                >
                  Wallet: {walletAddress.slice(0, 6)}...
                  {walletAddress.slice(-4)}
                </Typography>
              )}
            </Box>
          )}

          <Stack spacing={2}>
            <Box>
              <TextField
                label="Organization name"
                value={org.name}
                onChange={(e) => handleOrgChange("name", e.target.value)}
                fullWidth
                size="small"
              />
              {emailDomain && (
                <FormHelperText>
                  Email domain from your login: <strong>{emailDomain}</strong>. This
                  domain should be associated with this organization.
                </FormHelperText>
              )}
            </Box>

            <TextField
              label="Organization address"
              value={org.address}
              onChange={(e) => handleOrgChange("address", e.target.value)}
              fullWidth
              size="small"
            />

            <FormControl fullWidth size="small">
              <InputLabel id="org-type-label">Organization type</InputLabel>
              <Select
                labelId="org-type-label"
                label="Organization type"
                value={org.type}
                onChange={(e) =>
                  handleOrgChange("type", e.target.value as OrgType | "")
                }
              >
                <MenuItem value="">
                  <em>Select a type…</em>
                </MenuItem>
                <MenuItem value="operationalRelief">
                  Operational Relief Organization
                </MenuItem>
                <MenuItem value="resource">Resource Organization</MenuItem>
                <MenuItem value="alliance">Alliance Organization</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          <Box mt={3} display="flex" justifyContent="space-between">
            <Button variant="outlined" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleOrgNext}
              disabled={isCheckingAvailability}
            >
              {isCheckingAvailability
                ? "Checking availability…"
                : "Continue"}
            </Button>
          </Box>

          {emailDomain && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mt: 2 }}
            >
              If this domain is not associated with the organization name, you can
              disconnect and choose a different account.{" "}
              <Button
                variant="text"
                size="small"
                onClick={handleDisconnectAndReset}
              >
                Disconnect and use another account
              </Button>
            </Typography>
          )}
        </Paper>
      )}

      {step === 3 && (
        <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            4. Create ARN identity
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            We will create an ARN identity for this organization. There is no
            manual review step; anyone can create an ARN identity.
          </Typography>

          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            <li>
              <Typography variant="body2">
                <strong>Name:</strong> {org.name}
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                <strong>Address:</strong> {org.address}
              </Typography>
            </li>
            {emailDomain && (
              <li>
                <Typography variant="body2">
                  <strong>Login email domain:</strong> {emailDomain}
                </Typography>
              </li>
            )}
            <li>
              <Typography variant="body2">
                <strong>Type:</strong>{" "}
                {org.type === "operationalRelief"
                  ? "Operational Relief Organization"
                  : org.type === "resource"
                    ? "Resource Organization"
                    : "Alliance Organization"}
              </Typography>
            </li>
          </Box>

          <Typography variant="body2" mb={3}>
            Is it okay to create an ARN identity for this organization now?
          </Typography>

          <Stack direction="row" spacing={2}>
            <Button variant="outlined" onClick={() => setStep(3)}>
              Go back
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={handleCreateArn}
              disabled={isCreatingArn}
            >
              {isCreatingArn
                ? "Creating ARN identity…"
                : "Yes, create ARN identity"}
            </Button>
          </Stack>

          {emailDomain && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mt: 2 }}
            >
              If this email domain is not associated with the organization, you
              can{" "}
              <Button
                variant="text"
                size="small"
                onClick={handleDisconnectAndReset}
              >
                disconnect and sign in with a different account
              </Button>{" "}
              before creating the ARN identity.
            </Typography>
          )}
        </Paper>
      )}

      {step === 5 && arn && (
        <Paper
          elevation={1}
          sx={{
            p: 3,
            mb: 3,
            borderColor: "success.light"
          }}
        >
          <Typography variant="h6" gutterBottom>
            5. Your ARN identity
          </Typography>

          <Typography variant="body2" mb={2}>
            The ARN identity for{" "}
            <strong>{org.name || "your organization"}</strong> has been created.
          </Typography>

          <Box
            sx={{
              p: 1.5,
              borderRadius: 1,
              bgcolor: "background.paper",
              border: "1px dashed",
              borderColor: "success.light",
              fontFamily: "monospace"
            }}
          >
            {arn}
          </Box>

          <Typography variant="body2" mt={3} mb={3}>
            Next, you&apos;ll move into the application environment where we manage
            operations, resources, and alliances using this ARN.
          </Typography>

          <Button
            variant="contained"
            color="primary"
            onClick={goToAppEnvironment}
          >
            Go to application environment
          </Button>
        </Paper>
      )}
    </Container>
  );
}


