import "server-only";

export interface ServerEnv {
  userRegister: boolean;
  directusUrl: string;
  appUrl: string;
  maxPayloadSize: string;
}

export function getServerEnv(): ServerEnv {
  return {
    userRegister: process.env.USER_REGISTER !== "false",
    directusUrl:
      process.env.DIRECTUS_URL ||
      process.env.NEXT_PUBLIC_DIRECTUS_URL ||
      "http://localhost:8055",
    appUrl:
      process.env.APP_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000",
    maxPayloadSize:
      process.env.MAX_PAYLOAD_SIZE ||
      process.env.NEXT_PUBLIC_MAX_PAYLOAD_SIZE ||
      "200mb",
  };
}
