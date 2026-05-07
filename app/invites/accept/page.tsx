import type { Metadata } from "next";
import { AcceptInviteForm } from "@/components/invites/AcceptInviteForm";
import { RedirectIfAuthed } from "@/components/login/RedirectIfAuthed";
import { adminPanelClass } from "@/lib/admin-form-classes";

export const metadata: Metadata = {
  title: "Accept Invite",
};

export default function AcceptInvitePage() {
  return (
    <RedirectIfAuthed>
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className={`w-full max-w-sm ${adminPanelClass}`}>
          <h1 className="text-lg font-semibold text-ink sm:text-xl">
            Accept invite
          </h1>
          <p className="mt-2 text-sm text-brand">
            Set a password to activate your account for{" "}
            <strong className="text-ink">this organization.</strong>
          </p>
          <AcceptInviteForm />
        </div>
      </div>
    </RedirectIfAuthed>
  );
}
