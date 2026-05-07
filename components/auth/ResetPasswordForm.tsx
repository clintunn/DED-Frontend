"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ApiError, resetPassword } from "@/lib/api";
import {
  adminInputClass,
  adminPrimaryButton,
} from "@/lib/admin-form-classes";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token")?.trim() ?? "", [searchParams]);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate(): boolean {
    let valid = true;
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      valid = false;
    } else {
      setPasswordError("");
    }
    if (confirmPassword !== newPassword) {
      setConfirmError("Passwords do not match.");
      valid = false;
    } else {
      setConfirmError("");
    }
    return valid;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");
    setSuccessMessage("");
    if (!token) {
      setFormError("Password reset token is missing. Please use the reset link from your email.");
      return;
    }
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await resetPassword(token, newPassword);
      setSuccessMessage("Password updated. Please log in.");
      setTimeout(() => {
        router.replace("/login");
      }, 500);
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
      {!token ? (
        <p
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          role="alert"
        >
          Password reset token is missing. Please use the reset link from your email.
        </p>
      ) : null}
      {formError ? (
        <p
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          role="alert"
        >
          {formError}
        </p>
      ) : null}
      {successMessage ? (
        <p
          className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800"
          role="status"
        >
          {successMessage}
        </p>
      ) : null}
      <div>
        <label htmlFor="reset-new-password" className="block text-sm font-medium text-brand">
          New password
        </label>
        <input
          id="reset-new-password"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => {
            setNewPassword(e.target.value);
            if (passwordError) setPasswordError("");
          }}
          className={adminInputClass}
          aria-invalid={Boolean(passwordError)}
          aria-describedby={passwordError ? "reset-new-password-error" : undefined}
        />
        {passwordError ? (
          <p
            id="reset-new-password-error"
            className="mt-1 text-sm text-red-600"
            role="alert"
          >
            {passwordError}
          </p>
        ) : null}
      </div>
      <div>
        <label htmlFor="reset-confirm-password" className="block text-sm font-medium text-brand">
          Confirm password
        </label>
        <input
          id="reset-confirm-password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (confirmError) setConfirmError("");
          }}
          className={adminInputClass}
          aria-invalid={Boolean(confirmError)}
          aria-describedby={confirmError ? "reset-confirm-password-error" : undefined}
        />
        {confirmError ? (
          <p
            id="reset-confirm-password-error"
            className="mt-1 text-sm text-red-600"
            role="alert"
          >
            {confirmError}
          </p>
        ) : null}
      </div>
      <button
        type="submit"
        disabled={isSubmitting || !token}
        className={`${adminPrimaryButton} w-full`}
      >
        {isSubmitting ? "Updating password…" : "Update password"}
      </button>
      <Link
        href="/login"
        className="inline-flex text-sm font-medium text-ink underline underline-offset-2 hover:text-brand"
      >
        Back to login
      </Link>
    </form>
  );
}
