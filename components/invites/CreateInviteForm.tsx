"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/components/auth/AuthContext";
import {
  adminInputClass,
  adminPanelClass,
  adminPrimaryButton,
} from "@/lib/admin-form-classes";

const labelClass = "block text-sm font-medium text-brand";

export function CreateInviteForm() {
  const { createInvite } = useAuth();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ORG_ADMIN" | "USER">("USER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await createInvite({ email: email.trim(), role });
      setSuccess("Invite sent successfully.");
      setEmail("");
      setRole("USER");
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
      } else {
        setError("Unable to send invite. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`${adminPanelClass} w-full max-w-md space-y-4`}
      noValidate
    >
      <p className="text-sm text-brand">
        Invite a teammate to{" "}
        <strong className="text-ink">your organization.</strong>
      </p>

      {error ? (
        <p
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {success ? (
        <p
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
          role="status"
        >
          {success}
        </p>
      ) : null}

      <div>
        <label htmlFor="invite-email" className={labelClass}>
          Email
        </label>
        <input
          id="invite-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={adminInputClass}
          required
        />
      </div>

      <div>
        <label htmlFor="invite-role" className={labelClass}>
          Role
        </label>
        <select
          id="invite-role"
          value={role}
          onChange={(e) => setRole(e.target.value as "ORG_ADMIN" | "USER")}
          className={adminInputClass}
        >
          <option value="USER">USER</option>
          <option value="ORG_ADMIN">ORG_ADMIN</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={loading || !email.trim()}
        className={adminPrimaryButton}
      >
        {loading ? "Sending…" : "Send invite"}
      </button>
    </form>
  );
}
