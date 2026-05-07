import { NextResponse } from "next/server";
import { mockEvents } from "@/lib/mock-events";
import type {
  EventRecord,
  EventStatus,
  PaginatedEventsResponse,
} from "@/types";

let events: EventRecord[] = [...mockEvents];

export async function GET() {
  const response: PaginatedEventsResponse = {
    items: events,
    page: 1,
    limit: events.length || 10,
    total: events.length,
  };
  return NextResponse.json(response);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (
    !body ||
    typeof body !== "object" ||
    typeof (body as { eventTypeId?: unknown }).eventTypeId !== "string" ||
    !(body as { eventTypeId: string }).eventTypeId.trim()
  ) {
    return NextResponse.json(
      { error: "Field `eventTypeId` is required" },
      { status: 400 }
    );
  }

  const b = body as {
    eventTypeId: string;
    userId?: string;
    status?: EventStatus;
    payload?: Record<string, unknown>;
  };

  const allowed: EventStatus[] = [
    "PENDING",
    "PROCESSING",
    "COMPLETED",
    "FAILED",
  ];
  const status: EventStatus =
    b.status && allowed.includes(b.status) ? b.status : "PENDING";

  const event: EventRecord = {
    id: `evt_${crypto.randomUUID()}`,
    eventTypeId: b.eventTypeId.trim(),
    status,
    createdAt: new Date().toISOString(),
    userId: typeof b.userId === "string" && b.userId.trim() ? b.userId.trim() : "usr_self",
    payload:
      b.payload && typeof b.payload === "object" && !Array.isArray(b.payload)
        ? b.payload
        : {},
  };

  events = [event, ...events];
  return NextResponse.json(event, { status: 201 });
}
