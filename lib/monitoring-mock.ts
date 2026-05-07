import type { MonitoringLog } from "@/types";

/** Mock system stats until telemetry API exists. */
export const monitoringStats = {
  totalEventsProcessed: {
    value: 118_420,
    delta: 4.2,
  },
  failedEvents: {
    value: 38,
    delta: -8.5,
  },
  queueJobsWaiting: {
    value: 127,
    delta: 6.8,
  },
  jobsProcessed: {
    value: 4_092,
    delta: 3.1,
  },
} as const;

export const recentLogs: MonitoringLog[] = [
  {
    id: "log_1",
    level: "info",
    at: "2025-03-25T08:40:02.000Z",
    message: "Worker pool scaled to 4 instances.",
  },
  {
    id: "log_2",
    level: "warn",
    at: "2025-03-25T08:38:15.000Z",
    message: "Queue depth exceeded threshold (120 jobs waiting).",
  },
  {
    id: "log_3",
    level: "info",
    at: "2025-03-25T08:35:00.000Z",
    message: "Health check OK: database, redis, worker.",
  },
  {
    id: "log_4",
    level: "error",
    at: "2025-03-25T08:31:44.000Z",
    message: "Job evt_retry_09 failed after 3 attempts: timeout connecting to upstream.",
  },
  {
    id: "log_5",
    level: "info",
    at: "2025-03-25T08:28:11.000Z",
    message: "Released feature flag: async_export_v2.",
  },
  {
    id: "log_6",
    level: "warn",
    at: "2025-03-25T08:22:00.000Z",
    message: "Disk usage on /var/log at 78%.",
  },
  {
    id: "log_7",
    level: "info",
    at: "2025-03-25T08:15:33.000Z",
    message: "Scheduled backup completed successfully.",
  },
];
