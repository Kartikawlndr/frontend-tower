export interface ClientEnv {
  directusUrl: string;
  appUrl: string;
  userRegisterEnabled: boolean;
  maxPayloadSize: string;
  turnstileSiteKey: string;
}

export const clientEnv: ClientEnv = {
  directusUrl:
    process.env.NEXT_PUBLIC_DIRECTUS_URL ||
    process.env.DIRECTUS_URL ||
    "http://localhost:8055",
  appUrl:
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "http://localhost:3000",
  userRegisterEnabled:
    (process.env.NEXT_PUBLIC_USER_REGISTER ??
      process.env.USER_REGISTER ??
      "true") !== "false",
  maxPayloadSize:
    process.env.NEXT_PUBLIC_MAX_PAYLOAD_SIZE ||
    process.env.MAX_PAYLOAD_SIZE ||
    "200mb",
  turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "",
};

export function parsePayloadSize(sizeStr: string): number {
  const match = sizeStr.trim().toLowerCase().match(/^(\d+(?:\.\d+)?)\s*([a-z]+)?$/);
  if (!match) return 200 * 1024 * 1024;
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
