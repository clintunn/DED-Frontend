"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthContext";
import { ApiError } from "@/lib/api";
import {
  adminAuthModeActive,
  adminAuthModeIdle,
  adminAuthModeShell,
  adminInputClass,
  adminPrimaryButton,
} from "@/lib/admin-form-classes";

type FieldErrors = {
  organizationName?: string;
  email?: string;
  password?: string;
};

const labelClass = "block text-sm font-medium text-brand";

export function LoginForm() {
  const router = useRouter();
  const { login, registerFoundation } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [organizationName, setOrganizationName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate(): boolean {
    const next: FieldErrors = {};
    if (mode === "register" && !organizationName.trim()) {
      next.organizationName = "Organization name is required.";
    }
    if (!email.trim()) {
      next.email = "Email is required.";
    }
    if (!password) {
      next.password = "Password is required.";
    } else if (password.length < 8) {
      next.password = "Password must be at least 8 characters.";
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "register") {
        await registerFoundation({
          organizationName: organizationName.trim(),
          email: email.trim(),
          password,
        });
      } else {
        await login({
          email: email.trim(),
          password,
        });
      }
      router.replace("/dashboard");
    } catch (e) {
      if (e instanceof ApiError) {
        setFormError(e.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
      <div className={adminAuthModeShell}>
        <button
          type="button"
          onClick={() => {
            setMode("login");
            setFormError("");
            setFieldErrors({});
          }}
          className={
            mode === "login" ? adminAuthModeActive : adminAuthModeIdle
          }
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("register");
            setFormError("");
            setFieldErrors({});
          }}
          className={
            mode === "register" ? adminAuthModeActive : adminAuthModeIdle
          }
        >
          Register org
        </button>
      </div>

      {formError ? (
        <p
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          role="alert"
        >
          {formError}
        </p>
      ) : null}

      {mode === "register" ? (
        <div>
          <label htmlFor="organization-name" className={labelClass}>
            Organization name
          </label>
          <input
            id="organization-name"
            name="organizationName"
            type="text"
            autoComplete="organization"
            value={organizationName}
            onChange={(e) => {
              setOrganizationName(e.target.value);
              if (fieldErrors.organizationName) {
                setFieldErrors((prev) => ({
                  ...prev,
                  organizationName: undefined,
                }));
              }
            }}
            className={adminInputClass}
            aria-invalid={Boolean(fieldErrors.organizationName)}
            aria-describedby={
              fieldErrors.organizationName ? "organization-name-error" : undefined
            }
          />
          {fieldErrors.organizationName ? (
            <p
              id="organization-name-error"
              className="mt-1 text-sm text-red-600"
              role="alert"
            >
              {fieldErrors.organizationName}
            </p>
          ) : null}
        </div>
      ) : null}

      <div>
        <label htmlFor="login-email" className={labelClass}>
          Email
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (fieldErrors.email) {
              setFieldErrors((prev) => ({ ...prev, email: undefined }));
            }
          }}
          className={adminInputClass}
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? "login-email-error" : undefined}
        />
        {fieldErrors.email ? (
          <p
            id="login-email-error"
            className="mt-1 text-sm text-red-600"
            role="alert"
          >
            {fieldErrors.email}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="login-password" className={labelClass}>
          Password
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (fieldErrors.password) {
              setFieldErrors((prev) => ({ ...prev, password: undefined }));
            }
          }}
          className={adminInputClass}
          aria-invalid={Boolean(fieldErrors.password)}
          aria-describedby={
            fieldErrors.password ? "login-password-error" : undefined
          }
        />
        {fieldErrors.password ? (
          <p
            id="login-password-error"
            className="mt-1 text-sm text-red-600"
            role="alert"
          >
            {fieldErrors.password}
          </p>
        ) : null}
      </div>
      {mode === "login" ? (
        <Link
          href="/forgot-password"
          className="inline-flex text-sm font-medium text-ink underline underline-offset-2 hover:text-brand"
        >
          Forgot password?
        </Link>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className={`${adminPrimaryButton} w-full`}
      >
        {isSubmitting
          ? mode === "register"
            ? "Creating account…"
            : "Signing in…"
          : mode === "register"
            ? "Create organization account"
            : "Log in"}
      </button>
    </form>
  );
}
