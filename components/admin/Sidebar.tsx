"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthContext";
import { navItemsForRole } from "@/lib/dashboard-nav";
import type { NavItem } from "@/types";

type SidebarProps = {
  brand: string;
  open: boolean;
  onNavigate: () => void;
};

export function Sidebar({ brand, open, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const items = user ? navItemsForRole(user.role) : [];
  const groupedItems = groupBySection(items);
  const initial = user?.name?.charAt(0).toUpperCase() ?? "?";

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={onNavigate}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[min(100%,17rem)] max-w-[85vw] flex-col border-r border-subtleBorder/55 bg-sidebar-rail shadow-sm text-white transition-transform duration-200 ease-out md:w-[17rem] md:max-w-none ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex h-14 shrink-0 items-center gap-3 px-4">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 shadow-inner ring-1 ring-white/15"
            aria-hidden="true"
          >
            <svg
              className="h-4 w-4 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeWidth="1.75"
                strokeLinecap="round"
                d="M12 7v10M7 12h10"
              />
            </svg>
          </span>
          <span className="min-w-0 truncate text-base font-semibold tracking-tight text-white">
            {brand}
          </span>
        </div>

        <nav
          className="flex flex-1 flex-col gap-5 px-3 pb-3"
          aria-label="Main"
        >
          {groupedItems.map(([section, sectionItems]) => (
            <div key={section} className="space-y-1.5">
              <p className="px-2 text-[11px] font-medium uppercase tracking-[0.14em] text-white/45">
                {SECTION_LABELS[section]}
              </p>
              <div className="space-y-1">
                {sectionItems.map((item) => {
                  const active =
                    pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const hasChildren = Boolean(item.children?.length);

                  if (hasChildren) {
                    return (
                      <details
                        key={item.href}
                        open={active}
                        className="group rounded-xl"
                      >
                        <summary className="flex min-w-0 cursor-pointer list-none items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-sm transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40">
                          <span className="flex min-w-0 flex-1 items-center gap-2.5 text-white/90">
                            <NavIcon icon={item.icon} />
                            <span className="truncate font-semibold">{item.label}</span>
                            <NavBadge badge={item.badge} tone={item.badgeTone} />
                          </span>
                          <svg
                            className="h-4 w-4 shrink-0 text-white/45 transition-transform duration-200 group-open:-rotate-180"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </summary>
                        <div className="relative mt-1 ml-3 border-l border-subtleBorder/35 pl-3">
                          {item.children?.map((child) => {
                            const childActive =
                              pathname === child.href ||
                              pathname.startsWith(`${child.href}/`);
                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                onClick={onNavigate}
                                className={`mt-0.5 flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
                                  childActive
                                    ? "bg-raised font-medium text-ink shadow-soft"
                                    : "font-normal text-white/65 hover:bg-white/10 hover:text-white"
                                }`}
                              >
                                <NavIcon icon={child.icon} className="opacity-90" />
                                <span className="min-w-0 flex-1 leading-snug break-words">
                                  {child.label}
                                </span>
                                <NavBadge badge={child.badge} tone={child.badgeTone} />
                              </Link>
                            );
                          })}
                        </div>
                      </details>
                    );
                  }

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
                        active
                          ? "bg-raised font-semibold text-ink shadow-soft"
                          : "font-medium text-white/90 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <NavIcon icon={item.icon} />
                      <span className="min-w-0 flex-1 leading-snug break-words">
                        {item.label}
                      </span>
                      <NavBadge badge={item.badge} tone={item.badgeTone} />
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {user ? (
          <div className="mt-auto shrink-0 border-t border-subtleBorder/40 p-3">
            <div className="flex min-w-0 items-center gap-2.5 rounded-xl px-2 py-2">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-semibold text-white ring-1 ring-white/20"
                aria-hidden="true"
              >
                {initial}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{user.name}</p>
                <p className="truncate text-xs text-white/55">{user.email}</p>
              </div>
            </div>
          </div>
        ) : null}
      </aside>
    </>
  );
}

const SECTION_LABELS = {
  overview: "Overview",
  operations: "Operations",
  workspace: "Workspace",
} as const;

function NavBadge({
  badge,
  tone = "accent",
}: {
  badge?: string;
  tone?: NavItem["badgeTone"];
}) {
  if (!badge?.trim()) return null;
  const base =
    "ml-auto inline-flex shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums";
  if (tone === "success") {
    return (
      <span className={`${base} bg-emerald-100 text-emerald-800`}>{badge}</span>
    );
  }
  return <span className={`${base} bg-white/15 text-accent`}>{badge}</span>;
}

function groupBySection(items: NavItem[]) {
  const sectionOrder: Array<keyof typeof SECTION_LABELS> = [
    "overview",
    "operations",
    "workspace",
  ];
  return sectionOrder
    .map((section) =>
      [section, items.filter((item) => (item.section ?? "operations") === section)] as const
    )
    .filter(([, sectionItems]) => sectionItems.length > 0);
}

function NavIcon({
  icon,
  className = "",
}: {
  icon?: NavItem["icon"];
  className?: string;
}) {
  const common = `h-4 w-4 shrink-0 stroke-[1.5] ${className}`;
  switch (icon) {
    case "users":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1" />
          <circle cx="9" cy="7" r="3" />
          <path d="M22 19v-1a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "events":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4M8 3v4M3 11h18" />
        </svg>
      );
    case "rules":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M4 6h16M4 12h10M4 18h16" />
          <circle cx="16" cy="12" r="2" />
        </svg>
      );
    case "notifications":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 0 0-5-5.9V4a1 1 0 1 0-2 0v1.1A6 6 0 0 0 6 11v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 0 1-6 0" />
        </svg>
      );
    case "monitoring":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M4 19h16M7 15l3-3 2 2 5-6" />
        </svg>
      );
    case "activity":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M3 12h4l2-5 4 10 2-5h6" />
        </svg>
      );
    case "dashboard":
    default:
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M3 13h8V3H3v10Zm10 8h8V11h-8v10ZM3 21h8v-6H3v6Zm10-10h8V3h-8v8Z" />
        </svg>
      );
  }
}
