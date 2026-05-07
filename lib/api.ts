import { monitoringStats } from "@/lib/monitoring-mock";
import type {
  ActionType,
  EventLog,
  EventType,
  GetEventsParams,
  GetMyEventsParams,
  EventRecord,
  PaginatedEventsResponse,
  MonitoringLog,
  NotificationPriority,
  NotificationRecord,
  NotificationStatus,
  NotificationUserRef,
  Organization,
  PaginatedRulesResponse,
  Rule,
  RuleAction,
  CreateEventPayload,
  UpdateEventPayload,
} from "@/types";

export type DashboardMetricValue = {
  value: number;
  delta: number;
};

export type DashboardMetrics = {
  totalEvents: DashboardMetricValue;
  processedEvents: DashboardMetricValue;
  failedEvents: DashboardMetricValue;
  notificationsCount: DashboardMetricValue;
};

export type MonitoringResponse = {
  stats: typeof monitoringStats;
  logs: MonitoringLog[];
};

type AccessTokenGetter = () => string | null;
let accessTokenGetter: AccessTokenGetter = () => null;

export function setAccessTokenGetter(getter: AccessTokenGetter): void {
  accessTokenGetter = getter;
}

/**
 * Base URL for the real backend (auth, invites, etc.).
 * Override with `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_API_URL`, or `VITE_API_URL`.
 * Defaults to `http://localhost:3000` when unset.
 */
export function getApiBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.VITE_API_URL ||
    "http://localhost:3000";
  return raw.replace(/\/$/, "");
}

/**
 * Base URL for this Next.js app's `/api/*` Route Handlers (mock data). Not the backend host.
 * - **Browser:** `window.location.origin` (mock routes are same-origin as the app).
 * - **Server/SSR:** set `NEXT_PUBLIC_APP_URL` (or `NEXT_PUBLIC_APP_ORIGIN`); else `https://${VERCEL_URL}` on Vercel; else `http://localhost:3000`.
 */
