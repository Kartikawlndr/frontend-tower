"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type UserRole = "USER" | "MANAGER" | "ADMIN";
export type Role = "Normal User" | "Web Manager" | "Super Admin" | UserRole;

export interface AuthUser {
  name: string;
  email: string;
  role: UserRole;
  roleLabel: "Normal User" | "Web Manager" | "Super Admin";
}

const ROLE_MAP: Record<UserRole, AuthUser> = {
  USER: {
    name: "Demo Normal User",
    email: "user@komdigi.go.id",
    role: "USER",
    roleLabel: "Normal User",
  },
  MANAGER: {
    name: "Demo Web Manager",
    email: "manager@komdigi.go.id",
    role: "MANAGER",
    roleLabel: "Web Manager",
  },
  ADMIN: {
    name: "Demo Super Admin",
    email: "admin@komdigi.go.id",
    role: "ADMIN",
    roleLabel: "Super Admin",
  },
};

function normalizeRole(input: Role): UserRole {
  if (input === "Super Admin" || input === "ADMIN") return "ADMIN";
  if (input === "Web Manager" || input === "MANAGER") return "MANAGER";
  return "USER";
}

interface AuthContextValue {
  user: AuthUser;
  role: AuthUser["roleLabel"];
  setRole: (role: Role) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentRole, setCurrentRole] = useState<UserRole>("USER");

  useEffect(() => {
    const saved = localStorage.getItem("user_role");
    if (saved) {
      setCurrentRole(normalizeRole(saved as Role));
    }
  }, []);

  const setRole = (newRole: Role) => {
    const normalized = normalizeRole(newRole);
    setCurrentRole(normalized);
    localStorage.setItem("user_role", normalized);
  };

  const user = ROLE_MAP[currentRole];

  return (
    <AuthContext.Provider value={{ user, role: user.roleLabel, setRole }}>
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

export function ClientAuthProvider({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
