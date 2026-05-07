import type { Metadata } from "next";
import { RedirectIfAuthed } from "@/components/login/RedirectIfAuthed";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { adminPanelClass } from "@/lib/admin-form-classes";

export const metadata: Metadata = {
  title: "Forgot password",
};

export default function ForgotPasswordPage() {
  return (
    <RedirectIfAuthed>
      <div className={`w-full max-w-sm ${adminPanelClass}`}>
        <h1 className="text-lg font-semibold text-ink sm:text-xl">Forgot password</h1>
        <p className="mt-2 text-sm text-brand">
          Enter your account email and we will send a password reset link.
        </p>
        <ForgotPasswordForm />
      </div>
    </RedirectIfAuthed>
  );
}
