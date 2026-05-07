import React from "react";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EventExecutionMonitor } from "@/components/events/EventExecutionMonitor";
import * as apiModule from "@/lib/api";

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: () => null,
  }),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    getEventById: vi.fn(),
  };
});

const baseEvent = {
  id: "ev-1",
  eventTypeId: "evt-1",
  status: "PENDING",
  createdAt: "2026-05-06T00:00:00.000Z",
  updatedAt: "2026-05-06T00:00:01.000Z",
  userId: "u-1",
  organizationId: "org-1",
  payload: { a: 1 },
};

describe("EventExecutionMonitor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders status progression states", async () => {
    vi.mocked(apiModule.getEventById).mockResolvedValue({
      ...baseEvent,
      status: "PROCESSING",
      logs: [],
    });

    render(<EventExecutionMonitor />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Event ID"), "ev-1");
    await user.click(screen.getByRole("button", { name: "Monitor" }));

    await waitFor(() => {
      expect(screen.getAllByText("PROCESSING").length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.getByRole("list", { name: "Event status lifecycle" })).toBeInTheDocument();
    const timeline = screen.getByRole("list", { name: "Event status lifecycle" });
    expect(within(timeline).getByText("PENDING")).toBeInTheDocument();
    expect(within(timeline).getByText("PROCESSING")).toBeInTheDocument();
    expect(within(timeline).getByText("COMPLETED")).toBeInTheDocument();
    expect(within(timeline).getByText("FAILED")).toBeInTheDocument();
  });

  it(
    "stops polling after terminal status",
    async () => {
    vi.mocked(apiModule.getEventById)
      .mockResolvedValueOnce({
        ...baseEvent,
        status: "PROCESSING",
        logs: [],
      })
      .mockResolvedValueOnce({
        ...baseEvent,
        status: "COMPLETED",
        logs: [],
      });

    const user = userEvent.setup();
    render(<EventExecutionMonitor />);
    await user.type(screen.getByLabelText("Event ID"), "ev-1");
    await user.click(screen.getByRole("button", { name: "Monitor" }));

    await waitFor(() => {
      expect(apiModule.getEventById).toHaveBeenCalledTimes(1);
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 2700));
    });
    await waitFor(
      () => {
        expect(apiModule.getEventById).toHaveBeenCalledTimes(2);
      },
      { timeout: 6000 }
    );
    await act(async () => {
      await new Promise((r) => setTimeout(r, 3000));
    });
    expect(apiModule.getEventById).toHaveBeenCalledTimes(2);
    },
    12000
  );

  it("renders log outcomes from deterministic messages", async () => {
    vi.mocked(apiModule.getEventById).mockResolvedValue({
      ...baseEvent,
      status: "COMPLETED",
      logs: [
        {
          id: "l1",
          message: "Action log.event executed successfully",
          createdAt: "2026-05-06T00:00:00.000Z",
          eventId: "ev-1",
          organizationId: "org-1",
        },
        {
          id: "l2",
          message: "Action notify.admin is unsupported",
          createdAt: "2026-05-06T00:00:01.000Z",
          eventId: "ev-1",
          organizationId: "org-1",
        },
        {
          id: "l3",
          message: "Action retry.webhook failed: timeout",
          createdAt: "2026-05-06T00:00:02.000Z",
          eventId: "ev-1",
          organizationId: "org-1",
        },
      ],
    });

    render(<EventExecutionMonitor />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Event ID"), "ev-1");
    await user.click(screen.getByRole("button", { name: "Monitor" }));

    await waitFor(() => {
      expect(screen.getByText("success")).toBeInTheDocument();
      expect(screen.getByText("unsupported")).toBeInTheDocument();
      expect(screen.getByText("failure")).toBeInTheDocument();
    });
  });
});
