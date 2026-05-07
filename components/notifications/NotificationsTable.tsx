import { notificationPriorityCopy, notificationStatusCopy } from "@/lib/notification-copy";
import type {
  NotificationPriority,
  NotificationRecord,
  NotificationStatus,
} from "@/types";

type NotificationsTableProps = {
  notifications: NotificationRecord[];
};

const pill =
  "inline-flex rounded-full px-2 py-0.5 text-xs font-medium tabular-nums";

function priorityBadgeClass(priority: NotificationPriority): string {
  switch (priority) {
    case "HIGH":
      return `${pill} bg-red-100 text-red-800`;
    case "MEDIUM":
      return `${pill} bg-amber-100 text-amber-900`;
    case "LOW":
    default:
      return `${pill} bg-surface text-brand`;
  }
}

function statusBadgeClass(status: NotificationStatus): string {
  switch (status) {
    case "SENT":
      return `${pill} bg-emerald-100 text-emerald-800`;
    case "FAILED":
      return `${pill} bg-red-100 text-red-800`;
    case "PENDING":
    default:
      return `${pill} bg-surface text-brand`;
  }
}

export function NotificationsTable({ notifications }: NotificationsTableProps) {
  const rows = Array.isArray(notifications) ? notifications : [];
  return (
    <div className="overflow-x-auto rounded-2xl bg-raised shadow-soft ring-1 ring-subtleBorder/50">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-subtleBorder">
            <th className="px-4 py-3 font-medium text-brand">Message</th>
            <th className="px-4 py-3 font-medium text-brand">Priority</th>
            <th className="px-4 py-3 font-medium text-brand">Status</th>
            <th className="px-4 py-3 font-medium text-brand">Recipient</th>
            <th className="px-4 py-3 font-medium text-brand">Created At</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="px-4 py-8 text-center text-brand" colSpan={5}>
                No notifications yet.
              </td>
            </tr>
          ) : null}
          {rows.map((n) => (
            <tr
              key={n.id}
              className="border-b border-subtleBorder last:border-b-0"
            >
              <td className="min-w-0 max-w-[18rem] px-4 py-3 break-words text-ink sm:max-w-md lg:max-w-xl">
                {n.message}
              </td>
              <td className="px-4 py-3">
                <span className={priorityBadgeClass(n.priority)} title={n.priority}>
                  {notificationPriorityCopy(n.priority)}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={statusBadgeClass(n.status)} title={n.status}>
                  {notificationStatusCopy(n.status)}
                </span>
              </td>
              <td className="max-w-[10rem] truncate px-4 py-3 text-brand">
                {n.user?.email ?? "—"}
              </td>
              <td className="px-4 py-3 tabular-nums text-brand">
                {new Date(n.createdAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
