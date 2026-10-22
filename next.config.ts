import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  env: {
    NEXT_PUBLIC_DIRECTUS_URL:
      process.env.NEXT_PUBLIC_DIRECTUS_URL ||
      process.env.DIRECTUS_URL ||
      "http://localhost:8055",
    NEXT_PUBLIC_APP_URL:
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.APP_URL ||
      "http://localhost:3000",
    NEXT_PUBLIC_ADMIN_EMAIL:
      process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
      process.env.ADMIN_EMAIL ||
      "admin@komdigi.go.id",
    NEXT_PUBLIC_ADMIN_PASSWORD:
      process.env.NEXT_PUBLIC_ADMIN_PASSWORD ||
      process.env.ADMIN_PASSWORD ||
      "admin2026",
    NEXT_PUBLIC_MANAGER_EMAIL:
      process.env.NEXT_PUBLIC_MANAGER_EMAIL ||
      process.env.MANAGER_EMAIL ||
      "manager@komdigi.go.id",
    NEXT_PUBLIC_MANAGER_PASSWORD:
      process.env.NEXT_PUBLIC_MANAGER_PASSWORD ||
      process.env.MANAGER_PASSWORD ||
      "manager123",
    NEXT_PUBLIC_USER_REGISTER:
      process.env.NEXT_PUBLIC_USER_REGISTER ||
      process.env.USER_REGISTER ||
      "true",
    NEXT_PUBLIC_USER_REGISTER_ROLE:
      process.env.NEXT_PUBLIC_USER_REGISTER_ROLE ||
      process.env.USER_REGISTER_ROLE ||
      "3be09e1a-a39b-4db4-a167-595088d61069",
    NEXT_PUBLIC_MAX_PAYLOAD_SIZE:
      process.env.NEXT_PUBLIC_MAX_PAYLOAD_SIZE ||
      process.env.MAX_PAYLOAD_SIZE ||
      "200mb",
    NEXT_PUBLIC_TURNSTILE_SITE_KEY:
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
      process.env.TURNSTILE_SITE_KEY ||
      "0x4AAAAAAFaTe1H-Ysb2wUIZ",
  },
};

export default nextConfig;
