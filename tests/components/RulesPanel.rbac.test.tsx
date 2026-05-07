import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { RulesPanel } from "@/components/rules/RulesPanel";
import * as authModule from "@/components/auth/AuthContext";
import * as apiModule from "@/lib/api";
import type { Rule } from "@/types";

vi.mock("@/components/auth/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    getRules: vi.fn(),
    getEventTypes: vi.fn(),
    getActionTypes: vi.fn(),
    createRule: vi.fn(),
    updateRule: vi.fn(),
    deleteRule: vi.fn(),
  };
});

const mockRules: Rule[] = [
  {
    id: "rule-1",
    name: "Rule One",
    eventTypeId: "evt-1",
    ruleActions: [
      {
        id: "ra-0",
        sortOrder: 0,
        actionType: { id: "act-1", name: "Send Email" },
      },
    ],
    isActive: true,
  },
];

describe("RulesPanel RBAC", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiModule.getRules).mockResolvedValue({
      items: mockRules,
      page: 1,
      limit: 10,
      total: 1,
    });
    vi.mocked(apiModule.getEventTypes).mockResolvedValue([
      { id: "evt-1", name: "Order Created" },
    ]);
    vi.mocked(apiModule.getActionTypes).mockResolvedValue([
      { id: "act-1", name: "Send Email" },
    ]);
  });

  it("populates event/action dropdowns from API data", async () => {
    vi.mocked(authModule.useAuth).mockReturnValue({
      user: { id: "u1", name: "Admin", email: "a@x.com", role: "ORG_ADMIN" },
    } as ReturnType<typeof authModule.useAuth>);

    render(<RulesPanel mode="create" />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Create rule" })
      ).toBeInTheDocument();
    });

    expect(
      screen.getByRole("option", { name: "Order Created" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: "Send Email" })
    ).toBeInTheDocument();
  });

  it("shows create/edit/delete controls for ORG_ADMIN", async () => {
    vi.mocked(authModule.useAuth).mockReturnValue({
      user: { id: "u1", name: "Admin", email: "a@x.com", role: "ORG_ADMIN" },
    } as ReturnType<typeof authModule.useAuth>);

    render(<RulesPanel mode="all" />);

    await waitFor(() => {
      expect(screen.getByText("Rule One")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("hides mutation controls for non-admin USER", async () => {
    vi.mocked(authModule.useAuth).mockReturnValue({
      user: { id: "u2", name: "User", email: "u@x.com", role: "USER" },
    } as ReturnType<typeof authModule.useAuth>);

    render(<RulesPanel mode="all" />);

    await waitFor(() => {
      expect(screen.getByText("Rule One")).toBeInTheDocument();
    });

    expect(screen.queryByText("Create rule")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
  });
});
