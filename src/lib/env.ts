/**
 * Centralized Environment Configuration
 * Provides type-safe access to both client-side and server-side configuration.
 */

export interface ClientEnv {
  directusUrl: string;
  appUrl: string;
  adminEmail: string;
  adminPasswordFallback: string;
  managerEmail: string;
  managerPasswordFallback: string;
  userRegisterEnabled: boolean;
  userRegisterRole: string;
  maxPayloadSize: string;
  turnstileSiteKey: string;
}

export interface DatabaseEnv {
  client: string;
  host: string;
  port: number;
  database: string;
  user: string;
  password?: string;
}

export interface EmailEnv {
  transport: string;
  host: string;
  port: number;
  user: string;
  from: string;
}

export interface ServerEnv {
  db: DatabaseEnv;
  email: EmailEnv;
  key: string;
  secret: string;
  adminEmail: string;
  adminPassword: string;
  managerEmail: string;
  managerPassword: string;
  userRegister: boolean;
  userRegisterRole: string;
  userRegisterAllowList: string;
  directusUrl: string;
  appUrl: string;
  maxPayloadSize: string;
}

/**
 * Public client-safe environment variables
 * Accessible in both Client and Server Components
 */
export const clientEnv: ClientEnv = {
  directusUrl:
    process.env.NEXT_PUBLIC_DIRECTUS_URL ||
    process.env.DIRECTUS_URL ||
    "http://localhost:8055",
  appUrl:
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "http://localhost:3000",
  adminEmail:
    process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
    process.env.ADMIN_EMAIL ||
    "admin@komdigi.go.id",
  adminPasswordFallback:
    process.env.NEXT_PUBLIC_ADMIN_PASSWORD ||
    process.env.ADMIN_PASSWORD ||
    "admin2026",
  managerEmail:
    process.env.NEXT_PUBLIC_MANAGER_EMAIL ||
    process.env.MANAGER_EMAIL ||
    "manager@komdigi.go.id",
  managerPasswordFallback:
    process.env.NEXT_PUBLIC_MANAGER_PASSWORD ||
    process.env.MANAGER_PASSWORD ||
    "manager123",
  userRegisterEnabled:
    (process.env.NEXT_PUBLIC_USER_REGISTER ??
      process.env.USER_REGISTER ??
      "true") !== "false",
  userRegisterRole:
    process.env.NEXT_PUBLIC_USER_REGISTER_ROLE ||
    process.env.USER_REGISTER_ROLE ||
    "3be09e1a-a39b-4db4-a167-595088d61069",
  maxPayloadSize:
    process.env.NEXT_PUBLIC_MAX_PAYLOAD_SIZE ||
    process.env.MAX_PAYLOAD_SIZE ||
    "200mb",
  turnstileSiteKey:
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
    process.env.TURNSTILE_SITE_KEY ||
    "0x4AAAAAAFaTe1H-Ysb2wUIZ",
};

/**
 * Server-only environment variables
 * Must only be called on server-side (Route Handlers, Server Actions, Server Components)
 */
export function getServerEnv(): ServerEnv {
  return {
    db: {
      client: process.env.DB_CLIENT || "pg",
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT) || 5432,
      database: process.env.DB_DATABASE || "directus",
      user: process.env.DB_USER || "directus",
      password: process.env.DB_PASSWORD || "KomdigiPassword2026!",
    },
    email: {
      transport: process.env.EMAIL_TRANSPORT || "smtp",
      host: process.env.EMAIL_SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.EMAIL_SMTP_PORT) || 587,
      user: process.env.EMAIL_SMTP_USER || "ssri57739@gmail.com",
      from: process.env.EMAIL_FROM || "ssri57739@gmail.com",
    },
    key: process.env.KEY || "a8f9d0c1-3e2b-4a5c-8d7e-9f0a1b2c3d4e",
    secret: process.env.SECRET || "9f0a1b2c-3d4e-5f6a-7b8c-9d0e1f2a3b4c",
    adminEmail: process.env.ADMIN_EMAIL || clientEnv.adminEmail,
    adminPassword: process.env.ADMIN_PASSWORD || clientEnv.adminPasswordFallback,
    managerEmail: process.env.MANAGER_EMAIL || clientEnv.managerEmail,
    managerPassword:
      process.env.MANAGER_PASSWORD || clientEnv.managerPasswordFallback,
    userRegister: process.env.USER_REGISTER !== "false",
    userRegisterRole:
      process.env.USER_REGISTER_ROLE || clientEnv.userRegisterRole,
    userRegisterAllowList:
      process.env.USER_REGISTER_URL_ALLOW_LIST ||
      "http://localhost:3000/api/verify-email",
    directusUrl: process.env.DIRECTUS_URL || clientEnv.directusUrl,
    appUrl: process.env.APP_URL || clientEnv.appUrl,
    maxPayloadSize: process.env.MAX_PAYLOAD_SIZE || clientEnv.maxPayloadSize,
  };
}

/**
 * Parse human readable byte sizes (e.g. "200mb", "10mb", "1gb") into bytes
 */
export function parsePayloadSize(sizeStr: string): number {
  const match = sizeStr.trim().toLowerCase().match(/^(\d+(?:\.\d+)?)\s*([a-z]+)?$/);
  if (!match) return 200 * 1024 * 1024; // default 200MB
  const num = parseFloat(match[1]);
  const unit = match[2] || "mb";
  switch (unit) {
    case "b":
      return num;
    case "kb":
    case "k":
      return num * 1024;
    case "mb":
    case "m":
      return num * 1024 * 1024;
    case "gb":
    case "g":
      return num * 1024 * 1024 * 1024;
    default:
      return num * 1024 * 1024;
  }
}
