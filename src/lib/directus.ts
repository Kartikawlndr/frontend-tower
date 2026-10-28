import "server-only";

import { getServerEnv } from "./server-env";

const directusUrl = () => getServerEnv().directusUrl.replace(/\/$/, "");

async function readError(response: Response, fallback: string) {
  const payload = await response.json().catch(() => null);
  return (
    payload?.errors?.[0]?.message ||
    payload?.error ||
    `${fallback} (HTTP ${response.status})`
  );
}

export async function checkDirectusHealth(): Promise<{
  ok: boolean;
  status: string;
}> {
  try {
    const response = await fetch(`${directusUrl()}/server/ping`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(3000),
      cache: "no-store",
    });
    return {
      ok: response.ok,
      status: response.ok ? "healthy" : `HTTP ${response.status}`,
    };
  } catch {
    return { ok: false, status: "offline" };
  }
}

export async function directusRegister(params: {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  verification_url: string;
}): Promise<{ success: boolean; message?: string; error?: string }> {
  const response = await fetch(`${directusUrl()}/users/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: params.email,
      password: params.password,
      first_name: params.first_name,
      last_name: params.last_name,
      verification_url: params.verification_url,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    return {
      success: false,
      error: await readError(response, "Registration failed"),
    };
  }

  return {
    success: true,
    message: "Registrasi berhasil! Tautan verifikasi telah dikirimkan ke email Anda.",
  };
}

export async function directusVerifyEmail(
  token: string,
): Promise<{ success: boolean; error?: string }> {
  const verificationUrl = new URL(
    "/users/register/verify-email",
    `${directusUrl()}/`,
  );
  verificationUrl.searchParams.set("token", token);
  const response = await fetch(verificationUrl, {
    method: "GET",
    redirect: "manual",
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });

  const location = response.headers.get("location");
  if (response.status >= 300 && response.status < 400 && location) {
    const redirectUrl = new URL(location, `${directusUrl()}/`);
    if (/^\/admin\/users\/[^/]+\/?$/.test(redirectUrl.pathname)) {
      return { success: true };
    }
  } else if (response.ok) {
    return { success: true };
  }

  if (!response.ok || !location) {
    return {
      success: false,
      error: await readError(response, "Invalid or expired token"),
    };
  }
  return { success: false, error: "Tautan verifikasi tidak valid atau kedaluwarsa." };
}
