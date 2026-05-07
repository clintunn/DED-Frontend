"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { ErrorBanner } from "@/components/feedback/ErrorBanner";
import { LoadingState } from "@/components/feedback/LoadingState";
import { getActivities } from "@/lib/api/activity";
import {
  adminInputClass,
  adminPanelClass,
  adminSecondaryButtonCompact,
} from "@/lib/admin-form-classes";
import type {
  ActivityLog,
  ActivityType,
  GetActivitiesParams,
  PaginatedActivitiesResponse,
} from "@/types";

const ACTIVITY_TYPES: ActivityType[] = [
  "LOGIN",
  "CREATE_INVITE",
  "ACCEPT_INVITE",
  "CREATE_USER",
  "UPDATE_USER",
  "DELETE_USER_FROM_ORG",
  "DELETE_USER_FROM_SYSTEM",
];

function formatActivityType(type: ActivityType): string {
  return type
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function ActivityPageClient() {
  const { accessToken } = useAuth();
  const [items, setItems] = useState<ActivityLog[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [typeFilter, setTypeFilter] = useState("");
  const [createdAtFilter, setCreatedAtFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadActivities = useCallback(
    async (nextPage = page, nextLimit = limit): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const params: GetActivitiesParams = {
          page: nextPage,
          limit: nextLimit,
          type: typeFilter ? (typeFilter as ActivityType) : undefined,
          createdAt: createdAtFilter || undefined,
        };
        const result: PaginatedActivitiesResponse = await getActivities(
          params,
          accessToken ?? undefined
        );
        setItems(Array.isArray(result.items) ? result.items : []);
        setTotal(typeof result.total === "number" ? result.total : 0);
        setPage(typeof result.page === "number" ? result.page : nextPage);
        setLimit(typeof result.limit === "number" ? result.limit : nextLimit);
      } catch (e) {
        setItems([]);
        setError(e instanceof Error ? e.message : "Failed to load activities.");
      } finally {
        setLoading(false);
      }
    },
    [accessToken, createdAtFilter, limit, page, typeFilter]
  );

  useEffect(() => {
    void loadActivities(1, limit);
  }, [limit, typeFilter, createdAtFilter, loadActivities]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  if (loading && items.length === 0) {
    return <LoadingState variant="table" label="Loading activity logs…" />;
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-brand">
        Audit activity across organization users with type and created date filters.
      </p>
      <div className={`grid grid-cols-1 gap-4 sm:grid-cols-3 ${adminPanelClass}`}>
        <label className="text-sm font-medium text-brand">
          Type
          <select
            value={typeFilter}
            onChange={(e) => {
              setPage(1);
              setTypeFilter(e.target.value);
            }}
            className={adminInputClass}
          >
            <option value="">All types</option>
            {ACTIVITY_TYPES.map((type) => (
              <option key={type} value={type}>
                {formatActivityType(type)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-brand">
          Created at
          <input
            value={createdAtFilter}
            onChange={(e) => {
              setPage(1);
              setCreatedAtFilter(e.target.value);
            }}
            placeholder="2026-05-07"
            className={adminInputClass}
          />
        </label>
        <label className="text-sm font-medium text-brand">
          Per page
          <select
            value={limit}
            onChange={(e) => {
              const next = Number(e.target.value);
              setPage(1);
              setLimit(Number.isFinite(next) ? next : 10);
            }}
            className={adminInputClass}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </label>
      </div>

      {error ? <ErrorBanner message={error} /> : null}

      <div className="overflow-x-auto rounded-2xl bg-raised shadow-soft ring-1 ring-subtleBorder/50">
        <table className="w-full min-w-[880px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-subtleBorder">
              <th className="px-4 py-3 font-medium text-brand">ID</th>
              <th className="px-4 py-3 font-medium text-brand">Type</th>
              <th className="px-4 py-3 font-medium text-brand">Created At</th>
              <th className="px-4 py-3 font-medium text-brand">User Email</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-brand" colSpan={4}>
                  No activity logs found.
                </td>
              </tr>
            ) : null}
            {items.map((row) => (
              <tr
                key={row.id}
                className="border-b border-subtleBorder/70 last:border-b-0"
              >
                <td className="max-w-[220px] truncate px-4 py-3 font-mono text-xs text-ink">
                  {row.id}
                </td>
                <td className="px-4 py-3 text-ink">{formatActivityType(row.type)}</td>
                <td className="px-4 py-3 tabular-nums text-brand">
                  {new Date(row.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-ink">{row.userEmail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-brand">
          Page {page} of {totalPages}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => void loadActivities(page - 1, limit)}
            className={adminSecondaryButtonCompact}
          >
            Previous
          </button>
          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => void loadActivities(page + 1, limit)}
            className={adminSecondaryButtonCompact}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
