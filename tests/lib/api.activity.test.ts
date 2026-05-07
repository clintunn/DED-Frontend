import { getActivities } from "@/lib/api/activity";

describe("activity API client", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("serializes only defined query params", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: { data: [], total: 0, page: 2, limit: 10 },
        }),
        { status: 200 }
      )
    );

    await getActivities({ page: 2, limit: 10, type: "LOGIN" }, "activity-token");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/activity?page=2&limit=10&type=LOGIN",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer activity-token",
        }),
      })
    );
  });

  it("maps backend envelope to paginated activities response", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          statusCode: 200,
          success: true,
          message: "ok",
          data: {
            data: [
              {
                id: "act-1",
                type: "CREATE_USER",
                createdAt: "2026-05-07T09:00:00.000Z",
                userEmail: "user@example.com",
              },
            ],
            total: 1,
            page: 1,
            limit: 10,
          },
        }),
        { status: 200 }
      )
    );

    const result = await getActivities({ page: 1, limit: 10 }, "activity-token");

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.type).toBe("CREATE_USER");
    expect(result.items[0]?.userEmail).toBe("user@example.com");
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
    expect(result.total).toBe(1);
  });
});
