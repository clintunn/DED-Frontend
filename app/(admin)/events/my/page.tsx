import type { Metadata } from "next";
import { EventsPageClient } from "@/components/events/EventsPageClient";

export const metadata: Metadata = {
  title: "My Events",
};

export default function MyEventsPage() {
  return <EventsPageClient mode="my" />;
}
