"use client";

import * as React from "react";

export interface ConnectionUser {
  name: string;
  email: string;
}

interface ConnectionContextValue {
  user: ConnectionUser | null;
  setUser: (user: ConnectionUser | null) => void;
}

export const ConnectionContext = React.createContext<ConnectionContextValue | undefined>(
  undefined
);

export function ConnectionProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = React.useState<ConnectionUser | null>(null);

  const value = React.useMemo(
    () => ({
      user,
      setUser
    }),
    [user]
  );

  return (
    <ConnectionContext.Provider value={value}>
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnection() {
  const ctx = React.useContext(ConnectionContext);
  if (!ctx) {
    throw new Error("useConnection must be used within a ConnectionProvider");
  }
  return ctx;
}


