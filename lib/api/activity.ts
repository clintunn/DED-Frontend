import { ApiError, getApiBaseUrl } from "@/lib/api";
import type {
  ActivityLog,
  ActivityType,
  GetActivitiesParams,
  PaginatedActivitiesResponse,
} from "@/types";

type ActivityEnvelope = {
  data?: {
    data?: unknown[];
    total?: unknown;
    page?: unknown;
    limit?: unknown;
  };
};

function toQueryString(params?: GetActivitiesParams): string {
  if (!params) return "";
  const query = new URLSearchParams();
  const entries = Object.entries(params) as Array<
    [keyof GetActivitiesParams, GetActivitiesParams[keyof GetActivitiesParams]]
  >;
  for (const [key, value] of entries) {
    if (typeof value === "undefined") continue;
    query.set(String(key), String(value));
  }
  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

function normalizeActivityType(value: unknown): ActivityType {
  const next = String(value ?? "");
  const allowed: ActivityType[] = [
    "LOGIN",
    "CREATE_INVITE",
    "ACCEPT_INVITE",
    "CREATE_USER",
    "UPDATE_USER",
    "DELETE_USER_FROM_ORG",
    "DELETE_USER_FROM_SYSTEM",
  ];
  return allowed.includes(next as ActivityType) ? (next as ActivityType) : "LOGIN";
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object");
}

function normalizeActivityRow(row: unknown): ActivityLog | null {
  if (!isObject(row)) return null;
  const id = typeof row.id === "string" ? row.id : "";
  const createdAt = typeof row.createdAt === "string" ? row.createdAt : "";
  const nestedUser = isObject(row.user) ? row.user : null;
  const userEmail =
    (typeof row.userEmail === "string" && row.userEmail) ||
    (typeof row.email === "string" && row.email) ||
    (nestedUser && typeof nestedUser.email === "string" && nestedUser.email) ||
    "";
  if (!id || !createdAt || !userEmail) return null;
  return {
    id,
    type: normalizeActivityType(row.type),
    createdAt,
    userEmail,
  };
}

async function fetchActivity(path: string, accessToken?: string): Promise<unknown> {
  if (!accessToken) {
    throw new ApiError("You are not authenticated.", 401);
  }
  let res: Response;
  try {
    res = await fetch(`${getApiBaseUrl()}${path}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } catch (e) {
    throw new ApiError(e instanceof Error ? e.message : "Network error", 0);
  }

  const text = await res.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text) as unknown;
    } catch {
      if (!res.ok) {
        throw new ApiError(`Invalid JSON response (${res.status})`, res.status);
      }
    }
  }

  if (!res.ok) {
    const body = isObject(payload) ? payload : null;
    const message =
      (body && typeof body.error === "string" && body.error) ||
      (body && typeof body.message === "string" && body.message) ||
      `Request failed (${res.status})`;
    throw new ApiError(message, res.status, payload);
  }

  return payload;
}

export async function getActivities(
  params?: GetActivitiesParams,
  accessToken?: string
): Promise<PaginatedActivitiesResponse> {
  const payload = (await fetchActivity(
    `/activity${toQueryString(params)}`,
    accessToken
  )) as ActivityEnvelope;
  const wrapped = payload?.data;
  const rows = Array.isArray(wrapped?.data) ? wrapped?.data : [];
  const items = rows
    .map((row) => normalizeActivityRow(row))
    .filter((row): row is ActivityLog => Boolean(row));
  return {
    items,
    total: typeof wrapped?.total === "number" ? wrapped.total : items.length,
    page: typeof wrapped?.page === "number" ? wrapped.page : params?.page ?? 1,
    limit: typeof wrapped?.limit === "number" ? wrapped.limit : params?.limit ?? 10,
  };
}
