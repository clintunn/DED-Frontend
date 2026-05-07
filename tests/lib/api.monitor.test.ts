import {
  getHealth,
  getLive,
  getReady,
  getStatus,
  getVersion,
} from "@/lib/api/monitor";

describe("monitor API client", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("calls public monitor endpoints and maps payloads", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ live: true, at: "2026-05-07T00:00:00.000Z" }), {
          status: 200,
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ready: false, status: "degraded" }), { status: 200 })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            env: "production",
            version: "1.0.0",
            uptime: 1234,
            node: "v20.10.0",
          }),
          { status: 200 }
        )
      );

    const live = await getLive();
    const ready = await getReady();
    const version = await getVersion();

    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:3000/monitor/live");
    expect(fetchMock.mock.calls[1]?.[0]).toBe("http://localhost:3000/monitor/ready");
    expect(fetchMock.mock.calls[2]?.[0]).toBe("http://localhost:3000/monitor/version");
    expect(live.live).toBe(true);
    expect(ready.status).toBe("degraded");
    expect(version.node).toBe("v20.10.0");
  });

  it("calls admin endpoints with bearer token and maps nested fields", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            status: "healthy",
            dependencies: {
              database: { status: "ok", latencyMs: 12 },
              redis: { status: "ok", latencyMs: 3 },
              events_queue: { status: "degraded", latencyMs: 90 },
              memory_heap: { status: "ok", details: "normal" },
            },
          }),
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            queue: {
              events: { waiting: 1, active: 2, delayed: 3, failed: 4, completed: 5 },
            },
            events: { stuck: 6, failedLastHour: 7 },
            notifications: { failedLastHour: 8 },
            worker: { lastEventLogAt: "2026-05-07T01:00:00.000Z" },
          }),
          { status: 200 }
        )
      );

    const health = await getHealth("admin-token");
    const status = await getStatus("admin-token");

    const init1 = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const init2 = fetchMock.mock.calls[1]?.[1] as RequestInit;
    expect((init1.headers as Record<string, string>).Authorization).toBe(
      "Bearer admin-token"
    );
    expect((init2.headers as Record<string, string>).Authorization).toBe(
      "Bearer admin-token"
    );
    expect(health.dependencies.events_queue.status).toBe("degraded");
    expect(status.queue.events.completed).toBe(5);
    expect(status.worker.lastEventLogAt).toBe("2026-05-07T01:00:00.000Z");
  });

  it("throws for unauthorized admin endpoint", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 })
    );
    await expect(getHealth("bad-token")).rejects.toMatchObject({ status: 403 });
  });
});
