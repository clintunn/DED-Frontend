import { describe, expect, it } from "vitest";
import {
  getDashboardPageTitle,
  navItemsForRole,
} from "@/lib/dashboard-nav";

describe("dashboard-nav", () => {
  it("shows Users dropdown immediately after Dashboard for ORG_ADMIN", () => {
    const items = navItemsForRole("ORG_ADMIN");
    expect(items[0]?.href).toBe("/dashboard");
    expect(items[1]?.href).toBe("/users");
    expect(items[1]?.label).toBe("Users");
    expect(items[1]?.children?.map((c) => c.href)).toEqual([
      "/users/team-members",
      "/invites",
    ]);
  });

  it("does not expose User dropdown to USER role", () => {
    const items = navItemsForRole("USER");
    expect(items.some((i) => i.href === "/users")).toBe(false);
    expect(items.some((i) => i.href === "/invites")).toBe(false);
  });

  it("resolves page titles for nested User routes", () => {
    expect(getDashboardPageTitle("/users/team-members")).toBe("Team Members");
    expect(getDashboardPageTitle("/invites")).toBe("Invite Users");
    expect(getDashboardPageTitle("/invites/accept")).toBe("Invite Users");
  });
});
