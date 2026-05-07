import { inferEventLogOutcome, sortedEventLogs } from "@/lib/event-log-outcomes";

describe("event-log-outcomes", () => {
  it("inferEventLogOutcome maps deterministic messages", () => {
    expect(inferEventLogOutcome("Action log.event executed")).toBe("success");
    expect(inferEventLogOutcome("notify.admin is unsupported")).toBe("unsupported");
    expect(inferEventLogOutcome("retry.webhook failed: timeout")).toBe("failure");
    expect(inferEventLogOutcome("queued")).toBe("unknown");
  });

  it("sortedEventLogs sorts by createdAt ascending", () => {
    expect(
      sortedEventLogs([
        {
          id: "b",
          message: "b",
          createdAt: "2026-05-06T02:00:00.000Z",
          eventId: "e",
          organizationId: "o",
        },
        {
          id: "a",
          message: "a",
          createdAt: "2026-05-06T01:00:00.000Z",
          eventId: "e",
          organizationId: "o",
        },
      ])
    ).toMatchObject([
      expect.objectContaining({ id: "a" }),
      expect.objectContaining({ id: "b" }),
    ]);
  });
});
