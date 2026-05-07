import type { NavItem, UserRole } from "@/types";

export const dashboardNavItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    section: "overview",
    icon: "dashboard",
    allowedRoles: ["ORG_ADMIN", "USER"],
  },
  {
    href: "/users",
    label: "Users",
    section: "workspace",
    icon: "users",
    allowedRoles: ["ORG_ADMIN"],
    children: [
      {
        href: "/users/team-members",
        label: "Team Members",
        icon: "users",
        allowedRoles: ["ORG_ADMIN"],
      },
      {
        href: "/invites",
        label: "Invite Users",
        icon: "users",
        allowedRoles: ["ORG_ADMIN"],
      },
    ],
  },
  {
    href: "/settings/security",
    label: "Security",
    section: "workspace",
    icon: "users",
    allowedRoles: ["ORG_ADMIN", "USER"],
  },
  {
    href: "/events",
    label: "Events",
    section: "operations",
    icon: "events",
    allowedRoles: ["ORG_ADMIN", "USER"],
    children: [
      {
        href: "/events/all",
        label: "All Events",
        icon: "events",
        allowedRoles: ["ORG_ADMIN"],
      },
      {
        href: "/events/my",
        label: "My Events",
        icon: "events",
        allowedRoles: ["ORG_ADMIN", "USER"],
      },
      {
        href: "/events/create",
        label: "Create Event",
        icon: "events",
        allowedRoles: ["ORG_ADMIN", "USER"],
      },
      {
        href: "/events/monitor",
        label: "Monitor Execution",
        icon: "events",
        allowedRoles: ["ORG_ADMIN", "USER"],
      },
    ],
  },
  {
    href: "/rules",
    label: "Rules",
    section: "operations",
    icon: "rules",
    allowedRoles: ["ORG_ADMIN", "USER"],
    children: [
      {
        href: "/rules/all",
        label: "All Rules",
        icon: "rules",
        allowedRoles: ["ORG_ADMIN", "USER"],
      },
      {
        href: "/rules/create",
        label: "Create Rule",
        icon: "rules",
        allowedRoles: ["ORG_ADMIN"],
      },
    ],
  },
  {
    href: "/notifications",
    label: "Notifications",
    section: "operations",
    icon: "notifications",
    allowedRoles: ["ORG_ADMIN", "USER"],
  },
  {
    href: "/activity",
    label: "Activity",
    section: "operations",
    icon: "activity",
    allowedRoles: ["ORG_ADMIN"],
  },
  {
    href: "/monitor",
    label: "Monitor",
    section: "operations",
    icon: "monitoring",
    allowedRoles: ["ORG_ADMIN", "USER"],
  },
];

export function navItemsForRole(role: UserRole): NavItem[] {
  return dashboardNavItems
    .filter((item) => item.allowedRoles.includes(role))
    .map((item) => ({
      ...item,
      children: item.children?.filter((child) => child.allowedRoles.includes(role)),
    }));
}

export function getDashboardPageTitle(pathname: string): string {
  for (const item of dashboardNavItems) {
    const childMatch = item.children?.find(
      (child) => pathname === child.href || pathname.startsWith(`${child.href}/`)
    );
    if (childMatch) {
      return childMatch.label;
    }
    if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
      return item.label;
    }
  }
  return "Admin";
}
