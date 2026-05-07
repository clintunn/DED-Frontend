"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthContext";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { Sidebar } from "./Sidebar";
import { getDashboardPageTitle } from "@/lib/dashboard-nav";

type DashboardLayoutProps = {
  children: React.ReactNode;
  /** Brand / logo label shown at the top of the sidebar */
  brand?: string;
};

export function DashboardLayout({
  children,
  brand = "Admin",
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const pageTitle = getDashboardPageTitle(pathname);
  const initial = user?.name?.charAt(0).toUpperCase() ?? "?";

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        brand={brand}
        open={sidebarOpen}
        onNavigate={() => setSidebarOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col md:pl-[17rem]">
        <header className="flex h-14 min-w-0 shrink-0 items-center justify-end gap-2 border-b border-subtleBorder/80 bg-raised px-4 sm:px-6">
          <button
            type="button"
            aria-label="Open menu"
            className="mr-auto shrink-0 rounded-md p-2 text-brand transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent md:hidden"
            onClick={() => setSidebarOpen((o) => !o)}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <div className="flex min-w-0 max-w-[100vw] shrink items-center gap-2 text-sm text-brand sm:gap-3">
            {user ? <NotificationCenter /> : null}
            <span className="hidden items-center gap-2 sm:flex">
              <span
                className="rounded-full bg-surface px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-brand"
                title="Your access level"
              >
                {user?.role ?? "—"}
              </span>
            </span>
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-xs font-medium text-white"
              aria-hidden="true"
            >
              {initial}
            </span>
            <span className="hidden max-w-[10rem] truncate sm:inline">
              {user?.name ?? "User"}
            </span>
            <button
              type="button"
              onClick={() => {
                logout();
                router.replace("/login");
              }}
              className="rounded-md px-2 py-1 text-xs font-medium text-brand transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Log out
            </button>
          </div>
        </header>
        <main className="min-w-0 flex-1 px-4 py-6 md:mr-8 md:ml-2 md:px-6 lg:mr-12 lg:px-8 lg:pb-12">
          <h1 className="break-words text-3xl font-semibold tracking-tight text-ink sm:text-[2rem] sm:leading-tight">
            {pageTitle}
          </h1>
          <div className="mt-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
