import type { NotificationRecord } from "@/types";

export const mockNotifications: NotificationRecord[] = [
  {
    id: "ntf_01",
    message: "Weekly digest is ready to view.",
    priority: "LOW",
    status: "SENT",
    createdAt: "2025-03-24T10:00:00.000Z",
  },
  {
    id: "ntf_02",
    message: "Payment past due for invoice #INV-2044 — please update billing within 3 business days to avoid service interruption.",
    priority: "HIGH",
    status: "PENDING",
    createdAt: "2025-03-24T09:45:12.000Z",
  },
  {
    id: "ntf_03",
    message: "New login from Chrome on macOS.",
    priority: "MEDIUM",
    status: "SENT",
    createdAt: "2025-03-24T09:12:00.000Z",
  },
  {
    id: "ntf_04",
    message: "Deploy to production completed successfully.",
    priority: "LOW",
    status: "FAILED",
    createdAt: "2025-03-24T08:30:00.000Z",
  },
  {
    id: "ntf_05",
    message: "API rate limit 80% consumed for key ending …9f2a.",
    priority: "MEDIUM",
    status: "PENDING",
    createdAt: "2025-03-24T08:01:33.000Z",
  },
  {
    id: "ntf_06",
    message: "Your export job has finished.",
    priority: "LOW",
    status: "SENT",
    createdAt: "2025-03-23T22:15:00.000Z",
  },
  {
    id: "ntf_07",
    message: "SSL certificate for example.com expires in 14 days.",
    priority: "HIGH",
    status: "FAILED",
    createdAt: "2025-03-23T18:00:00.000Z",
  },
  {
    id: "ntf_08",
    message: "Team invite accepted by jamie@company.com.",
    priority: "LOW",
    status: "SENT",
    createdAt: "2025-03-23T15:42:11.000Z",
  },
];
