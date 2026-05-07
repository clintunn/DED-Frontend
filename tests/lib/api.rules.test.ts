import {
  ApiError,
  createRule,
  deleteRule,
  getActionTypes,
  getEventTypes,
  getRules,
  setAccessTokenGetter,
  updateRule,
} from "@/lib/api";

describe("rules API client methods", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    setAccessTokenGetter(() => "test-token");
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("gets event types with bearer token", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify([{ id: "evt-1", name: "Order Created" }]), {
        status: 200,
      })
    );

    await getEventTypes();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/events/event-types",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
        }),
      })
    );
  });

  it("gets action types with bearer token", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify([{ id: "act-1", name: "Send Email" }]), {
        status: 200,
      })
    );

    await getActionTypes();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/action",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
        }),
      })
    );
  });

  it("normalizes ruleActions from backend list payloads", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: [
            {
              id: "r-1",
              name: "A",
              eventTypeId: "evt-1",
              isActive: true,
              ruleActions: [
                {
                  id: "ra-2",
                  sortOrder: 1,
                  actionType: { id: "a-last", name: "Last", description: "d" },
                },
                {
                  id: "ra-1",
                  sortOrder: 0,
                  actionType: { id: "a-first", name: "First" },
                },
              ],
            },
          ],
          page: 1,
          limit: 20,
          total: 1,
        }),
        { status: 200 }
      )
    );

    const res = await getRules();
    expect(res.items).toHaveLength(1);
    expect(res.items[0]?.id).toBe("r-1");
    const ordered = res.items[0]?.ruleActions ?? [];
    expect(ordered.map((ra) => ra.actionType.id)).toEqual(["a-first", "a-last"]);
    expect(ordered.map((ra) => ra.actionType.name)).toEqual(["First", "Last"]);
    expect(res.total).toBe(1);
  });

  it("synthesizes ruleActions when backend only sends actionTypeIds (legacy)", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: [
            {
              id: "r-1",
              name: "A",
              eventTypeId: "evt-1",
              actionTypeIds: ["a1", "a2"],
              isActive: true,
            },
          ],
          page: 1,
          limit: 20,
          total: 1,
        }),
        { status: 200 }
      )
    );

    const res = await getRules();
    expect(res.items[0]?.ruleActions?.map((ra) => ra.actionType.id)).toEqual(["a1", "a2"]);
  });

  it("gets paginated rules with query params", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ items: [], page: 2, limit: 5, total: 0 }),
        { status: 200 }
      )
    );

    await getRules({ page: 2, limit: 5, isActive: true });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/rule?page=2&limit=5&isActive=true",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
        }),
      })
    );
  });

  it("creates a rule with only actionTypeIds in JSON body", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: "rule-1",
          name: "Notify",
          eventTypeId: "evt-1",
          isActive: true,
          ruleActions: [
            {
              id: "ra0",
              sortOrder: 0,
              actionType: { id: "act-1", name: "Send Email", description: null },
            },
          ],
        }),
        { status: 201 }
      )
    );

    await createRule({
      name: "Notify",
      eventTypeId: "evt-1",
      actionTypeIds: ["act-1"],
      isActive: true,
    });

    const requestInit = fetchMock.mock.calls[0][1] as RequestInit;
    const parsed = JSON.parse(String(requestInit.body)) as Record<string, unknown>;
    expect(parsed.organizationId).toBeUndefined();
    expect(parsed.actionTypeIds).toEqual(["act-1"]);
    expect(parsed.actionTypeId).toBeUndefined();
  });

  it("maps POST /rule HTTP 409 to a clear conflict message when body has no message", async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 409 }));

    await expect(
      createRule({ name: "n", eventTypeId: "evt-1", actionTypeIds: ["act-1"] })
    ).rejects.toThrow(/active rule already exists/i);
  });

  it("prefer server error strings for conflicts when present", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "duplicate active rule" }), { status: 409 })
    );

    try {
      await createRule({
        name: "n",
        eventTypeId: "evt-1",
        actionTypeIds: ["act-1"],
      });
      expect.fail("expected throw");
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect((e as ApiError).message).toBe("duplicate active rule");
    }
  });

  it("updates and deletes a rule with expected endpoints", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: "rule-1",
            name: "Updated",
            eventTypeId: "evt-1",
            isActive: false,
            ruleActions: [
              { id: "x", sortOrder: 0, actionType: { id: "act-1", name: "Email" } },
            ],
          }),
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      );

    await updateRule("rule-1", { name: "Updated", isActive: false });
    await deleteRule("rule-1");

    expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:3000/rule/rule-1");
    expect((fetchMock.mock.calls[0][1] as RequestInit).method).toBe("PATCH");
    expect(fetchMock.mock.calls[1][0]).toBe("http://localhost:3000/rule/rule-1");
    expect((fetchMock.mock.calls[1][1] as RequestInit).method).toBe("DELETE");
  });

  it("PATCH sends actionTypeIds without actionTypeId", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: "rule-1",
          name: "R",
          eventTypeId: "evt-1",
          isActive: true,
          ruleActions: [
            {
              sortOrder: 0,
              id: "a",
              actionType: { id: "b", name: "B" },
            },
          ],
        }),
        { status: 200 }
      )
    );

    await updateRule("rule-1", { actionTypeIds: ["b", "c"] });

    const requestInit = fetchMock.mock.calls[0][1] as RequestInit;
    const parsed = JSON.parse(String(requestInit.body)) as Record<string, unknown>;
    expect(parsed.actionTypeIds).toEqual(["b", "c"]);
    expect(parsed.actionTypeId).toBeUndefined();
  });
});
