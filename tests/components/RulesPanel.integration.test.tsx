import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RulesPanel } from "@/components/rules/RulesPanel";
import { setAccessTokenGetter } from "@/lib/api";

vi.mock("@/components/auth/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "u1", name: "Admin", email: "a@x.com", role: "ORG_ADMIN" },
  }),
}));

describe("RulesPanel create flow integration", () => {
  beforeEach(() => {
    setAccessTokenGetter(() => "integration-token");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates a rule successfully through mocked network", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";

      if (url.endsWith("/rule") && method === "GET") {
        return new Response(
          JSON.stringify({ items: [], page: 1, limit: 10, total: 0 }),
          { status: 200 }
        );
      }
      if (url.endsWith("/events/event-types") && method === "GET") {
        return new Response(
          JSON.stringify([{ id: "evt-1", name: "Order Created" }]),
          { status: 200 }
        );
      }
      if (url.endsWith("/action") && method === "GET") {
        return new Response(
          JSON.stringify([{ id: "act-1", name: "Send Email" }]),
          { status: 200 }
        );
      }
      if (url.endsWith("/rule") && method === "POST") {
        return new Response(
          JSON.stringify({
            id: "rule-1",
            name: "Welcome Rule",
            eventTypeId: "evt-1",
            isActive: true,
            ruleActions: [
              {
                id: "ra-0",
                sortOrder: 0,
                actionType: { id: "act-1", name: "Send Email", description: null },
              },
            ],
          }),
          { status: 201 }
        );
      }

      return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
    });

    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<RulesPanel mode="create" />);

    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Order Created" })).toBeInTheDocument();
      expect(screen.getByRole("checkbox", { name: "Send Email" })).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText("Name"), "Welcome Rule");
    await user.selectOptions(screen.getByLabelText("Event type"), "evt-1");
    await user.click(screen.getByRole("checkbox", { name: "Send Email" }));
    await user.click(screen.getByRole("button", { name: "Create rule" }));

    await waitFor(() => {
      expect(
        screen.getByText("Rule created successfully.")
      ).toBeInTheDocument();
    });
    expect(screen.queryByText("Welcome Rule")).not.toBeInTheDocument();
  });
});
