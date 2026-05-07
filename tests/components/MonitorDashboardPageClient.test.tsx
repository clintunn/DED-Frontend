import { render, screen, waitFor } from "@testing-library/react";
import { MonitorDashboardPageClient } from "@/components/monitoring/MonitorDashboardPageClient";
import * as authModule from "@/components/auth/AuthContext";
import * as monitorApiModule from "@/lib/api/monitor";

vi.mock("@/components/auth/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/api/monitor", () => ({
  getLive: vi.fn(),
  getReady: vi.fn(),
  getVersion: vi.fn(),
  getHealth: vi.fn(),
  getStatus: vi.fn(),
}));

describe("MonitorDashboardPageClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(monitorApiModule.getLive).mockResolvedValue({ live: true });
    vi.mocked(monitorApiModule.getReady).mockResolvedValue({
      ready: true,
      status: "healthy",
    });
    vi.mocked(monitorApiModule.getVersion).mockResolvedValue({
      env: "dev",
      version: "1.2.3",
      uptime: 10,
      node: "v20.0.0",
    });
    vi.mocked(monitorApiModule.getHealth).mockResolvedValue({
      status: "healthy",
      dependencies: {
        database: { status: "ok", latencyMs: 10 },
        redis: { status: "ok", latencyMs: 2 },
        events_queue: { status: "ok", latencyMs: 3 },
        memory_heap: { status: "ok", latencyMs: 1 },
      },
    });
    vi.mocked(monitorApiModule.getStatus).mockResolvedValue({
      queue: {
        events: { waiting: 1, active: 1, delayed: 0, failed: 0, completed: 4 },
      },
      events: { stuck: 0, failedLastHour: 0 },
      notifications: { failedLastHour: 0 },
      worker: { lastEventLogAt: "2026-05-07T00:00:00.000Z" },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows public section for USER without admin diagnostics", async () => {
    vi.mocked(authModule.useAuth).mockReturnValue({
      user: { id: "u-1", name: "User", email: "u@test.com", role: "USER" },
      accessToken: "user-token",
      hydrated: true,
      login: vi.fn(),
      logout: vi.fn(),
      refreshAuthSession: vi.fn(),
    });

    render(<MonitorDashboardPageClient />);

    await waitFor(() => {
      expect(screen.getByText("Public status")).toBeInTheDocument();
    });
    expect(screen.queryByText("Admin diagnostics")).not.toBeInTheDocument();
    expect(monitorApiModule.getHealth).not.toHaveBeenCalled();
    expect(monitorApiModule.getStatus).not.toHaveBeenCalled();
  });

  it("shows admin diagnostics for ORG_ADMIN", async () => {
    vi.mocked(authModule.useAuth).mockReturnValue({
      user: { id: "a-1", name: "Admin", email: "a@test.com", role: "ORG_ADMIN" },
      accessToken: "admin-token",
      hydrated: true,
      login: vi.fn(),
      logout: vi.fn(),
      refreshAuthSession: vi.fn(),
    });

    render(<MonitorDashboardPageClient />);

    await waitFor(() => {
      expect(screen.getByText("Admin diagnostics")).toBeInTheDocument();
    });
    expect(monitorApiModule.getHealth).toHaveBeenCalledWith("admin-token");
    expect(monitorApiModule.getStatus).toHaveBeenCalledWith("admin-token");
  });

  it("polls at expected intervals and cleans up timers", async () => {
    const setIntervalSpy = vi.spyOn(globalThis, "setInterval");
    const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");
    vi.mocked(authModule.useAuth).mockReturnValue({
      user: { id: "a-1", name: "Admin", email: "a@test.com", role: "ORG_ADMIN" },
      accessToken: "admin-token",
      hydrated: true,
      login: vi.fn(),
      logout: vi.fn(),
      refreshAuthSession: vi.fn(),
    });

    const view = render(<MonitorDashboardPageClient />);

    await waitFor(() => {
      expect(monitorApiModule.getLive).toHaveBeenCalledTimes(1);
      expect(monitorApiModule.getHealth).toHaveBeenCalledTimes(1);
    });
    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 15_000);
    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 30_000);

    view.unmount();
    expect(clearIntervalSpy).toHaveBeenCalled();
  });
});
