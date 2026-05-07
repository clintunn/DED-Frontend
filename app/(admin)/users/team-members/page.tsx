import type { Metadata } from "next";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { TeamMembersPageClient } from "@/components/users/TeamMembersPageClient";

export const metadata: Metadata = {
  title: "Team Members",
};

export default function TeamMembersPage() {
  return (
    <AdminRoute>
      <TeamMembersPageClient />
    </AdminRoute>
  );
}
