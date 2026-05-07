"use client";

import React from "react";
import type { EventRecord, EventStatus, EventType } from "@/types";
import {
  adminDangerOutlineButtonCompact,
  adminTableActionButton,
} from "@/lib/admin-form-classes";

type EventsTableProps = {
  events?: EventRecord[];
  eventTypes?: EventType[];
  currentUserId?: string;
  deletingId: string | null;
  onView: (id: string) => void;
  onEdit: (event: EventRecord) => void;
  onDelete: (id: string) => void;
};

function statusClass(status: EventStatus): string {
  const base =
    "inline-flex rounded-full px-2 py-0.5 text-xs font-medium tabular-nums";
  switch (status) {
    case "COMPLETED":
      return `${base} bg-emerald-100 text-emerald-800`;
    case "FAILED":
      return `${base} bg-red-100 text-red-800`;
    case "PROCESSING":
      return `${base} bg-amber-100 text-amber-900`;
    case "PENDING":
    default:
      return `${base} bg-surface text-brand`;
  }
}

function formatStatusLabel(status: EventStatus): string {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function EventsTable({
  events,
  eventTypes,
  currentUserId,
  deletingId,
  onView,
  onEdit,
  onDelete,
}: EventsTableProps) {
  const safeEvents = Array.isArray(events) ? events : [];
  const catalog = Array.isArray(eventTypes) ? eventTypes : [];

  return (
    <div className="overflow-x-auto rounded-2xl bg-raised shadow-soft ring-1 ring-subtleBorder/50">
      <table className="w-full min-w-[760px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-subtleBorder">
            <th className="px-4 py-3 font-medium text-brand">ID</th>
            <th className="px-4 py-3 font-medium text-brand">Event type</th>
            <th className="px-4 py-3 font-medium text-brand">Status</th>
            <th className="px-4 py-3 font-medium text-brand">Created At</th>
            <th className="px-4 py-3 font-medium text-brand">Actions</th>
          </tr>
        </thead>
        <tbody>
          {safeEvents.length === 0 ? (
            <tr>
              <td className="px-4 py-8 text-center text-brand" colSpan={5}>
                No events found.
              </td>
            </tr>
          ) : null}
          {safeEvents.map((event) => {
            const isOwner = Boolean(currentUserId && event.userId === currentUserId);
            const eventTypeName =
              catalog.find((t) => t.id === event.eventTypeId)?.name ?? event.eventTypeId;
            return (
              <tr
                key={event.id}
                className="border-b border-subtleBorder/70 last:border-b-0"
              >
                <td className="max-w-[160px] truncate px-4 py-3 font-mono text-xs text-ink">
                  {event.id}
                </td>
                <td className="px-4 py-3 text-ink">{eventTypeName}</td>
                <td className="px-4 py-3">
                  <span className={statusClass(event.status)}>
                    {formatStatusLabel(event.status)}
                  </span>
                </td>
                <td className="px-4 py-3 tabular-nums text-brand">
                  {new Date(event.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onView(event.id)}
                      className={adminTableActionButton}
                    >
                      View
                    </button>
                    {isOwner ? (
                      <>
                        <button
                          type="button"
                          onClick={() => onEdit(event)}
                          className={adminTableActionButton}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(event.id)}
                          disabled={deletingId === event.id}
                          className={adminDangerOutlineButtonCompact}
                        >
                          {deletingId === event.id ? "Deleting…" : "Delete"}
                        </button>
                      </>
                    ) : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
