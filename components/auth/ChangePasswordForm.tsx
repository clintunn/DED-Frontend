"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { ApiError, changePassword } from "@/lib/api";
import {
  adminInputClass,
  adminPrimaryButton,
} from "@/lib/admin-form-classes";

export function ChangePasswordForm() {
  const router = useRouter();
  const { accessToken, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate(): boolean {
    const next: {
      currentPassword?: string;
      newPassword?: string;
      confirmPassword?: string;
    } = {};
    if (!currentPassword) {
      next.currentPassword = "Current password is required.";
    }
    if (newPassword.length < 8) {
      next.newPassword = "Password must be at least 8 characters.";
    }
    if (confirmPassword !== newPassword) {
      next.confirmPassword = "Passwords do not match.";
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");
    setSuccessMessage("");
    if (!validate()) return;
    if (!accessToken) {
      setFormError("Your session has expired. Please log in again.");
      router.replace("/login");
      return;
    }

    setIsSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword, accessToken);
      setSuccessMessage("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          setFormError("Your session has expired. Please log in again.");
          logout();
          router.replace("/login");
        } else {
          setFormError(error.message);
        }
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
        <label
          htmlFor="security-current-password"
          className="block text-sm font-medium text-brand"
        >
          Current password
        </label>
        <input
          id="security-current-password"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          className={adminInputClass}
          value={currentPassword}
          onChange={(e) => {
            setCurrentPassword(e.target.value);
            if (fieldErrors.currentPassword) {
              setFieldErrors((prev) => ({ ...prev, currentPassword: undefined }));
            }
          }}
          aria-invalid={Boolean(fieldErrors.currentPassword)}
          aria-describedby={
            fieldErrors.currentPassword ? "security-current-password-error" : undefined
          }
        />
        {fieldErrors.currentPassword ? (
          <p
            id="security-current-password-error"
            className="mt-1 text-sm text-red-600"
            role="alert"
          >
            {fieldErrors.currentPassword}
          </p>
        ) : null}
      </div>
      <div>
        <label htmlFor="security-new-password" className="block text-sm font-medium text-brand">
          New password
        </label>
        <input
          id="security-new-password"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          className={adminInputClass}
          value={newPassword}
          onChange={(e) => {
            setNewPassword(e.target.value);
            if (fieldErrors.newPassword) {
              setFieldErrors((prev) => ({ ...prev, newPassword: undefined }));
            }
          }}
          aria-invalid={Boolean(fieldErrors.newPassword)}
          aria-describedby={fieldErrors.newPassword ? "security-new-password-error" : undefined}
        />
        {fieldErrors.newPassword ? (
          <p
            id="security-new-password-error"
            className="mt-1 text-sm text-red-600"
            role="alert"
          >
            {fieldErrors.newPassword}
          </p>
        ) : null}
      </div>
      <div>
        <label
          htmlFor="security-confirm-password"
          className="block text-sm font-medium text-brand"
        >
          Confirm new password
        </label>
        <input
          id="security-confirm-password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          className={adminInputClass}
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (fieldErrors.confirmPassword) {
              setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
            }
          }}
          aria-invalid={Boolean(fieldErrors.confirmPassword)}
          aria-describedby={
            fieldErrors.confirmPassword ? "security-confirm-password-error" : undefined
          }
        />
        {fieldErrors.confirmPassword ? (
          <p
            id="security-confirm-password-error"
            className="mt-1 text-sm text-red-600"
            role="alert"
          >
            {fieldErrors.confirmPassword}
          </p>
        ) : null}
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className={`${adminPrimaryButton} w-full sm:w-auto`}
      >
        {isSubmitting ? "Saving…" : "Change password"}
      </button>
    </form>
  );
}
