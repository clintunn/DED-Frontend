"use client";

import { useEffect, useState } from "react";
import { ErrorBanner } from "@/components/feedback/ErrorBanner";
import { LoadingState } from "@/components/feedback/LoadingState";
import { ApiError, getNotifications } from "@/lib/api";
import type { NotificationRecord } from "@/types";
import { useAuth } from "@/components/auth/AuthContext";
import { RoleGate } from "@/components/auth/RoleGate";
import { NotificationsTable } from "./NotificationsTable";

export function NotificationsPageClient() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getNotifications()
      .then((data) => {
        setNotifications(data);
        setError(null);
      })
      .catch((e) => {
        setNotifications([]);
        setError(
          e instanceof ApiError ? e.message : "Failed to load notifications."
        );
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <LoadingState variant="table" label="Loading notifications…" />
    );
  }

  return (
    <div className="space-y-6">
      {user?.role === "USER" ? (
        <p className="text-sm text-brand">
          Your role can view notification history for{" "}
          <strong className="text-ink">your workspace.</strong>
        </p>
      ) : null}
      <RoleGate allow={["ORG_ADMIN"]}>
        <p className="text-sm text-brand">
          <strong className="text-ink">Administrators</strong> see all
          notification records across environments.
        </p>
      </RoleGate>
      {error ? <ErrorBanner message={error} /> : null}
      <div className="overflow-x-auto">
        <NotificationsTable notifications={notifications} />
      </div>
    </div>
  );
}
