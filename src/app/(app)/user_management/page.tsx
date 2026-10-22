"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { clientEnv } from "@/lib/env";

const ROLE_DISPLAY: Record<string, string> = {
  "Normal User": "Pengguna Standar",
  "Web Manager": "Manajer Web",
  "Super Admin": "Super Admin",
  USER: "Pengguna Standar",
  MANAGER: "Manajer Web",
  ADMIN: "Super Admin",
};

export default function UserManagement() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentView, setCurrentView] = useState<"list" | "create" | "edit">(
    "list"
  );

  // Only Super Admin can access this page
  if (user.role !== "ADMIN") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="bg-surface p-10 rounded-card border border-border-soft shadow-card text-center space-y-4 max-w-md w-full">
          <div className="w-12 h-12 bg-danger-bg text-danger rounded-full flex items-center justify-center mx-auto text-xl font-bold">
            🔒
          </div>
          <h2 className="text-lg font-bold text-danger">
            403 - Akses Ditolak
          </h2>
          <p className="text-xs text-muted">
            Peran Anda ({ROLE_DISPLAY[user.roleLabel] || user.roleLabel}) tidak dapat mengakses: Manajemen Pengguna, Pembuatan akun pengguna, Pengaturan peran
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-primary text-on-primary rounded-card text-xs font-semibold hover:bg-primary-hover transition-colors shadow-card"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* VIEW 1: USER MANAGEMENT LIST */}
      {currentView === "list" && (
        <>
          <h1 className="text-page-title">Manajemen Pengguna</h1>

          <section className="bg-surface p-6 rounded-card border border-border-soft shadow-card space-y-4">
            <h2 className="text-sm font-bold text-heading">Daftar Pengguna</h2>

            {/* Filter & Search Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-1">
                <label className="text-field-label">Cari</label>
                <input
                  type="text"
                  placeholder="Nama atau email"
                  className="w-full h-[var(--height-input)] px-3 text-xs border border-border rounded-input bg-surface focus:outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-field-label">Peran</label>
                <select className="w-full h-[var(--height-input)] px-3 text-xs border border-border rounded-input bg-surface focus:outline-none focus:border-primary">
                  <option>Semua peran</option>
                  <option>Pengguna Standar</option>
                  <option>Manajer Web</option>
                  <option>Super Admin</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-field-label">Status</label>
                <select className="w-full h-[var(--height-input)] px-3 text-xs border border-border rounded-input bg-surface focus:outline-none focus:border-primary">
                  <option>Semua</option>
                  <option>Aktif</option>
                  <option>Tidak Aktif</option>
                </select>
              </div>
              <div>
                <button
                  onClick={() => setCurrentView("create")}
                  className="w-full h-[var(--height-button)] px-4 bg-primary text-on-primary rounded-card text-xs font-semibold hover:bg-primary-hover transition-colors shadow-card flex items-center justify-center gap-2"
                >
                  <span>+ Tambah Pengguna</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-border-soft rounded-input">
              <table className="w-full text-left text-xs">
                <thead className="bg-table-head-bg border-b border-border-soft text-heading font-semibold">
                  <tr>
                    <th className="p-3.5">Nama</th>
                    <th className="p-3.5">Email</th>
                    <th className="p-3.5">Peran</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Dibuat Pada</th>
                    <th className="p-3.5 text-right pr-25">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-soft text-muted">
                  {[
                    {
                      name: "Super Administrator",
                      email: clientEnv.adminEmail,
                      role: "Super Admin",
                      status: "Aktif",
                      created: "2026-01-01",
                    },
                    {
                      name: "Manajer Web",
                      email: clientEnv.managerEmail,
                      role: "Manajer Web",
                      status: "Aktif",
                      created: "2026-01-02",
                    },
                    {
                      name: "PT Tower Bersama",
                      email: "operator@towerbersama.com",
                      role: "Pengguna Standar",
                      status: "Aktif",
                      created: "2026-02-15",
                    },
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-canvas">
                      <td className="p-3.5 font-medium text-heading">{row.name}</td>
                      <td className="p-3.5">{row.email}</td>
                      <td className="p-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-semibold bg-sky-100 text-[#0070ba]">
                          {row.role}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-semibold bg-emerald-100 text-emerald-800">
                          {row.status}
                        </span>
                      </td>
                      <td className="p-3.5">{row.created}</td>
                      <td className="p-3.5 text-right space-x-1 pr-27 font-medium">
                        <button
                          onClick={() => setCurrentView("edit")}
                          className="text-primary hover:underline"
                        >
                          Ubah
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="flex items-center justify-between pt-2 text-xs text-muted">
              <span>Menampilkan 1-3 dari 3</span>
              <div className="flex items-center gap-2">
                <span>Baris per halaman</span>
                <select className="border border-border rounded-input px-2 py-1 bg-surface">
                  <option>10</option>
                </select>
                <button className="px-2 py-1 border rounded-input bg-surface text-border">
                  ‹
                </button>
                <button className="px-3 py-1 border rounded-input bg-primary text-on-primary">
                  1
                </button>
                <button className="px-2.5 py-1 border rounded-input bg-surface">
                  2
                </button>
                <button className="px-2.5 py-1 border rounded-input bg-surface">
                  3
                </button>
                <button className="px-2.5 py-1 border rounded-input bg-surface">
                  ›
                </button>
              </div>
            </div>
          </section>
        </>
      )}

      {/* VIEW 2: CREATE USER */}
      {currentView === "create" && (
        <>
          <h1 className="text-page-title">Manajemen Pengguna / Tambah Pengguna</h1>

          <div className="bg-surface p-6 rounded-card border border-border-soft shadow-card space-y-6">
            <div className="border border-border-soft rounded-card p-5 space-y-4">
              <h3 className="text-xs font-bold text-heading uppercase tracking-wider">
                Rincian Akun
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-field-label">Nama lengkap *</label>
                  <input
                    type="text"
                    placeholder="Masukkan nama lengkap"
                    className="w-full h-[var(--height-input)] px-3 text-xs border border-border rounded-input bg-surface focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-field-label">Email *</label>
                  <input
                    type="email"
                    placeholder="Masukkan email"
                    className="w-full h-[var(--height-input)] px-3 text-xs border border-border rounded-input bg-surface focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-field-label">Kata sandi awal *</label>
                  <input
                    type="password"
                    placeholder="Masukkan kata sandi"
                    className="w-full h-[var(--height-input)] px-3 text-xs border border-border rounded-input bg-surface focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-field-label">
                    Konfirmasi kata sandi *
                  </label>
                  <input
                    type="password"
                    placeholder="Ulangi kata sandi"
                    className="w-full h-[var(--height-input)] px-3 text-xs border border-border rounded-input bg-surface focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>

            {/* Role Selection */}
            <div className="border border-border-soft rounded-card p-5 space-y-3">
              <h3 className="text-xs font-bold text-heading uppercase tracking-wider">
                Peran
              </h3>
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    defaultChecked
                    className="mt-0.5 accent-primary"
                  />
                  <div>
                    <p className="text-xs font-bold text-heading">Pengguna Standar</p>
                    <p className="text-2xs text-muted">
                      Unggah dan lihat pengajuan serta data sendiri
                    </p>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    className="mt-0.5 accent-primary"
                  />
                  <div>
                    <p className="text-xs font-bold text-heading">
                      Manajer Web
                    </p>
                    <p className="text-2xs text-muted">
                      Lihat semua pengajuan, data, dan log audit
                    </p>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    className="mt-0.5 accent-primary"
                  />
                  <div>
                    <p className="text-xs font-bold text-heading">
                      Super Admin
                    </p>
                    <p className="text-2xs text-muted">
                      Akses penuh termasuk manajemen akun pengguna
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Account Active Toggle */}
            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 accent-primary rounded"
              />
              <span className="text-xs font-semibold text-heading">
                Akun aktif
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-soft">
              <button
                onClick={() => setCurrentView("list")}
                className="px-4 h-[var(--height-button)] border border-border text-heading rounded-card text-xs font-semibold hover:bg-canvas transition-colors"
              >
                ✕ Batal
              </button>
              <button
                onClick={() => setCurrentView("list")}
                className="px-4 h-[var(--height-button)] bg-primary text-on-primary rounded-card text-xs font-semibold hover:bg-primary-hover transition-colors shadow-card"
              >
                + Tambah Pengguna
              </button>
            </div>
          </div>
        </>
      )}

      {/* VIEW 3: EDIT USER */}
      {currentView === "edit" && (
        <>
          <h1 className="text-page-title">Ubah Pengguna</h1>

          <div className="bg-surface p-6 rounded-card border border-border-soft shadow-card space-y-6">
            <div className="border border-border-soft rounded-card p-5 space-y-4">
              <h3 className="text-xs font-bold text-heading uppercase tracking-wider">
                Informasi Pengguna
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-field-label">Nama lengkap</label>
                  <input
                    type="text"
                    defaultValue="Nama Pengguna"
                    className="w-full h-[var(--height-input)] px-3 text-xs border border-border rounded-input bg-input-fill"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-field-label">Email</label>
                  <input
                    type="email"
                    defaultValue="user@email.com"
                    className="w-full h-[var(--height-input)] px-3 text-xs border border-border rounded-input bg-input-fill"
                  />
                </div>
              </div>
            </div>

            {/* Role Account Type */}
            <div className="border border-border-soft rounded-card p-5 space-y-2">
              <h3 className="text-xs font-bold text-heading uppercase tracking-wider">
                Peran
              </h3>
              <label className="text-field-label">Tipe akun</label>
              <select className="w-full h-[var(--height-input)] px-3 text-xs border border-border rounded-input bg-surface focus:outline-none focus:border-primary">
                <option>Pengguna Standar</option>
                <option>Manajer Web</option>
                <option>Super Admin</option>
              </select>
            </div>

            {/* Reset Password Section */}
            <div className="border border-border-soft rounded-card p-5 space-y-4">
              <h3 className="text-xs font-bold text-heading uppercase tracking-wider">
                Atur Ulang Kata Sandi
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-field-label">Kata sandi baru</label>
                  <input
                    type="password"
                    placeholder="Masukkan kata sandi baru"
                    className="w-full h-[var(--height-input)] px-3 text-xs border border-border rounded-input bg-surface focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-field-label">
                    Konfirmasi kata sandi baru
                  </label>
                  <input
                    type="password"
                    placeholder="Ulangi kata sandi baru"
                    className="w-full h-[var(--height-input)] px-3 text-xs border border-border rounded-input bg-surface focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button className="px-4 h-[var(--height-button)] bg-primary text-on-primary rounded-card text-xs font-semibold hover:bg-primary-hover transition-colors shadow-card flex items-center gap-2">
                  <span>Atur Ulang Kata Sandi</span>
                </button>
              </div>
            </div>

            {/* Account Status */}
            <div className="border border-border-soft rounded-card p-5 space-y-3">
              <h3 className="text-xs font-bold text-heading uppercase tracking-wider">
                Status Akun
              </h3>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 accent-primary rounded"
                />
                <span className="text-xs font-semibold text-heading">
                  Akun aktif
                </span>
              </div>
              <p className="text-2xs text-faint">
                Nonaktifkan untuk memblokir akses masuk. Aktifkan kembali untuk memulihkan akses.
              </p>

              <div className="flex items-center gap-3 pt-2">
                <button className="px-4 h-[var(--height-button)] bg-danger text-on-primary rounded-card text-xs font-semibold hover:bg-danger-hover transition-colors shadow-card">
                  ✕ Nonaktifkan Akun
                </button>
                <button className="px-4 h-[var(--height-button)] bg-primary text-on-primary rounded-card text-xs font-semibold hover:bg-primary-hover transition-colors shadow-card">
                  ✓ Aktifkan Kembali Akun
                </button>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-soft">
              <button
                onClick={() => setCurrentView("list")}
                className="px-4 h-[var(--height-button)] border border-border text-heading rounded-card text-xs font-semibold hover:bg-canvas transition-colors"
              >
                ✕ Batal
              </button>
              <button
                onClick={() => setCurrentView("list")}
                className="px-4 h-[var(--height-button)] bg-primary text-on-primary rounded-card text-xs font-semibold hover:bg-primary-hover transition-colors shadow-card"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
