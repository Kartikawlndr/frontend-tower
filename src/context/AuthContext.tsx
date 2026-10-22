"use client";

import React, { createContext, useContext, useState } from "react";
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    if (typeof window !== "undefined") {
      const savedRole = localStorage.getItem("user_role");
      if (savedRole) {
        return normalizeRole(savedRole as Role);
      }
    }
    return "USER";
  });

  const [customUser, setCustomUser] = useState<AuthUser | null>(() => {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("auth_user");
      if (savedUser) {
        try {
          return JSON.parse(savedUser);
        } catch {
          // ignore parse errors
        }
      }
    }
    return null;
  });

  const setRole = (newRole: Role) => {
    const normalized = normalizeRole(newRole);
    setCurrentRole(normalized);
    localStorage.setItem("user_role", normalized);
    const defaultUser = getRoleMap()[normalized];
    setCustomUser(defaultUser);
    localStorage.setItem("auth_user", JSON.stringify(defaultUser));
  };

  const setUser = (user: AuthUser) => {
    setCustomUser(user);
    setCurrentRole(user.role);
    localStorage.setItem("user_role", user.role);
    localStorage.setItem("auth_user", JSON.stringify(user));
  };

  const logout = () => {
    const defaultUser = getRoleMap().USER;
    setCurrentRole("USER");
    setCustomUser(defaultUser);
    localStorage.removeItem("user_role");
    localStorage.removeItem("auth_user");
  };

  const fallbackUser = getRoleMap()[currentRole];
  const activeUser = customUser && customUser.role === currentRole ? customUser : fallbackUser;

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
