import type { Metadata } from "next";
import { EventsPageClient } from "@/components/events/EventsPageClient";

export const metadata: Metadata = {
  title: "All Events",
};

export default function AllEventsPage() {
  return <EventsPageClient mode="all" />;
}
