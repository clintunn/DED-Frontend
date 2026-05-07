"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, getNotifications } from "@/lib/api";
import { adminSecondaryButtonCompact } from "@/lib/admin-form-classes";
import { notificationPriorityCopy, notificationStatusCopy } from "@/lib/notification-copy";
import type { NotificationRecord } from "@/types";

const POLL_MS = 45_000;
const DROP_PREVIEW_LIMIT = 12;

function statusPillClass(status: NotificationRecord["status"]): string {
  const pill =
    "inline-flex shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums";
  switch (status) {
    case "SENT":
      return `${pill} bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200`;
    case "FAILED":
      return `${pill} bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200`;
    default:
      return `${pill} bg-surface text-brand`;
  }
}

function priorityTone(p: NotificationRecord["priority"]): string {
  switch (p) {
    case "HIGH":
      return "text-red-700 dark:text-red-300";
    case "MEDIUM":
      return "text-amber-800 dark:text-amber-200";
    default:
      return "text-brand";
  }
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const next = await getNotifications();
      setItems(next);
    } catch {
      /* keep previous list on transient errors */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const next = await getNotifications();
        if (!cancelled) setItems(next);
      } catch (e) {
        if (!cancelled && e instanceof ApiError && e.status === 401) setItems([]);
      }
    }
    void run();

    const onVis = () => {
      if (document.visibilityState === "visible") void run();
    };
    document.addEventListener("visibilitychange", onVis);
    const pollId = setInterval(() => void run(), POLL_MS);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
      clearInterval(pollId);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    void refresh();
    function onMouseDown(ev: MouseEvent) {
      if (!rootRef.current?.contains(ev.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open, refresh]);

  const pendingCount = items.filter((n) => n.status === "PENDING").length;

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`Notifications${pendingCount ? `, ${pendingCount} pending delivery` : ""}`}
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg p-2 text-brand transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M15 17h5l-2-5V9a6 6 0 10-12 0v3l-2 5h5m4 0v1a3 3 0 01-6 0v-1"
          />
        </svg>
        {pendingCount > 0 ? (
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-raised" />
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-subtleBorder bg-raised p-3 shadow-soft ring-1 ring-subtleBorder/50 dark:ring-subtleBorder/35">
          <div className="flex items-center justify-between gap-2 border-b border-subtleBorder pb-2">
            <p className="text-sm font-semibold text-ink">Notifications</p>
            <button type="button" onClick={() => void refresh()} className={adminSecondaryButtonCompact}>
              {loading ? "…" : "Refresh"}
            </button>
          </div>
          <ul className="max-h-[min(24rem,60vh)] space-y-2 overflow-y-auto py-2" role="list">
            {items.length === 0 ? (
              <li className="px-1 py-3 text-center text-sm text-brand">No notifications yet.</li>
            ) : (
              items.slice(0, DROP_PREVIEW_LIMIT).map((n) => (
                <li
                  key={n.id}
                  className="rounded-xl border border-subtleBorder bg-surface/80 p-2.5 text-sm dark:bg-surface/40"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <span className={statusPillClass(n.status)} title={n.status}>
                      {notificationStatusCopy(n.status)}
                    </span>
                    <span className={`text-[11px] font-medium uppercase ${priorityTone(n.priority)}`}>
                      {notificationPriorityCopy(n.priority)}
                    </span>
                  </div>
                  <p className="mt-1.5 text-ink break-words leading-snug">{n.message}</p>
                  <p className="mt-1 text-[11px] tabular-nums text-brand">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                  {n.user?.email ? (
                    <p className="mt-0.5 truncate text-[11px] text-brand" title={n.user.email}>
                      To: {n.user.email}
                    </p>
                  ) : null}
                  {n.eventId ? (
                    <Link
                      href={`/events/monitor?eventId=${encodeURIComponent(n.eventId)}`}
                      className="mt-2 inline-block text-xs font-medium text-brand underline underline-offset-2 hover:text-ink"
                    >
                      View event
                    </Link>
                  ) : null}
                </li>
              ))
            )}
          </ul>
          <div className="border-t border-subtleBorder pt-2">
            <Link
              href="/notifications"
              className="block text-center text-xs font-medium text-brand hover:text-ink"
              onClick={() => setOpen(false)}
            >
              View all notifications
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