function getDataApiBaseUrl(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  const explicit =
    process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_ORIGIN;
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`.replace(/\/$/, "");
  }
  return "http://localhost:3000";
}

function joinUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  const base = p.startsWith("/api/") ? getDataApiBaseUrl() : getApiBaseUrl();
  return `${base}${p}`;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body: unknown = null
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ApiFetchOptions = {
  requireAuth?: boolean;
  accessToken?: string;
};

function messageFromStatus(status: number, fallback: string, requestPath: string): string {
  if (status === 400) return "Please review your input and try again.";
  if (status === 401) return "Your session has expired. Please log in again.";
  if (status === 403) return "You do not have permission to perform this action.";
  if (status === 409) {
    if (requestPath === "/rule" || requestPath.startsWith("/rule/")) {
      return "An active rule already exists for this event type.";
    }
    return "This email is already in use.";
  }
  return fallback;
}

function pickHttpErrorMessage(data: unknown): string | undefined {
  if (!data || typeof data !== "object" || data === null) return undefined;
  const o = data as Record<string, unknown>;
  const err = o.error ?? o.message;
  if (typeof err === "string" && err.trim()) return err.trim();
  return undefined;
}

async function apiFetch<T>(
  path: string,
  init?: RequestInit,
  options?: ApiFetchOptions
): Promise<T> {
  const url = joinUrl(path);
  const token = options?.accessToken ?? accessTokenGetter();
  const headers: HeadersInit = {
    Accept: "application/json",
    ...(init?.body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...init?.headers,
  };
  if (options?.requireAuth && !token) {
    throw new ApiError("You are not authenticated.", 401);
  }

  let res: Response;
  try {
    res = await fetch(url, { ...init, headers });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network error";
    throw new ApiError(msg, 0);
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
    const msg =
      pickHttpErrorMessage(data) ??
      messageFromStatus(res.status, `Request failed (${res.status})`, path);
    throw new ApiError(msg, res.status, data);
  }

  // Backend commonly returns an envelope:
  // { statusCode, success, message, data: <payload>, timestamp }
  // Unwrap to keep API helpers typed as the inner payload.
  //
  // Do **not** unwrap `{ data: Rule[], page, limit, total }` — callers need pagination fields.
  if (
    data &&
    typeof data === "object" &&
    data !== null &&
    "data" in data
  ) {
    const envelope = data as Record<string, unknown>;
    const inner = envelope.data;
    const isPaginatedListEnvelope =
      Array.isArray(inner) &&
      ("page" in envelope || "limit" in envelope || "total" in envelope);
    if (!isPaginatedListEnvelope) {
      return (data as { data: T }).data;
    }
  }

  return data as T;
}

function pickRecordString(record: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = record[k];
    if (v != null && String(v).trim() !== "") return String(v);
  }
  return undefined;
}

function dedupeActionTypeIdsPreserveOrder(ids: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of ids) {
    const id = raw.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

function parseRuleActionsFromRow(row: Record<string, unknown>, ruleId: string): RuleAction[] | undefined {
  const raw = row.ruleActions;
  if (!Array.isArray(raw)) return undefined;
  const list: RuleAction[] = [];

  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const raId = pickRecordString(o, "id") ?? `${ruleId}-ra-${i}`;
    let sortOrder = i;
    if (typeof o.sortOrder === "number" && Number.isFinite(o.sortOrder)) sortOrder = o.sortOrder;

    const atRaw = o.actionType;
    if (!atRaw || typeof atRaw !== "object") continue;
    const at = atRaw as Record<string, unknown>;
    const atId = pickRecordString(at, "id");
    if (!atId) continue;
    const atName = pickRecordString(at, "name") ?? atId;
    let description: string | null | undefined;
    if (typeof at.description === "string") description = at.description;
    else if (at.description != null) description = String(at.description);

    list.push({
      id: raId,
      sortOrder,
      actionType: {
        id: atId,
        name: atName,
        ...(description !== undefined ? { description } : {}),
      },
    });
  }

  if (list.length === 0) return undefined;
  return [...list].sort((a, b) => a.sortOrder - b.sortOrder);
}

function synthesizeRuleActionsFromLegacyIds(ruleId: string, actionIds: string[]): RuleAction[] {
  return actionIds.map((actionTypeId, i) => ({
    id: `${ruleId}-ra-${i}`,
    sortOrder: i,
    actionType: { id: actionTypeId, name: actionTypeId },
  }));
}

function normalizeRuleFromApi(raw: unknown): Rule | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = pickRecordString(row, "id");
  if (!id) return null;

  const parsedFromApi = parseRuleActionsFromRow(row, id);

  const legacyFlat = dedupeActionTypeIdsPreserveOrder(
    (() => {
      const arrRaw = row.actionTypeIds;
      if (Array.isArray(arrRaw)) {
        return arrRaw.map((item) => String(item));
      }
      const legacySingle = pickRecordString(row, "actionTypeId");
      return legacySingle ? [legacySingle] : [];
    })()
  );

  let ruleActions: RuleAction[] | undefined =
    parsedFromApi && parsedFromApi.length > 0 ? parsedFromApi : undefined;
  if (!ruleActions?.length && legacyFlat.length > 0) {
    ruleActions = synthesizeRuleActionsFromLegacyIds(id, legacyFlat);
  }

  const eventTypeId = pickRecordString(row, "eventTypeId") ?? "";
  const name = pickRecordString(row, "name") ?? "";

  let isActive = true;
  if (typeof row.isActive === "boolean") {
    isActive = row.isActive;
  }

  return {
    id,
    name,
    eventTypeId,
    ruleActions,
    isActive,
  };
}

function normalizePaginatedRulesPayload(payload: unknown): PaginatedRulesResponse {
  const emptyList: PaginatedRulesResponse = {
    items: [],
    page: 1,
    limit: 10,
    total: 0,
  };
  if (payload == null) {
    return emptyList;
  }
  // After envelope unwrap, some backends return a bare rules array.
  if (Array.isArray(payload)) {
    const items = payload
      .map((r) => normalizeRuleFromApi(r))
      .filter((rule): rule is Rule => Boolean(rule));
    return {
      items,
      page: 1,
      limit: Math.max(items.length, 10),
      total: items.length,
    };
  }
  if (typeof payload !== "object") {
    return emptyList;
  }
  const obj = payload as Record<string, unknown>;
  let rows: unknown[];
  let page = 1;
  let limit = 10;
  let total = 0;

  if (Array.isArray(obj.items)) {
    rows = obj.items;
    page = typeof obj.page === "number" ? obj.page : 1;
    limit =
      typeof obj.limit === "number" ? obj.limit : Math.max(rows.length, 10);
    total = typeof obj.total === "number" ? obj.total : rows.length;
  } else if (Array.isArray(obj.data)) {
    rows = obj.data as unknown[];
    page = typeof obj.page === "number" ? obj.page : 1;
    limit =
      typeof obj.limit === "number" ? obj.limit : Math.max(rows.length, 10);
    total = typeof obj.total === "number" ? obj.total : rows.length;
  } else {
    return emptyList;
  }

  const items = rows
    .map((r) => normalizeRuleFromApi(r))
    .filter((rule): rule is Rule => Boolean(rule));

  return { items, page, limit, total };
}

function toQueryString(params?: Record<string, string | number | boolean | undefined>): string {
  if (!params) return "";
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (typeof value !== "undefined") {
      query.set(key, String(value));
    }
  });
  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Backend paginated lists use `{ data: Event[], page, limit, total }` after envelope handling;
 * the app expects `{ items: Event[], page, limit, total }`.
 */
function normalizePaginatedEventsPayload(payload: unknown): PaginatedEventsResponse {
  const empty: PaginatedEventsResponse = {
    items: [],
    page: 1,
    limit: 10,
    total: 0,
  };
  if (payload == null || typeof payload !== "object") {
    return empty;
  }
  const obj = payload as Record<string, unknown>;
  const page = typeof obj.page === "number" ? obj.page : 1;
  const limit = typeof obj.limit === "number" ? obj.limit : 10;
  const totalFromApi = typeof obj.total === "number" ? obj.total : 0;

  const rows: unknown[] = Array.isArray(obj.items)
    ? obj.items
    : Array.isArray(obj.data)
      ? obj.data
      : [];

  const items = rows.filter((row): row is EventRecord => isEventRecordRow(row));

  return {
    items,
    page,
    limit,
    total: totalFromApi > 0 ? totalFromApi : items.length,
  };
}

function isEventRecordRow(row: unknown): row is EventRecord {
  if (!row || typeof row !== "object") return false;
  const o = row as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.eventTypeId === "string" &&
    typeof o.status === "string" &&
    typeof o.createdAt === "string" &&
    typeof o.userId === "string" &&
    typeof o.payload === "object" &&
    o.payload !== null
  );
}

function isEventLogRow(row: unknown): row is EventLog {
  if (!row || typeof row !== "object") return false;
  const o = row as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.message === "string" &&
    typeof o.createdAt === "string" &&
    typeof o.eventId === "string" &&
    typeof o.organizationId === "string"
  );
}

function normalizeEventDetailPayload(payload: unknown): EventRecord {
  if (!payload || typeof payload !== "object") {
    throw new ApiError("Invalid event response.", 500);
  }
  const row = payload as Record<string, unknown>;
  const logsRaw = Array.isArray(row.logs) ? row.logs : [];
  const logs = logsRaw.filter((item): item is EventLog => isEventLogRow(item));
  const base = row as unknown as EventRecord;
  return {
    ...base,
    logs,
    organizationId:
      typeof row.organizationId === "string" ? row.organizationId : undefined,
  };
}

export async function getEvents(params?: GetEventsParams): Promise<PaginatedEventsResponse> {
  const payload = await apiFetch<unknown>(
    `/events${toQueryString(params)}`,
    { method: "GET" },
    { requireAuth: true }
  );
  return normalizePaginatedEventsPayload(payload);
}

export async function getMyEvents(
  params?: GetMyEventsParams
): Promise<PaginatedEventsResponse> {
  const payload = await apiFetch<unknown>(
    `/events/my${toQueryString(params)}`,
    { method: "GET" },
    { requireAuth: true }
  );
  return normalizePaginatedEventsPayload(payload);
}

export function getEventById(id: string): Promise<EventRecord> {
  return apiFetch<unknown>(`/events/${id}`, { method: "GET" }, { requireAuth: true }).then(
    (payload) => normalizeEventDetailPayload(payload)
  );
}

function parseNotificationPriority(v: unknown): NotificationPriority {
  const s = String(v ?? "").toUpperCase();
  if (s === "HIGH" || s === "MEDIUM" || s === "LOW") return s;
  return "MEDIUM";
}

function parseNotificationStatus(v: unknown): NotificationStatus {
  const s = String(v ?? "").toUpperCase();
  if (s === "PENDING" || s === "SENT" || s === "FAILED") return s;
  return "PENDING";
}

function normalizeNotificationRow(row: unknown): NotificationRecord | null {
  if (!row || typeof row !== "object") return null;
  const o = row as Record<string, unknown>;
  const id = pickRecordString(o, "id");
  const createdAt = pickRecordString(o, "createdAt");
  const message =
    typeof o.message === "string"
      ? o.message
      : o.message != null
        ? String(o.message)
        : "";
  if (!id || !createdAt) return null;

  let user: NotificationUserRef | undefined;
  const uRaw = o.user;
  if (uRaw && typeof uRaw === "object") {
    const u = uRaw as Record<string, unknown>;
    const uid = pickRecordString(u, "id");
    if (uid) {
      user = {
        id: uid,
        name: typeof u.name === "string" ? u.name : u.name != null ? String(u.name) : undefined,
        email: typeof u.email === "string" ? u.email : u.email != null ? String(u.email) : undefined,
      };
    }
  }

  const eventId =
    typeof o.eventId === "string" && o.eventId.trim() !== "" ? o.eventId.trim() : undefined;

  const rec: NotificationRecord = {
    id,
    message,
    priority: parseNotificationPriority(o.priority),
    status: parseNotificationStatus(o.status),
    createdAt,
    ...(user ? { user } : {}),
    ...(eventId ? { eventId } : {}),
  };
  return rec;
}

function normalizeNotificationsPayload(payload: unknown): NotificationRecord[] {
  let rows: unknown[] = [];
  if (Array.isArray(payload)) {
    rows = payload;
  } else if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.data)) rows = obj.data as unknown[];
    else if (Array.isArray(obj.items)) rows = obj.items as unknown[];
  }

  const list = rows
    .map(normalizeNotificationRow)
    .filter((n): n is NotificationRecord => Boolean(n));

  return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getNotifications(): Promise<NotificationRecord[]> {
  const raw = await apiFetch<unknown>(
    "/notification",
    { method: "GET" },
    { requireAuth: true }
  );
  return normalizeNotificationsPayload(raw);
}

export type GetRulesParams = {
  page?: number;
  limit?: number;
  isActive?: boolean;
};

export function getEventTypes(): Promise<EventType[]> {
  return apiFetch<EventType[]>(
    "/events/event-types",
    { method: "GET" },
    { requireAuth: true }
  );
}

export function getActionTypes(): Promise<ActionType[]> {
  return apiFetch<ActionType[]>("/action", { method: "GET" }, { requireAuth: true });
}

export async function getRules(params?: GetRulesParams): Promise<PaginatedRulesResponse> {
  const payload = await apiFetch<unknown>(
    `/rule${toQueryString(params)}`,
    { method: "GET" },
    { requireAuth: true }
  );
  return normalizePaginatedRulesPayload(payload);
}

function metric(value: number): DashboardMetricValue {
  return {
    value: Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0,
    delta: 0,
  };
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const token = accessTokenGetter() ?? undefined;
  const [eventsResult, notificationsResult, statusResult] = await Promise.allSettled([
    getEvents({ page: 1, limit: 1 }),
    getNotifications(),
    token
      ? import("@/lib/api/monitor").then((m) => m.getStatus(token))
      : Promise.reject(new ApiError("You are not authenticated.", 401)),
  ]);

  const totalEvents = eventsResult.status === "fulfilled" ? eventsResult.value.total : 0;
  const notificationsCount =
    notificationsResult.status === "fulfilled" ? notificationsResult.value.length : 0;
  const processedEvents =
    statusResult.status === "fulfilled" ? statusResult.value.queue.events.completed : 0;
  const failedEvents =
    statusResult.status === "fulfilled"
      ? (statusResult.value.events.failedLastHour || statusResult.value.queue.events.failed)
      : 0;

  return {
    totalEvents: metric(totalEvents),
    processedEvents: metric(processedEvents),
    failedEvents: metric(failedEvents),
    notificationsCount: metric(notificationsCount),
  };
}

export function getMonitoring(): Promise<MonitoringResponse> {
  return apiFetch<MonitoringResponse>("/api/monitoring");
}

export function createEvent(payload: CreateEventPayload): Promise<EventRecord> {
  return apiFetch<EventRecord>(
    "/events",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    { requireAuth: true }
  );
}

export function updateEvent(
  id: string,
  payload: UpdateEventPayload
): Promise<EventRecord> {
  return apiFetch<EventRecord>(
    `/events/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    { requireAuth: true }
  );
}

