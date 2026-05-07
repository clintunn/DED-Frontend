"use client";

import { useEffect, useState } from "react";
import { ErrorBanner } from "@/components/feedback/ErrorBanner";
import { LoadingState } from "@/components/feedback/LoadingState";
import {
  ApiError,
  getDashboardMetrics,
  type DashboardMetrics,
} from "@/lib/api";
import { useAuth } from "@/components/auth/AuthContext";
import { StatCard } from "./StatCard";

export function DashboardPageClient() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDashboardMetrics()
      .then((m) => {
        setData(m);
        setError(null);
      })
      .catch((e) => {
        setData(null);
        setError(
          e instanceof ApiError ? e.message : "Failed to load dashboard metrics."
        );
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <LoadingState variant="cards" label="Loading dashboard…" />;
  }

  return (
    <div className="space-y-6">
      {user?.role === "USER" ? (
        <p className="rounded-2xl bg-surface/80 px-4 py-3 text-sm leading-relaxed break-words text-brand shadow-sm ring-1 ring-subtleBorder/35">
          Signed in as a <strong className="font-semibold text-ink">user</strong>. You can open
          Dashboard, Events, and Notifications. Rules and Monitoring are available to administrators
          only.
        </p>
      ) : null}
      {user?.role === "ORG_ADMIN" ? (
        <p className="rounded-2xl bg-surface/80 px-4 py-3 text-sm leading-relaxed break-words text-brand shadow-sm ring-1 ring-subtleBorder/35">
          <strong className="font-semibold text-ink">Administrator</strong> view: all sections and
          configuration tools are enabled.
        </p>
      ) : null}
      {error ? <ErrorBanner message={error} /> : null}
      {data ? (
        <>
          <section className="rounded-2xl bg-raised p-6 shadow-soft ring-1 ring-subtleBorder/35 sm:p-8">
            <p className="text-sm font-medium text-brand">Overview</p>
            <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
              <div className="lg:col-span-7">
                <StatCard
                  title="Total Events"
                  value={data.totalEvents.value}
                  trend={data.totalEvents.delta}
                  variant="hero"
                  helper="vs last 7 days"
                  icon={<MetricIcon type="events" />}
                  inset
                />
              </div>
              <div className="flex flex-col gap-8 border-t border-subtleBorder/45 pt-8 lg:col-span-5 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
                <StatCard
                  title="Processed Events"
                  value={data.processedEvents.value}
                  trend={data.processedEvents.delta}
                  tone="positive"
                  valueEmphasis="secondary"
                  helper="vs last 7 days"
                  icon={<MetricIcon type="processed" />}
                  inset
                />
                <StatCard
                  title="Failed Events"
                  value={data.failedEvents.value}
                  trend={data.failedEvents.delta}
                  tone="danger"
                  valueEmphasis="secondary"
                  helper="lower is healthier"
                  icon={<MetricIcon type="failed" />}
                  inset
                />
              </div>
            </div>
            <div className="mt-10 border-t border-subtleBorder/45 pt-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-ink">Activity</h2>
                <span className="rounded-full bg-accent/15 px-2.5 py-1 text-xs font-medium text-accent">
                  Live
                </span>
              </div>
              <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard
                  title="Notifications"
                  value={data.notificationsCount.value}
                  trend={data.notificationsCount.delta}
                  valueEmphasis="secondary"
                  helper="vs last 7 days"
                  icon={<MetricIcon type="notifications" />}
                  inset
                />
                <div className="rounded-xl bg-surface/60 px-4 py-4 ring-1 ring-subtleBorder/30">
                  <p className="text-sm font-medium text-brand">Focus</p>
                  <p className="mt-2 text-sm leading-relaxed text-ink">
                    Review failed-event spikes and notification queue health to keep delivery SLAs
                    stable.
                  </p>
                </div>
                <div className="rounded-xl bg-surface/60 px-4 py-4 ring-1 ring-subtleBorder/30">
                  <p className="text-sm font-medium text-brand">Next step</p>
                  <p className="mt-2 text-sm leading-relaxed text-ink">
                    Audit the latest processing failures and retry policies in Monitoring.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

function MetricIcon({
  type,
}: {
  type: "events" | "processed" | "failed" | "notifications";
}) {
  const common = "h-4 w-4";
  if (type === "events") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeWidth="1.8" d="M4 19h16M7 15l3-3 2 2 5-6" />
      </svg>
    );
  }
  if (type === "processed") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeWidth="1.8" d="m5 13 4 4L19 7" />
      </svg>
    );
  }
  if (type === "failed") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeWidth="1.8" d="m18 6-12 12M6 6l12 12" />
      </svg>
    );
  }
  return (
    <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path
        strokeWidth="1.8"
        d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 0 0-5-5.9V4a1 1 0 1 0-2 0v1.1A6 6 0 0 0 6 11v3.2c0 .5-.2 1-.6 1.4L4 17h5"
      />
    </svg>
  );
}
