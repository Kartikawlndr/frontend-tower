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
  mustChangePassword?: boolean;
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
    let checking = false;
    const checkSession = async () => {
      if (checking) return;
      checking = true;
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        if (response.status === 401) {
          if (mounted) {
            setActiveUser(ANONYMOUS_USER);
            setAuthenticated(false);
          }
        } else if (response.ok) {
          const session = (await response.json()) as { user?: AuthUser };
          if (mounted && session.user) {
            setActiveUser(session.user);
            setAuthenticated(true);
          }
        }
      } catch {
        // Keep the current session on transient network failures.
      } finally {
        if (mounted) setLoading(false);
        checking = false;
      }
    };

    void checkSession();
    const interval = window.setInterval(() => void checkSession(), 30_000);
    const checkWhenVisible = () => {
      if (document.visibilityState === "visible") void checkSession();
    };
    document.addEventListener("visibilitychange", checkWhenVisible);

    return () => {
      mounted = false;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", checkWhenVisible);
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
