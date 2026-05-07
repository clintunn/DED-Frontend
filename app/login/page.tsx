import type { Metadata } from "next";
import { LoginForm } from "@/components/login/LoginForm";
import { RedirectIfAuthed } from "@/components/login/RedirectIfAuthed";
import { adminPanelClass } from "@/lib/admin-form-classes";

export const metadata: Metadata = {
  title: "Login",
};

export default function LoginPage() {
  return (
    <RedirectIfAuthed>
      <div className={`w-full max-w-sm ${adminPanelClass}`}>
        <h1 className="text-lg font-semibold text-ink sm:text-xl">Welcome</h1>
        <p className="mt-2 text-sm text-brand">
          Sign in to your workspace or{" "}
          <strong className="text-ink">create a new organization account.</strong>
        </p>
        <LoginForm />
      </div>
    </RedirectIfAuthed>
  );
}
