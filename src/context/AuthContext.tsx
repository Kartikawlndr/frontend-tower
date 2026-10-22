"use client";

import React, {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import { clientEnv } from "@/lib/env";

export type UserRole = "USER" | "MANAGER" | "ADMIN";
export type Role = "Normal User" | "Web Manager" | "Super Admin" | UserRole;

export interface AuthUser {
  id?: string;
  name: string;
  email: string;
  role: UserRole;
  roleLabel: "Normal User" | "Web Manager" | "Super Admin";
  token?: string;
}

const getRoleMap = (): Record<UserRole, AuthUser> => ({
  USER: {
    name: "Demo Normal User",
    email: "user@komdigi.go.id",
    role: "USER",
    roleLabel: "Normal User",
  },
  MANAGER: {
    name: "Demo Web Manager",
    email: clientEnv.managerEmail,
    role: "MANAGER",
    roleLabel: "Web Manager",
  },
  ADMIN: {
    name: "Demo Super Admin",
    email: clientEnv.adminEmail,
    role: "ADMIN",
    roleLabel: "Super Admin",
  },
});

function normalizeRole(input: Role): UserRole {
  if (input === "Super Admin" || input === "ADMIN") return "ADMIN";
  if (input === "Web Manager" || input === "MANAGER") return "MANAGER";
  return "USER";
}

interface AuthContextValue {
  user: AuthUser;
  role: AuthUser["roleLabel"];
  setRole: (role: Role) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const AUTH_STORAGE_EVENT = "auth-storage-change";

function subscribeAuth(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener(AUTH_STORAGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(AUTH_STORAGE_EVENT, callback);
  };
}

function getStoredRoleSnapshot(): UserRole {
  if (typeof window === "undefined") return "USER";
  const saved = localStorage.getItem("user_role");
  return saved ? normalizeRole(saved as Role) : "USER";
}

function getServerStoredRoleSnapshot(): UserRole {
  return "USER";
}

function getStoredUserSnapshot(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("auth_user") || "";
}

function getServerStoredUserSnapshot(): string {
  return "";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const currentRole = useSyncExternalStore(
    subscribeAuth,
    getStoredRoleSnapshot,
    getServerStoredRoleSnapshot
  );

  const customUserJson = useSyncExternalStore(
    subscribeAuth,
    getStoredUserSnapshot,
    getServerStoredUserSnapshot
  );

  const customUser: AuthUser | null = useMemo(() => {
    if (!customUserJson) return null;
    try {
      return JSON.parse(customUserJson);
    } catch {
      return null;
    }
  }, [customUserJson]);

  const setRole = (newRole: Role) => {
    const normalized = normalizeRole(newRole);
    localStorage.setItem("user_role", normalized);
    const defaultUser = getRoleMap()[normalized];
    localStorage.setItem("auth_user", JSON.stringify(defaultUser));
    window.dispatchEvent(new Event(AUTH_STORAGE_EVENT));
  };

  const setUser = (user: AuthUser) => {
    localStorage.setItem("user_role", user.role);
    localStorage.setItem("auth_user", JSON.stringify(user));
    window.dispatchEvent(new Event(AUTH_STORAGE_EVENT));
  };

  const logout = () => {
    localStorage.removeItem("user_role");
    localStorage.removeItem("auth_user");
    window.dispatchEvent(new Event(AUTH_STORAGE_EVENT));
  };

  const fallbackUser = getRoleMap()[currentRole];
  const activeUser =
    customUser && customUser.role === currentRole ? customUser : fallbackUser;

  return (
    <AuthContext.Provider
      value={{
        user: activeUser,
        role: activeUser.roleLabel,
        setRole,
        setUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

export function ClientAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthProvider>{children}</AuthProvider>;
}
