"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AuditLogsPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Normal Users cannot access this page — show 403
  if (user.role === "USER") {
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
            Your role ({user.roleLabel}) cannot open: Audit Logs
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
      <h1 className="text-page-title">Audit Logs</h1>
      <section className="bg-surface p-6 rounded-card border border-border-soft shadow-card space-y-4">
        <h2 className="text-sm font-bold text-heading">
          System activities and history logs
        </h2>
        <div className="overflow-x-auto border border-border-soft rounded-input">
          <table className="w-full text-left text-xs">
            <thead className="bg-table-head-bg border-b border-border-soft text-heading font-semibold">
              <tr>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">User</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Action</th>
                <th className="p-3.5">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft text-muted">
              {[1, 2, 3, 4].map((row) => (
                <tr key={row} className="hover:bg-canvas">
                  <td className="p-3.5">-</td>
                  <td className="p-3.5">-</td>
                  <td className="p-3.5">-</td>
                  <td className="p-3.5">-</td>
                  <td className="p-3.5">-</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
