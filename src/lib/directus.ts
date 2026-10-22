/**
 * Directus API Client Service
 * Connects the frontend to the Directus backend configured in .env.
 */

import { clientEnv } from "./env";

export interface DirectusAuthResponse {
  data: {
    access_token: string;
    expires: number;
    refresh_token: string;
  };
}

export interface DirectusUser {
  id: string;
  first_name: string;
  last_name?: string;
  email: string;
  role?: {
    id: string;
    name: string;
    admin_access?: boolean;
  } | string;
}

const DIRECTUS_URL = clientEnv.directusUrl.replace(/\/$/, "");

/**
 * Check if the Directus backend is reachable
 */
export async function checkDirectusHealth(): Promise<{
  ok: boolean;
  status: string;
  url: string;
}> {
  try {
    const res = await fetch(`${DIRECTUS_URL}/server/ping`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      return { ok: true, status: "healthy", url: DIRECTUS_URL };
    }
    return { ok: false, status: `HTTP ${res.status}`, url: DIRECTUS_URL };
  } catch (err: unknown) {
    const error = err as Error;
    return { ok: false, status: error.message || "offline", url: DIRECTUS_URL };
  }
}

/**
 * Log in to Directus
 */
export async function directusLogin(
  email: string,
  password: string
): Promise<{
  success: boolean;
  tokens?: DirectusAuthResponse["data"];
  user?: DirectusUser;
  error?: string;
}> {
  try {
    const res = await fetch(`${DIRECTUS_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const msg =
        errData?.errors?.[0]?.message ||
        `Login failed with status ${res.status}`;
      return { success: false, error: msg };
    }

    const data: DirectusAuthResponse = await res.json();
    const token = data.data.access_token;

    // Fetch user details
    const meRes = await fetch(
      `${DIRECTUS_URL}/users/me?fields=id,first_name,last_name,email,role.id,role.name,role.admin_access`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    let user: DirectusUser | undefined;
    if (meRes.ok) {
      const meData = await meRes.json();
      user = meData.data;
    }

    return { success: true, tokens: data.data, user };
  } catch (err: unknown) {
    const error = err as Error;
    return { success: false, error: error.message };
  }
}

/**
 * Register a new user in Directus
 */
export async function directusRegister(params: {
  email: string;
  password: string;
  first_name: string;
  role?: string;
}): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const role = params.role || clientEnv.userRegisterRole;
    const res = await fetch(`${DIRECTUS_URL}/users/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: params.email,
        password: params.password,
        first_name: params.first_name,
        role: role,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const msg =
        errData?.errors?.[0]?.message ||
        `Registration failed with status ${res.status}`;
      return { success: false, error: msg };
    }

    return {
      success: true,
      message:
        "Registrasi berhasil! Tautan verifikasi telah dikirimkan ke email Anda.",
    };
  } catch (err: unknown) {
    const error = err as Error;
    return { success: false, error: error.message };
  }
}

/**
 * Verify user registration token
 */
export async function directusVerifyEmail(token: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const res = await fetch(`${DIRECTUS_URL}/users/register/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return {
        success: false,
        error: errData?.errors?.[0]?.message || "Invalid or expired token",
      };
    }

    return { success: true };
  } catch (err: unknown) {
    const error = err as Error;
    return { success: false, error: error.message };
  }
}
