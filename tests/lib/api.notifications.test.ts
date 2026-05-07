import { getNotifications, setAccessTokenGetter } from "@/lib/api";

describe("notifications API", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    setAccessTokenGetter(() => "notif-token");
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("calls GET /notification with bearer token", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify([]), { status: 200 })
    );

    await getNotifications();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/notification",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer notif-token",
        }),
      })
    );
  });

  it("sorts normalized rows newest-first and maps nested fields", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          {
            id: "n-old",
            message: "Older",
            priority: "LOW",
            status: "PENDING",
            createdAt: "2026-05-05T12:00:00.000Z",
          },
          {
            id: "n-new",
            message: "Newer",
            priority: "HIGH",
            status: "SENT",
            createdAt: "2026-05-06T12:00:00.000Z",
            user: { id: "u-1", email: "you@example.com", name: "You" },
            eventId: "ev-42",
          },
        ]),
        { status: 200 }
      )
    );

    const list = await getNotifications();

    expect(list).toHaveLength(2);
    expect(list[0]?.id).toBe("n-new");
    expect(list[1]?.id).toBe("n-old");
    expect(list[0]?.user?.email).toBe("you@example.com");
    expect(list[0]?.eventId).toBe("ev-42");
  });
});