export function deleteEvent(id: string): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(
    `/events/${id}`,
    { method: "DELETE" },
    { requireAuth: true }
  );
}

export type CreateRulePayload = {
  name: string;
  eventTypeId: string;
  /** One or more actions to run for this event type */
  actionTypeIds: string[];
  isActive?: boolean;
};

function serializeRuleMutationBody(payload: Record<string, unknown>): string {
  return JSON.stringify(payload);
}

export async function createRule(payload: CreateRulePayload): Promise<Rule> {
  const actionTypeIds = dedupeActionTypeIdsPreserveOrder(payload.actionTypeIds);
  if (actionTypeIds.length === 0) {
    throw new ApiError("At least one action type is required.", 400);
  }
  const bodyPayload: Record<string, unknown> = {
    name: payload.name,
    eventTypeId: payload.eventTypeId,
    actionTypeIds,
    isActive: payload.isActive ?? true,
  };
  const body = serializeRuleMutationBody(bodyPayload);
  const raw = await apiFetch<unknown>(
    "/rule",
    {
      method: "POST",
      body,
    },
    { requireAuth: true }
  );
  const rule = normalizeRuleFromApi(raw);
  if (!rule) throw new ApiError("Invalid rule response.", 500);
  return rule;
}

export type UpdateRulePayload = {
  name?: string;
  eventTypeId?: string;
  actionTypeIds?: string[];
  isActive?: boolean;
};

