import { ApiError, getApiBaseUrl } from "@/lib/api";
import type {
  MonitorDependencyHealth,
  MonitorHealthResponse,
  MonitorLiveResponse,
  MonitorQueueEventsStatus,
  MonitorReadyResponse,
  MonitorStatusResponse,
  MonitorVersionResponse,
} from "@/types";

function pickObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function pickString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function pickNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function pickBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function pickOptionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

async function monitorFetch<T>(path: string, token?: string): Promise<T> {
  const url = `${getApiBaseUrl()}${path}`;
  const headers: HeadersInit = {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  let res: Response;
  try {
    res = await fetch(url, { method: "GET", headers });
  } catch (e) {
    throw new ApiError(e instanceof Error ? e.message : "Network error", 0);
  }

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      if (!res.ok) {
        throw new ApiError(`Invalid JSON response (${res.status})`, res.status);
      }
    }
  }
  if (!res.ok) {
    const obj = pickObject(data);
    const message = pickString(obj?.error ?? obj?.message, `Request failed (${res.status})`);
    throw new ApiError(message, res.status, data);
  }
  if (pickObject(data) && "data" in (data as Record<string, unknown>)) {
    return (data as { data: T }).data;
  }
  return data as T;
}

function normalizeLive(payload: unknown): MonitorLiveResponse {
  const obj = pickObject(payload);
  return {
    live: pickBoolean(obj?.live ?? obj?.ok, true),
    at: pickOptionalString(obj?.at ?? obj?.timestamp),
  };
}

function normalizeReady(payload: unknown): MonitorReadyResponse {
  const obj = pickObject(payload);
  return {
    ready: pickBoolean(obj?.ready ?? obj?.ok, false),
    status: pickString(obj?.status, "degraded"),
    at: pickOptionalString(obj?.at ?? obj?.timestamp),
  };
}

function normalizeVersion(payload: unknown): MonitorVersionResponse {
  const obj = pickObject(payload);
  return {
    env: pickString(obj?.env, "unknown"),
    version: pickString(obj?.version, "unknown"),
    uptime: pickNumber(obj?.uptime, 0),
    node: pickString(obj?.node ?? obj?.nodeVersion, "unknown"),
    at: pickOptionalString(obj?.at ?? obj?.timestamp),
  };
}

function normalizeDependency(payload: unknown): MonitorDependencyHealth {
  const obj = pickObject(payload);
  return {
    status: pickString(obj?.status, "unknown"),
    latencyMs:
      typeof obj?.latencyMs === "number" && Number.isFinite(obj.latencyMs)
        ? obj.latencyMs
        : undefined,
    details: typeof obj?.details === "string" ? obj.details : undefined,
  };
}

function normalizeHealth(payload: unknown): MonitorHealthResponse {
  const obj = pickObject(payload);
  const deps = pickObject(obj?.dependencies);
  return {
    status: pickString(obj?.status, "unknown"),
    dependencies: {
      database: normalizeDependency(deps?.database),
      redis: normalizeDependency(deps?.redis),
      events_queue: normalizeDependency(deps?.events_queue),
      memory_heap: normalizeDependency(deps?.memory_heap),
    },
    at: typeof obj?.at === "string" ? obj.at : undefined,
  };
}

function normalizeQueueEvents(payload: unknown): MonitorQueueEventsStatus {
  const obj = pickObject(payload);
  return {
    waiting: pickNumber(obj?.waiting, 0),
    active: pickNumber(obj?.active, 0),
    delayed: pickNumber(obj?.delayed, 0),
    failed: pickNumber(obj?.failed, 0),
    completed: pickNumber(obj?.completed, 0),
  };
}

function normalizeStatus(payload: unknown): MonitorStatusResponse {
  const obj = pickObject(payload);
  const queue = pickObject(obj?.queue);
  const events = pickObject(obj?.events);
  const notifications = pickObject(obj?.notifications);
  const worker = pickObject(obj?.worker);
  return {
    queue: {
      events: normalizeQueueEvents(pickObject(queue?.events)),
    },
    events: {
      stuck: pickNumber(events?.stuck, 0),
      failedLastHour: pickNumber(events?.failedLastHour, 0),
    },
    notifications: {
      failedLastHour: pickNumber(notifications?.failedLastHour, 0),
    },
    worker: {
      lastEventLogAt:
        typeof worker?.lastEventLogAt === "string" ? worker.lastEventLogAt : null,
    },
    at: typeof obj?.at === "string" ? obj.at : undefined,
  };
}

export async function getLive(): Promise<MonitorLiveResponse> {
  const payload = await monitorFetch<unknown>("/monitor/live");
  return normalizeLive(payload);
}

export async function getReady(): Promise<MonitorReadyResponse> {
  const payload = await monitorFetch<unknown>("/monitor/ready");
  return normalizeReady(payload);
}

export async function getVersion(): Promise<MonitorVersionResponse> {
  const payload = await monitorFetch<unknown>("/monitor/version");
  return normalizeVersion(payload);
}

export async function getHealth(token: string): Promise<MonitorHealthResponse> {
  const payload = await monitorFetch<unknown>("/monitor/health", token);
  return normalizeHealth(payload);
}

export async function getStatus(token: string): Promise<MonitorStatusResponse> {
  const payload = await monitorFetch<unknown>("/monitor/status", token);
  return normalizeStatus(payload);
}
