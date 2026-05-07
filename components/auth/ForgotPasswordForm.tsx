"use client";

import Link from "next/link";
import { useState } from "react";
import { ApiError, forgotPassword } from "@/lib/api";
import {
  adminInputClass,
  adminPrimaryButton,
} from "@/lib/admin-form-classes";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [debugToken, setDebugToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate(): boolean {
    if (!email.trim()) {
      setEmailError("Email is required.");
      return false;
    }
    setEmailError("");
    return true;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");
    setSuccessMessage("");
    setDebugToken(null);

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const response = await forgotPassword(email.trim());
      setSuccessMessage("If an account exists, we’ve sent a reset link.");
      if (response.token) {
        setDebugToken(response.token);
      }
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
      {debugToken ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Local debug token: <span className="font-mono">{debugToken}</span>
        </p>
      ) : null}
      <div>
        <label htmlFor="forgot-email" className="block text-sm font-medium text-brand">
          Email
        </label>
        <input
          id="forgot-email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (emailError) setEmailError("");
          }}
          className={adminInputClass}
          aria-invalid={Boolean(emailError)}
          aria-describedby={emailError ? "forgot-email-error" : undefined}
        />
        {emailError ? (
          <p id="forgot-email-error" className="mt-1 text-sm text-red-600" role="alert">
            {emailError}
          </p>
        ) : null}
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className={`${adminPrimaryButton} w-full`}
      >
        {isSubmitting ? "Sending reset link…" : "Send reset link"}
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
