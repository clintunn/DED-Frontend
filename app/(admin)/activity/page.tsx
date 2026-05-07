import type { Metadata } from "next";
import { ActivityPageClient } from "@/components/activity/ActivityPageClient";
import { AdminRoute } from "@/components/auth/AdminRoute";

export const metadata: Metadata = {
  title: "Activity",
};

export default function ActivityPage() {
  return (
    <AdminRoute>
      <ActivityPageClient />
    </AdminRoute>
  );
}