export async function getRuleById(id: string): Promise<Rule> {
  const raw = await apiFetch<unknown>(`/rule/${id}`, { method: "GET" }, { requireAuth: true });
  const rule = normalizeRuleFromApi(raw);
  if (!rule) throw new ApiError("Invalid rule response.", 500);
  return rule;
}

export async function updateRule(id: string, payload: UpdateRulePayload): Promise<Rule> {
  const trimmedIds =
    typeof payload.actionTypeIds !== "undefined"
      ? dedupeActionTypeIdsPreserveOrder(payload.actionTypeIds)
      : undefined;
  const bodyPayload: Record<string, unknown> = {};
  if (typeof payload.name !== "undefined") bodyPayload.name = payload.name;
  if (typeof payload.eventTypeId !== "undefined") {
    bodyPayload.eventTypeId = payload.eventTypeId;
  }
  if (typeof payload.isActive !== "undefined") {
    bodyPayload.isActive = payload.isActive;
  }
  if (typeof trimmedIds !== "undefined") {
    if (trimmedIds.length === 0) {
      throw new ApiError("At least one action type is required.", 400);
    }
    bodyPayload.actionTypeIds = trimmedIds;
  }

  const raw = await apiFetch<unknown>(
    `/rule/${id}`,
    {
      method: "PATCH",
      body: serializeRuleMutationBody(bodyPayload),
    },
    { requireAuth: true }
  );
  const rule = normalizeRuleFromApi(raw);
  if (!rule) throw new ApiError("Invalid rule response.", 500);
  return rule;
}

