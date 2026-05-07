import type { Metadata } from "next";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { MonitoringPageClient } from "@/components/monitoring/MonitoringPageClient";

export const metadata: Metadata = {
  title: "Monitoring",
};

export default function MonitoringPage() {
  return (
    <AdminRoute>
      <MonitoringPageClient />
    </AdminRoute>
  );
}
