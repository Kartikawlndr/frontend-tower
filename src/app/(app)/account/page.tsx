"use client";

import { useState } from "react";
import { Check, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function AccountPage() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleCancel() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
    setSuccess(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All password fields are required.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setSuccess(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-[26px] font-bold text-[#1f2a37]">Account</h1>

      {/* Profile Card */}
      <div className="rounded-[10px] border border-[#e5e7eb] bg-white p-6">
        <h2 className="mb-4 text-[16px] font-semibold text-[#1f2a37]">
          Profile
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[#1f2a37]">
              Name
            </label>
            <input
              type="text"
              disabled
              value={user.name}
              className="h-9 w-full cursor-not-allowed rounded-lg border border-[#d0d5db] bg-[#f5f6f8] px-3 text-[13px] text-[#6b7280]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[#1f2a37]">
              Email
            </label>
            <input
              type="email"
              disabled
              value={user.email}
              className="h-9 w-full cursor-not-allowed rounded-lg border border-[#d0d5db] bg-[#f5f6f8] px-3 text-[13px] text-[#6b7280]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[#1f2a37]">
              Role
            </label>
            <input
              type="text"
              disabled
              value={user.roleLabel}
              className="h-9 w-full cursor-not-allowed rounded-lg border border-[#d0d5db] bg-[#f5f6f8] px-3 text-[13px] text-[#6b7280]"
            />
          </div>
        </div>
      </div>

      {/* Change Own Password Card */}
      <form
        onSubmit={handleSubmit}
        className="rounded-[10px] border border-[#e5e7eb] bg-white p-6"
      >
        <h2 className="mb-4 text-[16px] font-semibold text-[#1f2a37]">
          Change own password
        </h2>

        {error && (
          <div className="mb-4 rounded-lg border border-[#8f181b] bg-[#f6e8e8] px-4 py-2.5 text-[13px] text-[#8f181b]">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg border border-[#016db0] bg-[#eaf5fc] px-4 py-2.5 text-[13px] text-[#016db0]">
            Password updated successfully (demo state).
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Current Password */}
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[#1f2a37]">
              Current password <span className="text-[#8f181b]">*</span>
            </label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="h-9 w-full rounded-lg border border-[#d0d5db] bg-white pl-3 pr-9 text-[13px] text-[#1f2a37] placeholder:text-[#6b7280] focus:border-[#016db0] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-[#1f2a37]"
                aria-label={showCurrent ? "Hide password" : "Show password"}
              >
                {showCurrent ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[#1f2a37]">
              New password <span className="text-[#8f181b]">*</span>
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="h-9 w-full rounded-lg border border-[#d0d5db] bg-white pl-3 pr-9 text-[13px] text-[#1f2a37] placeholder:text-[#6b7280] focus:border-[#016db0] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-[#1f2a37]"
                aria-label={showNew ? "Hide password" : "Show password"}
              >
                {showNew ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[#1f2a37]">
              Confirm password <span className="text-[#8f181b]">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="h-9 w-full rounded-lg border border-[#d0d5db] bg-white pl-3 pr-9 text-[13px] text-[#1f2a37] placeholder:text-[#6b7280] focus:border-[#016db0] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-[#1f2a37]"
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="inline-flex h-9 items-center justify-center rounded-[10px] border border-[#d0d5db] bg-white px-4 text-[13px] font-medium text-[#1f2a37] transition-colors hover:bg-[#f5f6f8]"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-[10px] bg-[#016db0] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#015a92]"
          >
            <Check className="h-4 w-4" />
            Update password
          </button>
        </div>
      </form>
    </div>
  );
}