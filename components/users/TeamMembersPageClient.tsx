"use client";

import { useEffect, useState } from "react";
import { ErrorBanner } from "@/components/feedback/ErrorBanner";
import { LoadingState } from "@/components/feedback/LoadingState";
import {
  ApiError,
  getOrganizationUsers,
  type BackendUser,
} from "@/lib/api";

function formatRoleLabel(role: BackendUser["role"]): string {
  return role === "ORG_ADMIN" ? "Org Admin" : "User";
}

export function TeamMembersPageClient() {
  const [members, setMembers] = useState<BackendUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const items = await getOrganizationUsers();
        if (!cancelled) {
          setMembers(Array.isArray(items) ? items : []);
        }
      } catch (e) {
        if (!cancelled) {
          setMembers([]);
          setError(
            e instanceof ApiError
              ? e.message
              : "Could not load team members. Check that your backend exposes organization users."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <LoadingState variant="table" label="Loading team members…" />;
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-brand">
        Organization members with access to{" "}
        <strong className="text-ink">this workspace.</strong>
      </p>
      {error ? <ErrorBanner message={error} /> : null}
      <div className="overflow-x-auto rounded-2xl bg-raised shadow-soft ring-1 ring-subtleBorder/50">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-subtleBorder">
              <th className="px-4 py-3 font-medium text-brand">Name</th>
              <th className="px-4 py-3 font-medium text-brand">Email</th>
              <th className="px-4 py-3 font-medium text-brand">Role</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-8 text-center text-sm text-brand"
                  colSpan={3}
                >
                  {error
                    ? "No members to display."
                    : "No team members found."}
                </td>
              </tr>
            ) : (
              members.map((m) => (
                <tr
                  key={m.id}
                  className="border-b border-subtleBorder last:border-b-0"
                >
                  <td className="px-4 py-3 font-medium text-ink">{m.name}</td>
                  <td className="px-4 py-3 text-ink">{m.email}</td>
                  <td className="px-4 py-3 text-brand">
                    <span className="inline-flex rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-brand ring-1 ring-subtleBorder/60">
                      {formatRoleLabel(m.role)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
