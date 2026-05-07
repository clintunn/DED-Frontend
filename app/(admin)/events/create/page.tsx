import type { Metadata } from "next";
import { EventsPageClient } from "@/components/events/EventsPageClient";

export const metadata: Metadata = {
  title: "Create Event",
};

export default function CreateEventPage() {
  return <EventsPageClient mode="create" />;
}
