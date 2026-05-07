import type { Metadata } from "next";
import { MonitorDashboardPageClient } from "@/components/monitoring/MonitorDashboardPageClient";

export const metadata: Metadata = {
  title: "Monitor",
};

export default function MonitorPage() {
  return <MonitorDashboardPageClient />;
}
