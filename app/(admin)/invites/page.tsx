import type { Metadata } from "next";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { CreateInviteForm } from "@/components/invites/CreateInviteForm";

export const metadata: Metadata = {
  title: "Invite Users",
};

export default function InvitesPage() {
  return (
    <AdminRoute>
      <CreateInviteForm />
    </AdminRoute>
  );
}
