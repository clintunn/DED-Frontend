import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EventsPageClient } from "@/components/events/EventsPageClient";
import { setAccessTokenGetter } from "@/lib/api";

vi.mock("@/components/auth/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "u-1", name: "Admin", email: "a@x.com", role: "ORG_ADMIN" },
  }),
}));

describe("EventsPageClient integration", () => {
  beforeEach(() => {
    setAccessTokenGetter(() => "integration-events-token");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates event then refreshes list", async () => {
    let items = [
      {
        id: "ev-1",
        eventTypeId: "evt-1",
        status: "PENDING",
        createdAt: "2026-04-30T00:00:00.000Z",
        userId: "u-1",
        payload: { one: true },
      },
    ];

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";

      if (url.includes("/events/event-types") && method === "GET") {
        return new Response(
          JSON.stringify([
            { id: "evt-1", name: "Order Created", recommendedActionType: "act-1" },
          ]),
          { status: 200 }
        );
      }
      if (url.endsWith("/action") && method === "GET") {
        return new Response(JSON.stringify([{ id: "act-1", name: "Send Email" }]), {
          status: 200,
        });
      }
      if ((url.includes("/events?") || url.includes("/events/my?")) && method === "GET") {
        return new Response(
          JSON.stringify({ items, page: 1, limit: 10, total: items.length }),
          { status: 200 }
        );
      }
      if (url.endsWith("/events") && method === "POST") {
        items = [
          ...items,
          {
            id: "ev-2",
            eventTypeId: "evt-1",
            status: "PENDING",
            createdAt: "2026-04-30T01:00:00.000Z",
            userId: "u-1",
            payload: { hello: "world" },
          },
        ];
        return new Response(JSON.stringify(items[1]), { status: 201 });
      }
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
    });

    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<EventsPageClient mode="create" />);

    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Order Created" })).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByLabelText("Event type"), "evt-1");
    const payloadField = screen.getByLabelText("Payload (JSON object)");
    fireEvent.change(payloadField, { target: { value: '{"hello":"world"}' } });
    await user.click(screen.getByRole("button", { name: "Create event" }));

    await waitFor(() => {
      expect(screen.getByText("Event created successfully.")).toBeInTheDocument();
    });
  });
});
