"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

type PortalRole = "Applicant" | "Web Manager" | "Administrator";
type PortalUser = {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  status: string;
  role_name: PortalRole;
  last_access?: string | null;
  must_change_password?: boolean;
};
type UserListResponse = {
  data?: PortalUser[];
  error?: string;
};

const ROLE_TEXT: Record<PortalRole, string> = {
  Applicant: "Pengguna",
  "Web Manager": "Manajer Web",
  Administrator: "Super Admin",
};

export default function UserManagement() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<PortalUser[]>([]);
  const [roleEdits, setRoleEdits] = useState<Record<string, PortalRole>>({});
  const [statusEdits, setStatusEdits] = useState<Record<string, "active" | "suspended">>({});
  const [search, setSearch] = useState("");
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<PortalRole>("Applicant");
  const [passwordUser, setPasswordUser] = useState<PortalUser | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [confirmTemporaryPassword, setConfirmTemporaryPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    const response = await fetch("/api/users?limit=100", { cache: "no-store" });
    const payload = (await response.json().catch(() => null)) as UserListResponse | null;
    if (!response.ok) {
      throw new Error(payload?.error || "Daftar akun tidak dapat dimuat.");
    }
    setUsers(payload?.data ?? []);
    setRoleEdits({});
    setStatusEdits({});
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/users?limit=100", { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as UserListResponse | null;
        if (!response.ok) throw new Error(payload?.error || "Daftar akun tidak dapat dimuat.");
        if (active) setUsers(payload?.data ?? []);
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError instanceof Error ? requestError.message : "Daftar akun tidak dapat dimuat.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const visibleUsers = useMemo(
    () =>
      users.filter((entry) =>
        `${entry.first_name ?? ""} ${entry.last_name ?? ""} ${entry.email}`
          .toLowerCase()
          .includes(search.trim().toLowerCase()),
      ),
    [search, users],
  );

  async function invite(event: React.FormEvent) {
    event.preventDefault();
    setWorking(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role: inviteRole }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;
      if (!response.ok) throw new Error(payload?.error || "Undangan akun gagal dikirim.");
      setMessage(payload?.message || "Undangan berhasil dikirim.");
      setEmail("");
      await refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Undangan akun gagal dikirim.");
    } finally {
      setWorking(false);
    }
  }

  async function saveUser(entry: PortalUser) {
    const role = roleEdits[entry.id] ?? entry.role_name;
    const status = statusEdits[entry.id];
    const changes: { role?: PortalRole; status?: "active" | "suspended" } = {};
    if (role !== entry.role_name) changes.role = role;
    if (status && status !== entry.status) changes.status = status;
    if (Object.keys(changes).length === 0) return;
    setWorking(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/users/${encodeURIComponent(entry.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error || "Perubahan akun gagal disimpan.");
      setMessage(`Perubahan untuk ${entry.email} berhasil disimpan.`);
      await refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Perubahan akun gagal disimpan.");
    } finally {
      setWorking(false);
    }
  }

  async function resetPassword(entry: PortalUser) {
    setWorking(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/users/${encodeURIComponent(entry.id)}/password-reset`, { method: "POST" });
      const payload = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;
      if (!response.ok) throw new Error(payload?.error || "Permintaan reset password gagal.");
      setMessage(payload?.message || `Tautan reset dikirim ke ${entry.email}.`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Permintaan reset password gagal.");
    } finally {
      setWorking(false);
    }
  }

  async function setTemporaryUserPassword(event: React.FormEvent) {
    event.preventDefault();
    if (!passwordUser) return;
    setError("");
    setPasswordError("");
    setMessage("");
    if (temporaryPassword.length < 12 || temporaryPassword.length > 128) {
      setPasswordError("Password sementara harus berisi 12 sampai 128 karakter.");
      return;
    }
    if (temporaryPassword !== confirmTemporaryPassword) {
      setPasswordError("Password dan konfirmasi password tidak sama.");
      return;
    }

    setWorking(true);
    try {
      const response = await fetch(
        `/api/users/${encodeURIComponent(passwordUser.id)}/password-set`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: temporaryPassword }),
        },
      );
      const payload = (await response.json().catch(() => null)) as
        | { error?: string; message?: string }
        | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Password sementara gagal diatur.");
      }
      setMessage(
        `${payload?.message || "Password sementara berhasil diatur."} Sampaikan password kepada pengguna melalui saluran yang aman.`,
      );
      setPasswordUser(null);
      setTemporaryPassword("");
      setConfirmTemporaryPassword("");
      await refresh();
    } catch (requestError) {
      setPasswordError(
        requestError instanceof Error
          ? requestError.message
          : "Password sementara gagal diatur.",
      );
    } finally {
      setWorking(false);
    }
  }

  if (user.role !== "ADMIN") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="max-w-md space-y-4 rounded-card border border-border-soft bg-surface p-10 text-center shadow-card">
          <h2 className="text-lg font-bold text-danger">403 - Akses Ditolak</h2>
          <p className="text-xs text-muted">Hanya Super Admin yang dapat mengelola akun dan peran.</p>
          <button onClick={() => router.push("/dashboard")} className="rounded-card bg-primary px-4 py-2 text-xs font-semibold text-on-primary">Kembali ke Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-page-title">Manajemen Pengguna</h1>
      {error && <div role="alert" className="rounded-card border border-danger bg-danger-bg px-4 py-3 text-sm text-danger">{error}</div>}
      {message && <div role="status" className="rounded-card border border-primary bg-nav-active-bg px-4 py-3 text-sm text-primary">{message}</div>}

      <section className="space-y-4 rounded-card border border-border-soft bg-surface p-6 shadow-card">
        <h2 className="text-sm font-bold text-heading">Undang Pengguna</h2>
        <form onSubmit={invite} className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
          <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email pengguna" className="h-[var(--height-input)] rounded-input border border-border bg-surface px-3 text-sm" />
          <select value={inviteRole} onChange={(event) => setInviteRole(event.target.value as PortalRole)} className="h-[var(--height-input)] rounded-input border border-border bg-surface px-3 text-sm">
            <option value="Applicant">Pengguna</option>
            <option value="Web Manager">Manajer Web</option>
            <option value="Administrator">Super Admin</option>
          </select>
          <button disabled={working} className="rounded-card bg-primary px-4 py-2 text-sm font-semibold text-on-primary disabled:opacity-50">Kirim Undangan</button>
        </form>
      </section>

      <section className="space-y-4 rounded-card border border-border-soft bg-surface p-6 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-heading">Daftar Pengguna</h2>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama atau email" className="h-9 rounded-input border border-border px-3 text-sm" />
        </div>
        <div className="overflow-x-auto rounded-input border border-border-soft">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border-soft bg-table-head-bg font-semibold text-heading">
              <tr><th className="p-3">Nama</th><th className="p-3">Email</th><th className="p-3">Peran</th><th className="p-3">Status</th><th className="p-3">Password</th><th className="p-3">Aksi</th></tr>
            </thead>
            <tbody className="divide-y divide-border-soft text-muted">
              {loading ? <tr><td colSpan={6} className="p-6 text-center">Memuat akun...</td></tr> : visibleUsers.length === 0 ? <tr><td colSpan={6} className="p-6 text-center">Tidak ada akun.</td></tr> : visibleUsers.map((entry) => {
                const isSelf = entry.id === user.id;
                return (
                  <tr key={entry.id}>
                    <td className="p-3 font-medium text-heading">{`${entry.first_name ?? ""} ${entry.last_name ?? ""}`.trim() || "—"}</td>
                    <td className="p-3">{entry.email}</td>
                    <td className="p-3"><select disabled={isSelf || working} value={roleEdits[entry.id] ?? entry.role_name} onChange={(event) => setRoleEdits({ ...roleEdits, [entry.id]: event.target.value as PortalRole })} className="rounded-input border border-border bg-surface px-2 py-1"><option value="Applicant">{ROLE_TEXT.Applicant}</option><option value="Web Manager">{ROLE_TEXT["Web Manager"]}</option><option value="Administrator">{ROLE_TEXT.Administrator}</option></select></td>
                    <td className="p-3"><select disabled={isSelf || working} value={statusEdits[entry.id] ?? entry.status} onChange={(event) => setStatusEdits({ ...statusEdits, [entry.id]: event.target.value as "active" | "suspended" })} className="rounded-input border border-border bg-surface px-2 py-1"><option value="active">Aktif</option><option value="suspended">Ditangguhkan</option>{!["active", "suspended"].includes(entry.status) && <option value={entry.status}>{entry.status}</option>}</select></td>
                    <td className="p-3">{entry.must_change_password ? "Wajib diganti saat login" : "Normal"}</td>
                    <td className="space-x-3 whitespace-nowrap p-3">
                      <button disabled={isSelf || working} onClick={() => saveUser(entry)} className="font-semibold text-primary hover:underline disabled:opacity-50">Simpan</button>
                      <button disabled={isSelf || entry.status !== "active" || working} onClick={() => { setError(""); setPasswordError(""); setPasswordUser(entry); }} className="font-semibold text-primary hover:underline disabled:opacity-50">Atur password</button>
                      <button disabled={isSelf || entry.status !== "active" || working} onClick={() => resetPassword(entry)} className="font-semibold text-primary hover:underline disabled:opacity-50">Kirim tautan email</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {passwordUser && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !working) {
              setPasswordUser(null);
              setTemporaryPassword("");
              setConfirmTemporaryPassword("");
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="temporary-password-title"
            className="w-full max-w-lg space-y-4 rounded-card bg-surface p-6 shadow-card"
          >
            <div>
              <h2 id="temporary-password-title" className="text-lg font-bold text-heading">
                Atur password sementara
              </h2>
              <p className="mt-1 text-sm text-muted">
                Untuk {passwordUser.email}. Tidak ada email yang dikirim; pengguna wajib mengganti password ini saat login.
              </p>
            </div>
            <form onSubmit={setTemporaryUserPassword} className="space-y-4">
              {passwordError && (
                <p role="alert" className="text-sm text-danger">{passwordError}</p>
              )}
              <label className="flex flex-col gap-2 text-sm font-medium text-heading">
                Password sementara
                <input
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  maxLength={128}
                  required
                  value={temporaryPassword}
                  onChange={(event) => setTemporaryPassword(event.target.value)}
                  className="h-10 rounded-input border border-border px-3"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-heading">
                Konfirmasi password sementara
                <input
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  maxLength={128}
                  required
                  value={confirmTemporaryPassword}
                  onChange={(event) => setConfirmTemporaryPassword(event.target.value)}
                  className="h-10 rounded-input border border-border px-3"
                />
              </label>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  disabled={working}
                  onClick={() => {
                    setPasswordUser(null);
                    setTemporaryPassword("");
                    setConfirmTemporaryPassword("");
                  }}
                  className="rounded-card border border-border px-4 py-2 text-sm font-semibold text-heading disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={working}
                  className="rounded-card bg-primary px-4 py-2 text-sm font-semibold text-on-primary disabled:opacity-50"
                >
                  {working ? "Menyimpan..." : "Atur password"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
