"use client";

import { useEffect, useState } from "react";
import { ErrorBanner } from "@/components/feedback/ErrorBanner";
import { LoadingState } from "@/components/feedback/LoadingState";
import { StatCard } from "@/components/dashboard/StatCard";
import { ApiError, getMonitoring, type MonitoringResponse } from "@/lib/api";
import type { MonitoringLogLevel } from "@/types";

const pill =
  "inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium uppercase tracking-wide";

function levelBadgeClass(level: MonitoringLogLevel): string {
  switch (level) {
    case "error":
      return `${pill} bg-[rgba(119,47,26,0.16)] text-critical`;
    case "warn":
      return `${pill} bg-[rgba(227,101,136,0.16)] text-accent`;
    case "info":
    default:
      return `${pill} bg-surface text-brand`;
  }
}

function MonitoringLoading() {
  return (
    <div className="space-y-8">
      <LoadingState variant="cards" label="Loading monitoring…" />
      <div className="space-y-3">
        <div className="h-5 w-32 animate-pulse rounded bg-surface" />
        <div className="h-48 animate-pulse rounded-lg border border-subtleBorder bg-surface" />
      </div>
    </div>
  );
}

export function MonitoringPageClient() {
  const [data, setData] = useState<MonitoringResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeLevel, setActiveLevel] = useState<MonitoringLogLevel | "all">("all");

  useEffect(() => {
    getMonitoring()
      .then((res) => {
        setData(res);
        setError(null);
      })
      .catch((e) => {
        setData(null);
        setError(
          e instanceof ApiError ? e.message : "Failed to load monitoring data."
        );
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <MonitoringLoading />;
  }

  const filteredLogs =
    activeLevel === "all"
      ? data?.logs ?? []
      : (data?.logs ?? []).filter((log) => log.level === activeLevel);

  return (
    <div className="space-y-6">
      <p className="text-sm text-brand">
        <strong className="text-ink">Admin-only</strong>{" "}
        operational metrics and service logs.
      </p>
      {error ? <ErrorBanner message={error} /> : null}
      {data ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total events processed"
              value={data.stats.totalEventsProcessed.value}
              trend={data.stats.totalEventsProcessed.delta}
              icon={<MetricIcon type="processed" />}
              tone="positive"
            />
            <StatCard
              title="Failed events"
              value={data.stats.failedEvents.value}
              trend={data.stats.failedEvents.delta}
              icon={<MetricIcon type="failed" />}
              tone="danger"
            />
            <StatCard
              title="Queue jobs waiting"
              value={data.stats.queueJobsWaiting.value}
              trend={data.stats.queueJobsWaiting.delta}
              icon={<MetricIcon type="queue" />}
            />
            <StatCard
              title="Jobs processed"
              value={data.stats.jobsProcessed.value}
              trend={data.stats.jobsProcessed.delta}
              icon={<MetricIcon type="jobs" />}
              tone="positive"
            />
          </div>

          <section className="rounded-2xl bg-raised p-4 shadow-soft ring-1 ring-subtleBorder/50 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-ink">Recent logs</h2>
              <div className="flex flex-wrap items-center gap-2">
                {(["all", "info", "warn", "error"] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setActiveLevel(level)}
                    className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                      activeLevel === level
                        ? "bg-accent text-white"
                        : "bg-surface text-brand hover:bg-background"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
            <ul className="mt-4">
              {filteredLogs.map((log) => (
                <li
                  key={log.id}
                  className="group flex flex-col gap-2 border-b border-subtleBorder py-3 transition-colors last:border-b-0 sm:flex-row sm:items-start sm:gap-4"
                >
                  <time
                    dateTime={log.at}
                    className="shrink-0 font-mono text-xs tabular-nums text-brand"
                  >
                    {new Date(log.at).toLocaleString()}
                  </time>
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                    <span className={levelBadgeClass(log.level)}>
                      {log.level}
                    </span>
                    <span className="font-mono text-sm break-words text-ink">
                      {log.message}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : null}
    </div>
  );
}

function MetricIcon({ type }: { type: "processed" | "failed" | "queue" | "jobs" }) {
  const common = "h-4 w-4";
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
  if (type === "queue") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeWidth="1.8" d="M4 6h16M4 12h16M4 18h10" />
      </svg>
    );
  }
  return (
    <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeWidth="1.8" d="M4 19h16M7 15l3-3 2 2 5-6" />
    </svg>
  );
}
