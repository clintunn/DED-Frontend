"use client";

import React from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthContext";
import { ErrorBanner } from "@/components/feedback/ErrorBanner";
import { LoadingState } from "@/components/feedback/LoadingState";
import {
  ApiError,
  createEvent,
  deleteEvent,
  getActionTypes,
  getEventById,
  getEventTypes,
  getEvents,
  getMyEvents,
  updateEvent,
} from "@/lib/api";
import type { ActionType, EventRecord, EventStatus, EventType } from "@/types";
import {
  adminInputClass,
  adminPanelClass,
  adminPrimaryButton,
  adminSecondaryButton,
  adminSecondaryButtonCompact,
} from "@/lib/admin-form-classes";
import { EventsTable } from "./EventsTable";

export type EventsPageMode = "all" | "my" | "create";

type EventsPageClientProps = {
  mode?: EventsPageMode;
};

export function EventsPageClient({ mode }: EventsPageClientProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === "ORG_ADMIN";
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [actionTypes, setActionTypes] = useState<ActionType[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<EventStatus | "">("");
  const [eventTypeFilter, setEventTypeFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [userIdFilter, setUserIdFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [lastCreatedEventId, setLastCreatedEventId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [eventTypeId, setEventTypeId] = useState("");
  const [payloadText, setPayloadText] = useState("{\n  \n}");
  const [targetUserId, setTargetUserId] = useState("");
  const [saving, setSaving] = useState(false);

  const [editingEvent, setEditingEvent] = useState<EventRecord | null>(null);
  const [editStatus, setEditStatus] = useState<EventStatus>("PENDING");

  const [selectedEvent, setSelectedEvent] = useState<EventRecord | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const effectiveMode = mode ?? (isAdmin ? "all" : "my");
  const listMode = isAdmin && effectiveMode === "all" ? "all" : "my";
  const showCreateSection = effectiveMode === "create";
  const showListSection = effectiveMode !== "create";

  async function loadEvents(nextPage = page) {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: nextPage,
        limit,
        eventTypeId: eventTypeFilter || undefined,
        status: statusFilter || undefined,
        createdAt: dateFilter || undefined,
        ...(isAdmin && listMode === "all" ? { userId: userIdFilter || undefined } : {}),
      };
      const result =
        listMode === "all" && isAdmin
          ? await getEvents(params)
          : await getMyEvents(params);
      setEvents(Array.isArray(result.items) ? result.items : []);
      setTotal(typeof result.total === "number" ? result.total : 0);
      setPage(typeof result.page === "number" ? result.page : nextPage);
    } catch (e) {
      setEvents([]);
      setError(e instanceof ApiError ? e.message : "Failed to load events.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    Promise.all([getEventTypes(), getActionTypes()])
      .then(([types, actions]) => {
        setEventTypes(types);
        setActionTypes(actions);
      })
      .catch(() => {
        setSubmitError("Failed to load event setup data.");
      })
      .finally(() => {
        void loadEvents(1);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (page !== 1) {
      setPage(1);
    }
    void loadEvents(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listMode, statusFilter, eventTypeFilter, dateFilter, userIdFilter, isAdmin]);

  function getRecommendedActionLabel(selectedTypeId: string): string | null {
    if (!selectedTypeId) return null;
    const selectedType = eventTypes.find((t) => t.id === selectedTypeId);
    if (!selectedType?.recommendedActionType) return null;
    if (typeof selectedType.recommendedActionType === "string") {
      const action = actionTypes.find((a) => a.id === selectedType.recommendedActionType);
      return action?.name ?? selectedType.recommendedActionType;
    }
    return selectedType.recommendedActionType.name;
  }

  function formatStatusLabel(status: EventStatus): string {
    return status
      .toLowerCase()
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  function parsePayloadObject(raw: string): Record<string, unknown> {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error("Payload must be valid JSON.");
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Payload must be a JSON object.");
    }
    return parsed as Record<string, unknown>;
  }

  function resetForm() {
    setEventTypeId("");
    setPayloadText("{\n  \n}");
    setTargetUserId("");
    setEditingEvent(null);
    setEditStatus("PENDING");
  }

  async function handleCreateOrUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!eventTypeId && !editingEvent) {
      setSubmitError("Event type is required.");
      return;
    }
    setSaving(true);
    setSubmitError("");
    setSubmitSuccess("");
    try {
      const payload = parsePayloadObject(payloadText);
      if (editingEvent) {
        if (editingEvent.userId !== user?.id) {
          throw new Error("Only event owners can update events.");
        }
        await updateEvent(editingEvent.id, {
          payload,
          status: editStatus,
        });
        setSubmitSuccess("Event updated successfully.");
        setLastCreatedEventId(null);
      } else {
        const created = await createEvent({
          eventTypeId,
          payload,
          userId: isAdmin && targetUserId.trim() ? targetUserId.trim() : undefined,
        });
        setLastCreatedEventId(created.id);
        setSubmitSuccess("Event created successfully.");
      }
      resetForm();
      await loadEvents(1);
    } catch (e) {
      setSubmitError(
        e instanceof ApiError || e instanceof Error
          ? e.message
          : "Failed to save event."
      );
      setLastCreatedEventId(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const event = events.find((entry) => entry.id === id);
    if (!event || event.userId !== user?.id) return;
    setDeletingId(id);
    setSubmitError("");
    setSubmitSuccess("");
    try {
      await deleteEvent(id);
      setSubmitSuccess("Event deleted successfully.");
      await loadEvents(page);
    } catch (e) {
      setSubmitError(
        e instanceof ApiError ? e.message : "Failed to delete event."
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function handleView(id: string) {
    setDetailsOpen(true);
    setDetailsLoading(true);
    setDetailsError(null);
    try {
      const item = await getEventById(id);
      setSelectedEvent(item);
    } catch (e) {
      setDetailsError(
        e instanceof ApiError ? e.message : "Failed to load event details."
      );
    } finally {
      setDetailsLoading(false);
    }
  }

  function startEdit(event: EventRecord) {
    if (event.userId !== user?.id) return;
    setEditingEvent(event);
    setEventTypeId(event.eventTypeId);
    setPayloadText(JSON.stringify(event.payload, null, 2));
    setEditStatus(event.status);
    setSubmitError("");
    setSubmitSuccess("");
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const recommendedAction = getRecommendedActionLabel(eventTypeId);

  if (!user) {
    return <LoadingState variant="table" label="Loading events…" />;
  }

  if (loading && events.length === 0) {
    return <LoadingState variant="table" label="Loading events…" />;
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-brand">
        {showCreateSection ? (
          <>
            <strong className="text-ink">Create or edit</strong> events with a JSON payload.
            Filters below are hidden while creating.
          </>
        ) : (
          <>
            Browse <strong className="text-ink">{listMode === "all" ? "organization" : "your"}</strong>{" "}
            events. Use filters to narrow by type, status, or date
            {isAdmin && listMode === "all" ? ", or user ID" : ""}.
          </>
        )}
      </p>
      {showListSection ? (
        <div
          className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 ${adminPanelClass}`}
        >
          <label className="text-sm font-medium text-brand">
            Event type
            <select
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value)}
              className={adminInputClass}
            >
            <option value="">All event types</option>
            {eventTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </label>
          <label className="text-sm font-medium text-brand">
            Status
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as EventStatus | "")}
              className={adminInputClass}
            >
            <option value="">All statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="PROCESSING">PROCESSING</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="FAILED">FAILED</option>
          </select>
        </label>
          <label className="text-sm font-medium text-brand">
            Created at
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className={adminInputClass}
            />
          </label>
          {isAdmin && listMode === "all" ? (
            <label className="text-sm font-medium text-brand">
              User ID
              <input
                type="text"
                value={userIdFilter}
                onChange={(e) => setUserIdFilter(e.target.value)}
                className={adminInputClass}
                placeholder="Filter by user id"
              />
            </label>
          ) : null}
        </div>
      ) : null}

      {showCreateSection ? (
        <div className={adminPanelClass}>
        <h2 className="text-base font-semibold text-ink">
          {editingEvent ? "Edit event" : "Create event"}
        </h2>
        <form onSubmit={handleCreateOrUpdate} className="mt-3 space-y-3">
          {submitError ? <ErrorBanner message={submitError} /> : null}
          {submitSuccess ? (
            <div className="text-sm text-emerald-700" role="status">
              <p>{submitSuccess}</p>
              {lastCreatedEventId ? (
                <Link
                  href={`/events/monitor?eventId=${encodeURIComponent(lastCreatedEventId)}`}
                  className="mt-1 inline-block underline decoration-emerald-700/40 underline-offset-2"
                >
                  Monitor execution for this event
                </Link>
              ) : null}
            </div>
          ) : null}
          <label className="block text-sm font-medium text-brand">
            Event type
            <select
              value={eventTypeId}
              onChange={(e) => setEventTypeId(e.target.value)}
              className={adminInputClass}
              disabled={saving || Boolean(editingEvent)}
              required={!editingEvent}
            >
              <option value="">Select event type</option>
              {eventTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </label>
          {recommendedAction ? (
            <p className="text-xs text-brand">
              Recommended action: <strong className="text-ink">{recommendedAction}</strong>
            </p>
          ) : null}
          {isAdmin && !editingEvent ? (
            <label className="block text-sm font-medium text-brand">
              User ID (optional, org admin only)
              <input
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                className={adminInputClass}
                placeholder="Leave blank to create for self"
                disabled={saving}
              />
            </label>
          ) : null}
          {editingEvent ? (
            <label className="block text-sm font-medium text-brand">
              Status
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as EventStatus)}
                className={adminInputClass}
                disabled={saving}
              >
                <option value="PENDING">PENDING</option>
                <option value="PROCESSING">PROCESSING</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="FAILED">FAILED</option>
              </select>
            </label>
          ) : null}
          <label className="block text-sm font-medium text-brand">
            Payload (JSON object)
            <textarea
              value={payloadText}
              onChange={(e) => setPayloadText(e.target.value)}
              className={`${adminInputClass} min-h-28 font-mono text-xs`}
              disabled={saving}
              required
            />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <button type="submit" disabled={saving} className={adminPrimaryButton}>
              {saving ? "Saving…" : editingEvent ? "Update event" : "Create event"}
            </button>
            {editingEvent ? (
              <button type="button" onClick={resetForm} className={adminSecondaryButton}>
                Cancel edit
              </button>
            ) : null}
          </div>
        </form>
        </div>
      ) : null}

      {error ? <ErrorBanner message={error} /> : null}
      {showListSection ? (
        <>
          <div className="overflow-x-auto">
            <EventsTable
              events={events}
              eventTypes={eventTypes}
              currentUserId={user.id}
              deletingId={deletingId}
              onView={handleView}
              onEdit={startEdit}
              onDelete={(id) => void handleDelete(id)}
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-brand">
              Page {page} of {totalPages}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => void loadEvents(page - 1)}
                className={adminSecondaryButtonCompact}
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => void loadEvents(page + 1)}
                className={adminSecondaryButtonCompact}
              >
                Next
              </button>
            </div>
          </div>
        </>
      ) : null}

      {detailsOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center sm:p-4"
          role="presentation"
          onClick={() => setDetailsOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="event-detail-title"
            className="max-h-[90dvh] w-full max-w-2xl overflow-hidden rounded-2xl bg-raised shadow-soft ring-1 ring-subtleBorder/50 sm:max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex min-w-0 items-start justify-between gap-3 border-b border-subtleBorder px-4 py-3 sm:gap-4 sm:px-5">
              <h2
                id="event-detail-title"
                className="min-w-0 truncate text-base font-semibold text-ink sm:text-lg"
              >
                Event details
              </h2>
              <button
                type="button"
                onClick={() => setDetailsOpen(false)}
                className={adminSecondaryButtonCompact}
              >
                Close
              </button>
            </div>
            <div className="max-h-[calc(85vh-4rem)] overflow-auto p-4 sm:p-5">
              {detailsLoading ? (
                <LoadingState label="Loading event details…" />
              ) : null}
              {detailsError ? <ErrorBanner message={detailsError} /> : null}
              {selectedEvent && !detailsLoading ? (
                <div className="space-y-3">
                  <p className="text-sm text-brand">
                    <strong className="text-ink">ID:</strong> {selectedEvent.id}
                  </p>
                  <p className="text-sm text-brand">
                    <strong className="text-ink">Event type:</strong>{" "}
                    {eventTypes.find((t) => t.id === selectedEvent.eventTypeId)?.name ??
                      selectedEvent.eventTypeId}
                  </p>
                  <p className="text-sm text-brand">
                    <strong className="text-ink">Status:</strong>{" "}
                    {formatStatusLabel(selectedEvent.status)}
                  </p>
                  <p className="text-sm text-brand">
                    <strong className="text-ink">Owner:</strong> {selectedEvent.userId}
                  </p>
                  <p className="text-xs font-medium uppercase tracking-wide text-brand">
                    Payload
                  </p>
                  <pre className="rounded-lg bg-surface p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap break-words text-ink">
                    {JSON.stringify(selectedEvent.payload, null, 2)}
                  </pre>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
