"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

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
            403 - Access denied
          </h2>
          <p className="text-xs text-muted">
            Your role ({user.roleLabel}) cannot open: User Management, Create
            user accounts, Assign roles
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-primary text-on-primary rounded-card text-xs font-semibold hover:bg-primary-hover transition-colors shadow-card"
          >
            Back to Dashboard
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
          <h1 className="text-page-title">User Management</h1>

          <section className="bg-surface p-6 rounded-card border border-border-soft shadow-card space-y-4">
            <h2 className="text-sm font-bold text-heading">Users</h2>

            {/* Filter & Search Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-1">
                <label className="text-field-label">Search</label>
                <input
                  type="text"
                  placeholder="Name or email"
                  className="w-full h-[var(--height-input)] px-3 text-xs border border-border rounded-input bg-surface focus:outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-field-label">Role</label>
                <select className="w-full h-[var(--height-input)] px-3 text-xs border border-border rounded-input bg-surface focus:outline-none focus:border-primary">
                  <option>All roles</option>
                  <option>User</option>
                  <option>Web Manager</option>
                  <option>Super Admin</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-field-label">Status</label>
                <select className="w-full h-[var(--height-input)] px-3 text-xs border border-border rounded-input bg-surface focus:outline-none focus:border-primary">
                  <option>All</option>
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
              <div>
                <button
                  onClick={() => setCurrentView("create")}
                  className="w-full h-[var(--height-button)] px-4 bg-primary text-on-primary rounded-card text-xs font-semibold hover:bg-primary-hover transition-colors shadow-card flex items-center justify-center gap-2"
                >
                  <span>+ Create user</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-border-soft rounded-input">
              <table className="w-full text-left text-xs">
                <thead className="bg-table-head-bg border-b border-border-soft text-heading font-semibold">
                  <tr>
                    <th className="p-3.5">Name</th>
                    <th className="p-3.5">Email</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Created</th>
                    <th className="p-3.5 text-right pr-25"> Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-soft text-muted">
                  {[1, 2, 3, 4, 5, 6, 7].map((row) => (
                    <tr key={row} className="hover:bg-canvas">
                      <td className="p-3.5">-</td>
                      <td className="p-3.5">-</td>
                      <td className="p-3.5">-</td>
                      <td className="p-3.5">-</td>
                      <td className="p-3.5">-</td>
                      <td className="p-3.5 text-right space-x-1 pr-27 font-medium">
                        <button
                          onClick={() => setCurrentView("edit")}
                          className="text-primary hover:underline"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="flex items-center justify-between pt-2 text-xs text-muted">
              <span>Showing 1-10 of 0</span>
              <div className="flex items-center gap-2">
                <span>Rows per page</span>
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
          <h1 className="text-page-title">User Management / Create User</h1>

          <div className="bg-surface p-6 rounded-card border border-border-soft shadow-card space-y-6">
            <div className="border border-border-soft rounded-card p-5 space-y-4">
              <h3 className="text-xs font-bold text-heading uppercase tracking-wider">
                Account details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-field-label">Full name *</label>
                  <input
                    type="text"
                    placeholder="Enter name"
                    className="w-full h-[var(--height-input)] px-3 text-xs border border-border rounded-input bg-surface focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-field-label">Email *</label>
                  <input
                    type="email"
                    placeholder="Enter email"
                    className="w-full h-[var(--height-input)] px-3 text-xs border border-border rounded-input bg-surface focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-field-label">Initial password *</label>
                  <input
                    type="password"
                    placeholder="Enter password"
                    className="w-full h-[var(--height-input)] px-3 text-xs border border-border rounded-input bg-surface focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-field-label">
                    Confirm password *
                  </label>
                  <input
                    type="password"
                    placeholder="Repeat password"
                    className="w-full h-[var(--height-input)] px-3 text-xs border border-border rounded-input bg-surface focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>

            {/* Role Selection */}
            <div className="border border-border-soft rounded-card p-5 space-y-3">
              <h3 className="text-xs font-bold text-heading uppercase tracking-wider">
                Role
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
                    <p className="text-xs font-bold text-heading">User</p>
                    <p className="text-2xs text-muted">
                      Upload and view own submissions and records
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
                      Web Manager
                    </p>
                    <p className="text-2xs text-muted">
                      View all submissions, records and audit logs
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
                      Full access including account management
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
                Account active
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-soft">
              <button
                onClick={() => setCurrentView("list")}
                className="px-4 h-[var(--height-button)] border border-border text-heading rounded-card text-xs font-semibold hover:bg-canvas transition-colors"
              >
                ✕ Cancel
              </button>
              <button
                onClick={() => setCurrentView("list")}
                className="px-4 h-[var(--height-button)] bg-primary text-on-primary rounded-card text-xs font-semibold hover:bg-primary-hover transition-colors shadow-card"
              >
                + Create user
              </button>
            </div>
          </div>
        </>
      )}

      {/* VIEW 3: EDIT USER */}
      {currentView === "edit" && (
        <>
          <h1 className="text-page-title">Edit User</h1>

          <div className="bg-surface p-6 rounded-card border border-border-soft shadow-card space-y-6">
            <div className="border border-border-soft rounded-card p-5 space-y-4">
              <h3 className="text-xs font-bold text-heading uppercase tracking-wider">
                User information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-field-label">Full name</label>
                  <input
                    type="text"
                    defaultValue="User name"
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
                Role
              </h3>
              <label className="text-field-label">Account type</label>
              <select className="w-full h-[var(--height-input)] px-3 text-xs border border-border rounded-input bg-surface focus:outline-none focus:border-primary">
                <option>User</option>
                <option>Web Manager</option>
                <option>Super Admin</option>
              </select>
            </div>

            {/* Reset Password Section */}
            <div className="border border-border-soft rounded-card p-5 space-y-4">
              <h3 className="text-xs font-bold text-heading uppercase tracking-wider">
                Reset password
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-field-label">New password</label>
                  <input
                    type="password"
                    placeholder="Enter new password"
                    className="w-full h-[var(--height-input)] px-3 text-xs border border-border rounded-input bg-surface focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-field-label">
                    Confirm new password
                  </label>
                  <input
                    type="password"
                    placeholder="Repeat new password"
                    className="w-full h-[var(--height-input)] px-3 text-xs border border-border rounded-input bg-surface focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button className="px-4 h-[var(--height-button)] bg-primary text-on-primary rounded-card text-xs font-semibold hover:bg-primary-hover transition-colors shadow-card flex items-center gap-2">
                  <span>Reset password</span>
                </button>
              </div>
            </div>

            {/* Account Status */}
            <div className="border border-border-soft rounded-card p-5 space-y-3">
              <h3 className="text-xs font-bold text-heading uppercase tracking-wider">
                Account status
              </h3>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 accent-primary rounded"
                />
                <span className="text-xs font-semibold text-heading">
                  Account active
                </span>
              </div>
              <p className="text-2xs text-faint">
                Deactivate to block login. Reactivate to restore access.
              </p>

              <div className="flex items-center gap-3 pt-2">
                <button className="px-4 h-[var(--height-button)] bg-danger text-on-primary rounded-card text-xs font-semibold hover:bg-danger-hover transition-colors shadow-card">
                  ✕ Deactivate account
                </button>
                <button className="px-4 h-[var(--height-button)] bg-primary text-on-primary rounded-card text-xs font-semibold hover:bg-primary-hover transition-colors shadow-card">
                  ✓ Reactivate account
                </button>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-soft">
              <button
                onClick={() => setCurrentView("list")}
                className="px-4 h-[var(--height-button)] border border-border text-heading rounded-card text-xs font-semibold hover:bg-canvas transition-colors"
              >
                ✕ Cancel
              </button>
              <button
                onClick={() => setCurrentView("list")}
                className="px-4 h-[var(--height-button)] bg-primary text-on-primary rounded-card text-xs font-semibold hover:bg-primary-hover transition-colors shadow-card"
              >
                Save changes
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
