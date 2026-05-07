import type { EventLog, EventLogOutcome } from "@/types";

/** Classify deterministic backend log messages into execution outcomes for the UI. */
export function inferEventLogOutcome(message: string): EventLogOutcome {
  const text = message.toLowerCase();
  if (
    text.includes("unsupported") ||
    text.includes("not supported") ||
    text.includes("unknown action")
  ) {
    return "unsupported";
  }
  if (
    text.includes("failed") ||
    text.includes("failure") ||
    text.includes("error") ||
    text.includes("exception")
  ) {
    return "failure";
  }
  if (
    text.includes("executed") ||
    text.includes("completed") ||
    text.includes("success")
  ) {
    return "success";
  }
  return "unknown";
}

export function sortedEventLogs(logs: EventLog[] | undefined): EventLog[] {
  if (!Array.isArray(logs) || logs.length === 0) return [];
  return [...logs].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
