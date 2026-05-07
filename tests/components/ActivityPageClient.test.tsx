import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ActivityPageClient } from "@/components/activity/ActivityPageClient";
import * as authModule from "@/components/auth/AuthContext";
import * as activityApiModule from "@/lib/api/activity";

vi.mock("@/components/auth/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/api/activity", () => ({
  getActivities: vi.fn(),
}));

describe("ActivityPageClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authModule.useAuth).mockReturnValue({
      user: { id: "a-1", name: "Admin", email: "admin@test.com", role: "ORG_ADMIN" },
      accessToken: "activity-token",
      hydrated: true,
      login: vi.fn(),
      logout: vi.fn(),
      refreshAuthSession: vi.fn(),
    });
  });

  it("renders rows and supports filters + pagination fetch behavior", async () => {
    vi.mocked(activityApiModule.getActivities)
      .mockResolvedValueOnce({
        items: [
          {
            id: "act-1",
            type: "LOGIN",
            createdAt: "2026-05-07T09:00:00.000Z",
            userEmail: "user@example.com",
          },
        ],
        page: 1,
        limit: 10,
        total: 21,
      })
      .mockResolvedValue({
        items: [],
        page: 2,
        limit: 20,
        total: 21,
      });

    render(<ActivityPageClient />);

    await waitFor(() => {
      expect(screen.getByRole("cell", { name: "Login" })).toBeInTheDocument();
    });
    expect(screen.getByRole("cell", { name: "user@example.com" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Type"), {
      target: { value: "CREATE_INVITE" },
    });
    await waitFor(() => {
      expect(activityApiModule.getActivities).toHaveBeenCalledWith(
        expect.objectContaining({ type: "CREATE_INVITE", page: 1 }),
        "activity-token"
      );
    });

    fireEvent.change(screen.getByLabelText("Per page"), {
      target: { value: "20" },
    });
    await waitFor(() => {
      expect(activityApiModule.getActivities).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 20, page: 1 }),
        "activity-token"
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    await waitFor(() => {
      expect(activityApiModule.getActivities).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1 }),
        "activity-token"
      );
    });
  });

  it("shows error and empty states", async () => {
    vi.mocked(activityApiModule.getActivities).mockRejectedValueOnce(
      new Error("Boom")
    );

    render(<ActivityPageClient />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(screen.getByText("No activity logs found.")).toBeInTheDocument();
  });
});
