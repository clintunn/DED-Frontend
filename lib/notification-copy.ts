import type { NotificationPriority, NotificationStatus } from "@/types";

export function notificationStatusCopy(status: NotificationStatus): string {
  switch (status) {
    case "PENDING":
      return "Pending delivery";
    case "SENT":
      return "Emailed";
    case "FAILED":
      return "Email failed (see in app)";
    default:
      return status;
  }
}

export function notificationPriorityCopy(priority: NotificationPriority): string {
  switch (priority) {
    case "HIGH":
      return "High";
    case "MEDIUM":
      return "Medium";
    case "LOW":
    default:
      return "Low";
  }
}
