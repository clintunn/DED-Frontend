"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { RoleGate } from "@/components/auth/RoleGate";
import { StatCard } from "@/components/dashboard/StatCard";
import { ErrorBanner } from "@/components/feedback/ErrorBanner";
import { LoadingState } from "@/components/feedback/LoadingState";
import { ApiError } from "@/lib/api";
import {
  getHealth,
  getLive,
  getReady,
  getStatus,
  getVersion,
} from "@/lib/api/monitor";
import { adminPanelClass, adminSecondaryButtonCompact } from "@/lib/admin-form-classes";
import type {
  MonitorDependencyHealth,
  MonitorHealthResponse,
  MonitorLiveResponse,
  MonitorReadyResponse,
  MonitorStatusResponse,
  MonitorVersionResponse,
} from "@/types";

const PUBLIC_POLL_MS = 15_000;
const ADMIN_POLL_MS = 30_000;

function formatAt(ts?: string | null): string {
  if (!ts) return "Never";
  const parsed = new Date(ts);
  if (Number.isNaN(parsed.getTime())) return "Never";
  return parsed.toLocaleString();
}

function statusBadgeClass(status: string): string {
  const normalized = status.toLowerCase();
  if (normalized === "ok" || normalized === "healthy" || normalized === "ready") {
    return "rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700";
  }
  if (normalized === "degraded") {
    return "rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800";
  }
  return "rounded-full bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-700";
}

function sectionErrorMessage(e: unknown, fallback: string): string {
  return e instanceof ApiError ? e.message : fallback;
}

function dependencyNameLabel(key: string): string {
  return key.replace(/_/g, " ");
}

