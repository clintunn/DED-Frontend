import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { adminPanelClass } from "@/lib/admin-form-classes";

export default function SecuritySettingsPage() {
  return (
    <section className={`max-w-2xl ${adminPanelClass}`}>
      <h1 className="text-lg font-semibold text-ink sm:text-xl">Security</h1>
      <p className="mt-2 text-sm text-brand">
        Change your password to keep your workspace secure.
      </p>
      <div className="mt-6">
        <ChangePasswordForm />
      </div>
    </section>
  );
}