export function deleteRule(id: string): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(
    `/rule/${id}`,
    { method: "DELETE" },
    { requireAuth: true }
  );
}

export type BackendRole = "ORG_ADMIN" | "USER";

export type BackendUser = {
  id: string;
  name: string;
  email: string;
  role: BackendRole;
};

export type RegisterFoundationPayload = {
  organizationName: string;
  email: string;
  password: string;
};

export type RegisterFoundationResponse = {
  accessToken: string;
  user: BackendUser;
  organization: Organization;
};

export function registerFoundation(
  payload: RegisterFoundationPayload
): Promise<RegisterFoundationResponse> {
  return apiFetch<RegisterFoundationResponse>("/auth/register-foundation", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  user: BackendUser;
};

export function login(payload: LoginPayload): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export type ForgotPasswordResponse = {
  ok: true;
  token?: string;
};

export function forgotPassword(email: string): Promise<ForgotPasswordResponse> {
  return apiFetch<ForgotPasswordResponse>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export type ResetPasswordResponse = {
  ok: true;
};

export function resetPassword(
  token: string,
  newPassword: string
): Promise<ResetPasswordResponse> {
  return apiFetch<ResetPasswordResponse>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, newPassword }),
  });
}

export type ChangePasswordResponse = {
  ok: true;
};

