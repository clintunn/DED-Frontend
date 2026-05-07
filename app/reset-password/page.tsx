import type { Metadata } from "next";
import { RedirectIfAuthed } from "@/components/login/RedirectIfAuthed";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { adminPanelClass } from "@/lib/admin-form-classes";

export const metadata: Metadata = {
  title: "Reset password",
};

export default function ResetPasswordPage() {
  return (
    <RedirectIfAuthed>
      <div className={`w-full max-w-sm ${adminPanelClass}`}>
        <h1 className="text-lg font-semibold text-ink sm:text-xl">Reset password</h1>
        <p className="mt-2 text-sm text-brand">
          Choose a new password for your account.
        </p>
        <ResetPasswordForm />
      </div>
    </RedirectIfAuthed>
  );
}
