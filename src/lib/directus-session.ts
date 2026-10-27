import "server-only";

import { cookies } from "next/headers";
import { getServerEnv } from "./server-env";

const ACCESS_COOKIE = "portal_access_token";
const REFRESH_COOKIE = "portal_refresh_token";
const REFRESH_COOKIE_MAX_AGE = 30 * 24 * 60 * 60;

interface DirectusTokens {
  access_token: string;
  expires: number;
  refresh_token: string;
}

const directusUrl = () => getServerEnv().directusUrl.replace(/\/$/, "");

async function setCookie(name: string, value: string, maxAge: number) {
  const cookieStore = await cookies();
  cookieStore.set(name, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

export async function setDirectusTokens(tokens: DirectusTokens) {
  await setCookie(
    ACCESS_COOKIE,
    tokens.access_token,
    Math.max(1, Math.floor(tokens.expires / 1000)),
  );
  await setCookie(REFRESH_COOKIE, tokens.refresh_token, REFRESH_COOKIE_MAX_AGE);
}

export async function clearDirectusTokens() {
  const cookieStore = await cookies();
  cookieStore.set(ACCESS_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  cookieStore.set(REFRESH_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

async function refreshAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) return null;

  const response = await fetch(`${directusUrl()}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken, mode: "json" }),
    cache: "no-store",
  });
  if (!response.ok) {
    await clearDirectusTokens();
    return null;
  }

  const payload = (await response.json()) as { data?: DirectusTokens };
  if (
    !payload.data?.access_token ||
    !payload.data.refresh_token ||
    !Number.isFinite(payload.data.expires)
  ) {
    await clearDirectusTokens();
    return null;
  }

  await setDirectusTokens(payload.data);
  return payload.data.access_token;
}

function withAuthorization(init: RequestInit, token: string): RequestInit {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  return { ...init, headers, cache: "no-store" };
}

export async function directusFetch(
  path: string,
  init: RequestInit = {},
  tokenOverride?: string,
): Promise<Response> {
  const url = `${directusUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  if (tokenOverride) {
    return fetch(url, withAuthorization(init, tokenOverride));
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
  if (!accessToken) return new Response(null, { status: 401 });

  const response = await fetch(
    url,
    withAuthorization(init, accessToken),
  );
  if (response.status !== 401) return response;

  const refreshedToken = await refreshAccessToken();
  if (!refreshedToken) return response;
  return fetch(url, withAuthorization(init, refreshedToken));
}