export function changePassword(
  currentPassword: string,
  newPassword: string,
  accessToken: string
): Promise<ChangePasswordResponse> {
  return apiFetch<ChangePasswordResponse>(
    "/auth/change-password",
    {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    },
    { requireAuth: true, accessToken }
  );
}

export type MeResponse = {
  user: BackendUser;
  organization: Organization;
};

export function getMe(accessToken?: string): Promise<MeResponse> {
  return apiFetch<MeResponse>(
    "/auth/me",
    { method: "GET" },
    { requireAuth: true, accessToken }
  );
}

/** Rows inside `GET /users/team-members` payload after envelope unwrap. */
export type TeamMembersListPayload = {
  data: TeamMemberApiRow[];
  total?: number;
  page?: number;
  limit?: number;
};

/** Shape returned for each member (name may be absent). */
export type TeamMemberApiRow = {
  id: string;
  email: string;
  role: BackendRole;
  organizationId?: string;
  createdAt?: string;
  lastLoginAt?: string | null;
  name?: string;
};

function displayNameFromRow(row: TeamMemberApiRow): string {
  if (typeof row.name === "string" && row.name.trim() !== "") {
    return row.name.trim();
  }
  const local = row.email.split("@")[0]?.trim();
  return local !== undefined && local !== "" ? local : row.email;
}

/**
 * List users in the current organization (requires org admin on typical backends).
 * Expects envelope `{ statusCode, success, message, data: { data, total, page, limit } }`
 * (outer `data` is unwrapped by `apiFetch`).
 */
export async function getOrganizationUsers(): Promise<BackendUser[]> {
  const payload = await apiFetch<TeamMembersListPayload>(
    "/users/team-members",
    { method: "GET" },
    { requireAuth: true }
  );

  const rows =
    payload && typeof payload === "object" && Array.isArray(payload.data)
      ? payload.data
      : [];
  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    role: row.role,
    name: displayNameFromRow(row),
  }));
}

export type CreateInvitePayload = {
  email: string;
  role?: BackendRole;
};

export type CreateInviteResponse = {
  id: string;
  email: string;
  role: BackendRole;
  organizationId: string;
  token?: string;
};

export function createInvite(
  payload: CreateInvitePayload,
  accessToken?: string
): Promise<CreateInviteResponse> {
  return apiFetch<CreateInviteResponse>(
    "/invites",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    { requireAuth: true, accessToken }
  );
}

export type AcceptInvitePayload = {
  token: string;
  password: string;
};

export type AcceptInviteResponse = {
  accessToken: string;
  user: BackendUser;
};

export function acceptInvite(
  payload: AcceptInvitePayload
): Promise<AcceptInviteResponse> {
  return apiFetch<AcceptInviteResponse>("/invites/accept", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
