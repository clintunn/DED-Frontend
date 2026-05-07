import type { Metadata } from "next";
import { EventExecutionMonitor } from "@/components/events/EventExecutionMonitor";

export const metadata: Metadata = {
  title: "Event Monitor",
};

export default function EventMonitorPage() {
  return <EventExecutionMonitor />;
}
