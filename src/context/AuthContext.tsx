"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type UserRole = "USER" | "MANAGER" | "ADMIN";
export type Role = "Normal User" | "Web Manager" | "Super Admin" | UserRole;

export interface AuthUser {
  id?: string;
  name: string;
  email: string;
  role: UserRole;
  roleLabel: "Normal User" | "Web Manager" | "Super Admin";
}

interface AuthContextValue {
  user: AuthUser;
  role: AuthUser["roleLabel"];
  authenticated: boolean;
  loading: boolean;
  setUser: (user: AuthUser) => void;
  logout: () => Promise<void>;
}

const ANONYMOUS_USER: AuthUser = {
  name: "",
  email: "",
  role: "USER",
  roleLabel: "Normal User",
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setActiveUser] = useState<AuthUser>(ANONYMOUS_USER);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetch("/api/auth/session", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as { user?: AuthUser };
      })
      .then((session) => {
        if (!mounted) return;
        if (session?.user) {
          setActiveUser(session.user);
          setAuthenticated(true);
        } else {
          setActiveUser(ANONYMOUS_USER);
          setAuthenticated(false);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setActiveUser(ANONYMOUS_USER);
        setAuthenticated(false);
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const setUser = (nextUser: AuthUser) => {
    setActiveUser(nextUser);
    setAuthenticated(true);
    setLoading(false);
  };

  const logout = async () => {
    const response = await fetch("/api/auth/logout", { method: "POST" });
    if (!response.ok) throw new Error("Keluar dari akun gagal.");
    setActiveUser(ANONYMOUS_USER);
    setAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{ user, role: user.roleLabel, authenticated, loading, setUser, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function ClientAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthProvider>{children}</AuthProvider>;
}
