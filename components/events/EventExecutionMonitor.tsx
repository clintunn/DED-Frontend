"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ErrorBanner } from "@/components/feedback/ErrorBanner";
import { LoadingState } from "@/components/feedback/LoadingState";
import { ApiError, getEventById } from "@/lib/api";
import {
  adminInputClass,
  adminPanelClass,
  adminPrimaryButton,
  adminSecondaryButtonCompact,
} from "@/lib/admin-form-classes";
import { inferEventLogOutcome, sortedEventLogs } from "@/lib/event-log-outcomes";
import type { EventLog, EventRecord, EventStatus } from "@/types";

const POLL_INTERVAL_MS = 2500;
const TERMINAL: EventStatus[] = ["COMPLETED", "FAILED"];
const FLOW: EventStatus[] = ["PENDING", "PROCESSING", "COMPLETED", "FAILED"];

function isTerminal(status: EventStatus): boolean {
  return TERMINAL.includes(status);
}

function badgeClass(status: EventStatus): string {
  const base = "inline-flex rounded-full px-2 py-0.5 text-xs font-medium tabular-nums";
  switch (status) {
    case "COMPLETED":
      return `${base} bg-emerald-100 text-emerald-800`;
    case "FAILED":
      return `${base} bg-red-100 text-red-800`;
    case "PROCESSING":
      return `${base} bg-amber-100 text-amber-900`;
    default:
      return `${base} bg-surface text-brand`;
  }
}

function outcomeClass(outcome: ReturnType<typeof inferEventLogOutcome>): string {
  switch (outcome) {
    case "success":
      return "bg-emerald-100 text-emerald-800";
    case "unsupported":
      return "bg-amber-100 text-amber-900";
    case "failure":
      return "bg-red-100 text-red-800";
    default:
      return "bg-surface text-brand";
  }
}

function timelineState(current: EventStatus, step: EventStatus): "done" | "current" | "pending" {
  if (current === step) return "current";
  const currentIndex = FLOW.indexOf(current);
  const stepIndex = FLOW.indexOf(step);
  if (current === "FAILED" && (step === "COMPLETED" || stepIndex > currentIndex)) {
    return "pending";
  }
  return stepIndex < currentIndex ? "done" : "pending";
}

export function EventExecutionMonitor() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get("eventId") ?? "";
  const [eventId, setEventId] = useState(initialId);
  const [activeId, setActiveId] = useState(initialId);
  const [event, setEvent] = useState<EventRecord | null>(null);
  const [loading, setLoading] = useState(Boolean(initialId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const poll = async () => {
      try {
        const next = await getEventById(activeId);
        if (cancelled) return;
        setEvent(next);
        setError(null);
        setLoading(false);
        if (!isTerminal(next.status)) {
          timeoutId = setTimeout(() => {
            void poll();
          }, POLL_INTERVAL_MS);
        }
      } catch (e) {
        if (cancelled) return;
        setLoading(false);
        setError(e instanceof ApiError ? e.message : "Failed to load event execution.");
      }
    };

    setLoading(true);
    setError(null);
    setEvent(null);
    void poll();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [activeId]);

  const logs = useMemo(() => sortedEventLogs(event?.logs), [event]);

  function handleLoadEvent(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = eventId.trim();
    if (!trimmed) {
      setError("Event ID is required.");
      return;
    }
    setActiveId(trimmed);
  }

  function renderLog(log: EventLog) {
    const outcome = inferEventLogOutcome(log.message);
    return (
      <li key={log.id} className="rounded-lg border border-subtleBorder bg-surface/80 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${outcomeClass(outcome)}`}>
            {outcome}
          </span>
          <span className="text-xs text-brand tabular-nums">
            {new Date(log.createdAt).toLocaleString()}
          </span>
        </div>
        <p className="mt-2 text-sm text-ink break-words">{log.message}</p>
      </li>
    );
  }

  return (
    <div className="space-y-6">
      <div className={adminPanelClass}>
        <h2 className="text-base font-semibold text-ink">Event execution monitor</h2>
        <p className="mt-1 text-sm text-brand">
          Track event execution state and deterministic action outcomes.
        </p>
        <form onSubmit={handleLoadEvent} className="mt-4 flex flex-wrap items-end gap-2">
          <label className="min-w-[18rem] flex-1 text-sm font-medium text-brand">
            Event ID
            <input
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className={adminInputClass}
              placeholder="Enter event id"
            />
          </label>
          <button type="submit" className={adminPrimaryButton}>
            Monitor
          </button>
        </form>
      </div>

      {loading ? <LoadingState variant="table" label="Loading event execution…" /> : null}
      {error ? <ErrorBanner message={error} /> : null}

      {event && !loading ? (
        <div className="space-y-4">
          <div className={adminPanelClass}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-brand">
                Event <code className="rounded bg-surface px-1.5 py-0.5 text-xs">{event.id}</code>
              </p>
              <span className={badgeClass(event.status)}>{event.status}</span>
            </div>
            <ol
              className="mt-4 grid gap-2 sm:grid-cols-4"
              aria-label="Event status lifecycle"
            >
              {FLOW.map((step) => {
                const state = timelineState(event.status, step);
                const stateClass =
                  state === "current"
                    ? "border-brand bg-brand/10 text-ink"
                    : state === "done"
                      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                      : "border-subtleBorder bg-surface text-brand";
                return (
                  <li key={step} className={`rounded-lg border px-3 py-2 text-xs font-medium ${stateClass}`}>
                    {step}
                  </li>
                );
              })}
            </ol>
          </div>

          <div className={adminPanelClass}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-ink">Action execution logs</h3>
              <button
                type="button"
                onClick={() => setActiveId(event.id)}
                className={adminSecondaryButtonCompact}
              >
                Refresh
              </button>
            </div>
            {logs.length === 0 ? (
              <p className="text-sm text-brand">No execution logs found yet.</p>
            ) : (
              <ul className="space-y-2">{logs.map((log) => renderLog(log))}</ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
