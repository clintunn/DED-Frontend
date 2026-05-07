import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EventsPageClient } from "@/components/events/EventsPageClient";
import * as authModule from "@/components/auth/AuthContext";
import * as apiModule from "@/lib/api";

vi.mock("@/components/auth/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    getEvents: vi.fn(),
    getMyEvents: vi.fn(),
    getEventById: vi.fn(),
    getEventTypes: vi.fn(),
    getActionTypes: vi.fn(),
    createEvent: vi.fn(),
    updateEvent: vi.fn(),
    deleteEvent: vi.fn(),
  };
});

const baseList = {
  items: [
    {
      id: "ev-1",
      eventTypeId: "evt-1",
      status: "PENDING",
      createdAt: "2026-04-30T00:00:00.000Z",
      userId: "u-1",
      payload: { foo: "bar" },
    },
  ],
  page: 1,
  limit: 10,
  total: 1,
} as const;

describe("EventsPageClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiModule.getEvents).mockResolvedValue(baseList);
    vi.mocked(apiModule.getMyEvents).mockResolvedValue(baseList);
    vi.mocked(apiModule.getEventTypes).mockResolvedValue([
      { id: "evt-1", name: "Order Created", recommendedActionType: "act-1" },
    ]);
    vi.mocked(apiModule.getActionTypes).mockResolvedValue([
      { id: "act-1", name: "Send Email" },
    ]);
  });

  it("shows create-only user target field for ORG_ADMIN", async () => {
    vi.mocked(authModule.useAuth).mockReturnValue({
      user: { id: "u-1", name: "Admin", email: "a@x.com", role: "ORG_ADMIN" },
    } as ReturnType<typeof authModule.useAuth>);

    render(<EventsPageClient mode="create" />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Create event" })).toBeInTheDocument();
    });
    expect(
      screen.getByLabelText("User ID (optional, org admin only)")
    ).toBeInTheDocument();
  });

  it("shows event type name in the events table, not the raw id", async () => {
    vi.mocked(authModule.useAuth).mockReturnValue({
      user: { id: "u-1", name: "Admin", email: "a@x.com", role: "ORG_ADMIN" },
    } as ReturnType<typeof authModule.useAuth>);

    render(<EventsPageClient mode="all" />);

    await waitFor(() => {
      expect(screen.getByRole("cell", { name: "Order Created" })).toBeInTheDocument();
    });
  });

  it("loads My Events for non-admin and hides admin-only controls", async () => {
    vi.mocked(authModule.useAuth).mockReturnValue({
      user: { id: "u-2", name: "User", email: "u@x.com", role: "USER" },
    } as ReturnType<typeof authModule.useAuth>);

    render(<EventsPageClient mode="my" />);

    await waitFor(() => {
      expect(apiModule.getMyEvents).toHaveBeenCalled();
    });
    expect(
      screen.queryByLabelText("User ID (optional, org admin only)")
    ).not.toBeInTheDocument();
  });

  it("validates payload and shows recommended action", async () => {
    vi.mocked(authModule.useAuth).mockReturnValue({
      user: { id: "u-1", name: "Admin", email: "a@x.com", role: "ORG_ADMIN" },
    } as ReturnType<typeof authModule.useAuth>);

    render(<EventsPageClient mode="create" />);
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByLabelText("Event type")).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByLabelText("Event type"), "evt-1");
    expect(screen.getByText(/Recommended action:/)).toBeInTheDocument();

    const payload = screen.getByLabelText("Payload (JSON object)");
    await user.clear(payload);
    await user.type(payload, "not-json");
    await user.click(screen.getByRole("button", { name: "Create event" }));

    await waitFor(() => {
      expect(screen.getByText("Payload must be valid JSON.")).toBeInTheDocument();
    });
  });

  it("shows monitor link after successful event creation", async () => {
    vi.mocked(authModule.useAuth).mockReturnValue({
      user: { id: "u-1", name: "Admin", email: "a@x.com", role: "ORG_ADMIN" },
    } as ReturnType<typeof authModule.useAuth>);
    vi.mocked(apiModule.createEvent).mockResolvedValue({
      id: "ev-new",
      eventTypeId: "evt-1",
      status: "PENDING",
      createdAt: "2026-05-06T12:00:00.000Z",
      userId: "u-1",
      payload: { hello: "world" },
    });

    render(<EventsPageClient mode="create" />);
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByLabelText("Event type")).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByLabelText("Event type"), "evt-1");
    const payload = screen.getByLabelText("Payload (JSON object)");
    fireEvent.change(payload, { target: { value: '{"hello":"world"}' } });
    await user.click(screen.getByRole("button", { name: "Create event" }));

    await waitFor(() => {
      expect(screen.getByText("Event created successfully.")).toBeInTheDocument();
    });

    const link = screen.getByRole("link", { name: "Monitor execution for this event" });
    expect(link).toHaveAttribute("href", "/events/monitor?eventId=ev-new");
    expect(apiModule.createEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventTypeId: "evt-1",
        payload: { hello: "world" },
      })
    );
  });
});