export function MonitorDashboardPageClient() {
  const { user, accessToken } = useAuth();
  const isAdmin = user?.role === "ORG_ADMIN";

  const [live, setLive] = useState<MonitorLiveResponse | null>(null);
  const [ready, setReady] = useState<MonitorReadyResponse | null>(null);
  const [version, setVersion] = useState<MonitorVersionResponse | null>(null);
  const [publicLoading, setPublicLoading] = useState(true);
  const [publicError, setPublicError] = useState<string | null>(null);
  const [lastUpdatedPublic, setLastUpdatedPublic] = useState<string | null>(null);

  const [health, setHealth] = useState<MonitorHealthResponse | null>(null);
  const [status, setStatus] = useState<MonitorStatusResponse | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [lastUpdatedAdmin, setLastUpdatedAdmin] = useState<string | null>(null);

  const publicHealthStatus = useMemo(() => {
    if (!ready) return "unknown";
    if (ready.ready) return "healthy";
    if (ready.status && ready.status.toLowerCase() === "degraded") return "degraded";
    return "down";
  }, [ready]);

  const loadPublic = useCallback(async (): Promise<void> => {
    try {
      const [nextLive, nextReady, nextVersion] = await Promise.all([
        getLive(),
        getReady(),
        getVersion(),
      ]);
      setLive(nextLive);
      setReady(nextReady);
      setVersion(nextVersion);
      setPublicError(null);
      setLastUpdatedPublic(new Date().toISOString());
    } catch (e) {
      setPublicError(sectionErrorMessage(e, "Failed to load public monitor data."));
    } finally {
      setPublicLoading(false);
    }
  }, []);

  const loadAdmin = useCallback(async (): Promise<void> => {
    if (!isAdmin || !accessToken) return;
    setAdminLoading(true);
    try {
      const [nextHealth, nextStatus] = await Promise.all([
        getHealth(accessToken),
        getStatus(accessToken),
      ]);
      setHealth(nextHealth);
      setStatus(nextStatus);
      setAdminError(null);
      setLastUpdatedAdmin(new Date().toISOString());
    } catch (e) {
      setAdminError(sectionErrorMessage(e, "Failed to load admin monitor data."));
    } finally {
      setAdminLoading(false);
    }
  }, [accessToken, isAdmin]);

  useEffect(() => {
    let cancelled = false;
    setPublicLoading(true);
    const run = async () => {
      if (cancelled) return;
      await loadPublic();
    };
    void run();
    const timer = setInterval(() => {
      void run();
    }, PUBLIC_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [loadPublic]);

  useEffect(() => {
    if (!isAdmin || !accessToken) return;
    let cancelled = false;
    const run = async () => {
      if (cancelled) return;
      await loadAdmin();
    };
    void run();
    const timer = setInterval(() => {
      void run();
    }, ADMIN_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [loadAdmin, isAdmin, accessToken]);

  return (
    <div className="space-y-6">
      <p className="text-sm text-brand">
        Service readiness and runtime status. Admin users can also inspect dependency and
        operational diagnostics.
      </p>

      <section className={adminPanelClass}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-ink">Public status</h2>
          <div className="flex items-center gap-2">
            <span className={statusBadgeClass(publicHealthStatus)}>{publicHealthStatus}</span>
            <span className="text-xs text-brand">
              Last updated: {formatAt(lastUpdatedPublic)}
            </span>
            <button
              type="button"
              onClick={() => void loadPublic()}
              className={adminSecondaryButtonCompact}
            >
              Retry
            </button>
          </div>
        </div>

        {publicError ? <ErrorBanner message={publicError} /> : null}
        {publicLoading ? (
          <div className="mt-4">
            <LoadingState variant="cards" label="Loading public monitor data…" />
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard title="Live status" value={live?.live ? 1 : 0} helper={live?.live ? "up" : "down"} />
            <StatCard
              title="Ready status"
              value={ready?.ready ? 1 : 0}
              helper={ready?.ready ? "healthy" : ready?.status ?? "degraded"}
            />
            <StatCard title="Environment" value={1} helper={version?.env ?? "unknown"} />
            <StatCard title="Version" value={1} helper={version?.version ?? "unknown"} />
            <StatCard title="Uptime (seconds)" value={Math.floor(version?.uptime ?? 0)} helper="runtime" />
            <StatCard title="Node version" value={1} helper={version?.node ?? "unknown"} />
          </div>
        )}
      </section>

      <RoleGate allow={["ORG_ADMIN"]}>
        <section className={adminPanelClass}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-ink">Admin diagnostics</h2>
            <div className="flex items-center gap-2">
              <span className={statusBadgeClass(health?.status ?? "unknown")}>
                {health?.status ?? "unknown"}
              </span>
              <span className="text-xs text-brand">
                Last updated: {formatAt(lastUpdatedAdmin)}
              </span>
              <button
                type="button"
                onClick={() => void loadAdmin()}
                className={adminSecondaryButtonCompact}
                disabled={!accessToken}
              >
                Retry
              </button>
            </div>
          </div>

          {adminError ? <ErrorBanner message={adminError} /> : null}
          {adminLoading && !health && !status ? (
            <div className="mt-4">
              <LoadingState variant="cards" label="Loading admin diagnostics…" />
            </div>
          ) : (
            <div className="mt-4 space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-ink">Dependencies</h3>
                <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {(
                    [
                      ["database", health?.dependencies.database],
                      ["redis", health?.dependencies.redis],
                      ["events_queue", health?.dependencies.events_queue],
                      ["memory_heap", health?.dependencies.memory_heap],
                    ] as const
                  ).map(([name, dep]) => (
                    <li
                      key={name}
                      className="rounded-xl bg-surface/70 px-4 py-3 ring-1 ring-subtleBorder/40"
                    >
                      <p className="text-xs font-medium uppercase tracking-wide text-brand">
                        {dependencyNameLabel(name)}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className={statusBadgeClass(dep?.status ?? "unknown")}>
                          {dep?.status ?? "unknown"}
                        </span>
                        <span className="text-xs text-brand">
                          latency:{" "}
                          {typeof (dep as MonitorDependencyHealth | undefined)?.latencyMs ===
                          "number"
                            ? `${dep?.latencyMs}ms`
                            : "n/a"}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-ink">Operational status</h3>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <StatCard
                    title="Queue waiting"
                    value={status?.queue.events.waiting ?? 0}
                    helper="queue.events.waiting"
                  />
                  <StatCard
                    title="Queue active"
                    value={status?.queue.events.active ?? 0}
                    helper="queue.events.active"
                  />
                  <StatCard
                    title="Queue delayed"
                    value={status?.queue.events.delayed ?? 0}
                    helper="queue.events.delayed"
                  />
                  <StatCard
                    title="Queue failed"
                    value={status?.queue.events.failed ?? 0}
                    tone="danger"
                    helper="queue.events.failed"
                  />
                  <StatCard
                    title="Queue completed"
                    value={status?.queue.events.completed ?? 0}
                    tone="positive"
                    helper="queue.events.completed"
                  />
                  <StatCard
                    title="Events stuck"
                    value={status?.events.stuck ?? 0}
                    tone="danger"
                    helper="events.stuck"
                  />
                  <StatCard
                    title="Events failed (1h)"
                    value={status?.events.failedLastHour ?? 0}
                    tone="danger"
                    helper="events.failedLastHour"
                  />
                  <StatCard
                    title="Notifications failed (1h)"
                    value={status?.notifications.failedLastHour ?? 0}
                    tone="danger"
                    helper="notifications.failedLastHour"
                  />
                </div>
                <p className="mt-3 text-xs text-brand">
                  worker.lastEventLogAt: {formatAt(status?.worker.lastEventLogAt ?? null)}
                </p>
              </div>
            </div>
          )}
        </section>
      </RoleGate>
    </div>
  );
}
