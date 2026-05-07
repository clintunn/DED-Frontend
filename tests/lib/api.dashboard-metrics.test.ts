import { getDashboardMetrics, setAccessTokenGetter } from "@/lib/api";
import { getStatus } from "@/lib/api/monitor";

vi.mock("@/lib/api/monitor", () => ({
  getStatus: vi.fn(),
}));

describe("dashboard metrics API", () => {
  const fetchMock = vi.fn();
  const getStatusMock = vi.mocked(getStatus);

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    setAccessTokenGetter(() => "dash-token");
    fetchMock.mockReset();
    getStatusMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("maps live endpoint values into dashboard cards", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ items: [], page: 1, limit: 1, total: 42 }), {
          status: 200,
        })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              id: "n-1",
              message: "message",
              priority: "LOW",
              status: "SENT",
              createdAt: "2026-05-06T12:00:00.000Z",
            },
            {
              id: "n-2",
              message: "message 2",
              priority: "MEDIUM",
              status: "FAILED",
              createdAt: "2026-05-07T12:00:00.000Z",
            },
          ]),
          { status: 200 }
        )
      );

    getStatusMock.mockResolvedValueOnce({
      queue: { events: { waiting: 0, active: 0, delayed: 0, failed: 4, completed: 30 } },
      events: { stuck: 0, failedLastHour: 3 },
      notifications: { failedLastHour: 1 },
      worker: { lastEventLogAt: null },
      at: "2026-05-07T12:00:00.000Z",
    });

    const metrics = await getDashboardMetrics();

    expect(metrics.totalEvents).toEqual({ value: 42, delta: 0 });
    expect(metrics.processedEvents).toEqual({ value: 30, delta: 0 });
    expect(metrics.failedEvents).toEqual({ value: 3, delta: 0 });
    expect(metrics.notificationsCount).toEqual({ value: 2, delta: 0 });
    expect(getStatusMock).toHaveBeenCalledWith("dash-token");
  });

  it("falls back to queue failed count when failedLastHour is zero", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ items: [], page: 1, limit: 1, total: 9 }), {
          status: 200,
        })
      )
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }));

    getStatusMock.mockResolvedValueOnce({
      queue: { events: { waiting: 0, active: 0, delayed: 0, failed: 7, completed: 5 } },
      events: { stuck: 0, failedLastHour: 0 },
      notifications: { failedLastHour: 0 },
      worker: { lastEventLogAt: null },
      at: "2026-05-07T12:00:00.000Z",
    });

    const metrics = await getDashboardMetrics();

    expect(metrics.failedEvents).toEqual({ value: 7, delta: 0 });
  });

  it("degrades gracefully when one or more sources fail", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "boom" }), {
          status: 500,
        })
      )
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }));

    getStatusMock.mockRejectedValueOnce(new Error("status unavailable"));

    const metrics = await getDashboardMetrics();

    expect(metrics.totalEvents).toEqual({ value: 0, delta: 0 });
    expect(metrics.processedEvents).toEqual({ value: 0, delta: 0 });
    expect(metrics.failedEvents).toEqual({ value: 0, delta: 0 });
    expect(metrics.notificationsCount).toEqual({ value: 0, delta: 0 });
  });
});
