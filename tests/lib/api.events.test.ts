import {
  createEvent,
  deleteEvent,
  getEventById,
  getEventTypes,
  getEvents,
  getMyEvents,
  setAccessTokenGetter,
  updateEvent,
} from "@/lib/api";

describe("events API client methods", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    setAccessTokenGetter(() => "events-token");
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("gets event list with filters and bearer token", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ items: [], page: 1, limit: 10, total: 0 }),
        { status: 200 }
      )
    );

    await getEvents({
      page: 1,
      limit: 10,
      eventTypeId: "evt-1",
      userId: "user-1",
      status: "PENDING",
      createdAt: "2026-04-30",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/events?page=1&limit=10&eventTypeId=evt-1&userId=user-1&status=PENDING&createdAt=2026-04-30",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer events-token",
        }),
      })
    );
  });

  it("maps backend data[] pagination shape to items", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: [
            {
              id: "ev-99",
              eventTypeId: "evt-99",
              status: "COMPLETED",
              createdAt: "2026-05-06T01:33:28.917Z",
              userId: "u-99",
              payload: { key: "v" },
            },
          ],
          page: 1,
          limit: 10,
          total: 1,
        }),
        { status: 200 }
      )
    );

    const res = await getEvents({ page: 1 });

    expect(res.items).toHaveLength(1);
    expect(res.items[0]?.id).toBe("ev-99");
    expect(res.total).toBe(1);
    expect(res.page).toBe(1);
    expect(res.limit).toBe(10);
  });

  it("gets my events and event details", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ items: [], page: 1, limit: 10, total: 0 }),
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: "ev-1",
            eventTypeId: "evt-1",
            status: "PENDING",
            createdAt: "2026-04-30T00:00:00.000Z",
            userId: "u-1",
            organizationId: "org-1",
            payload: {},
            logs: [
              {
                id: "log-1",
                message: "Action log.event executed successfully",
                createdAt: "2026-04-30T00:00:01.000Z",
                eventId: "ev-1",
                organizationId: "org-1",
              },
            ],
          }),
          { status: 200 }
        )
      );

    await getMyEvents({ page: 1, limit: 10 });
    const details = await getEventById("ev-1");

    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://localhost:3000/events/my?page=1&limit=10"
    );
    expect(fetchMock.mock.calls[1][0]).toBe("http://localhost:3000/events/ev-1");
    expect(details.organizationId).toBe("org-1");
    expect(details.logs).toHaveLength(1);
  });

  it("creates event without organizationId", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: "ev-1",
          eventTypeId: "evt-1",
          status: "PENDING",
          createdAt: "2026-04-30T00:00:00.000Z",
          userId: "u-1",
          payload: { a: 1 },
        }),
        { status: 201 }
      )
    );

    await createEvent({
      eventTypeId: "evt-1",
      payload: { a: 1 },
      userId: "u-1",
    });

    const requestInit = fetchMock.mock.calls[0][1] as RequestInit;
    const body = JSON.parse(String(requestInit.body)) as Record<string, unknown>;
    expect(body.organizationId).toBeUndefined();
  });

  it("updates and deletes event with expected endpoints", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: "ev-1",
            eventTypeId: "evt-1",
            status: "COMPLETED",
            createdAt: "2026-04-30T00:00:00.000Z",
            userId: "u-1",
            payload: { ok: true },
          }),
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ id: "evt-1", name: "Order Created" }]), {
          status: 200,
        })
      );

    await updateEvent("ev-1", { status: "COMPLETED" });
    await deleteEvent("ev-1");
    await getEventTypes();

    expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:3000/events/ev-1");
    expect((fetchMock.mock.calls[0][1] as RequestInit).method).toBe("PATCH");
    expect(fetchMock.mock.calls[1][0]).toBe("http://localhost:3000/events/ev-1");
    expect((fetchMock.mock.calls[1][1] as RequestInit).method).toBe("DELETE");
    expect(fetchMock.mock.calls[2][0]).toBe("http://localhost:3000/events/event-types");
  });
});
