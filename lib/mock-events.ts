import type { EventRecord } from "@/types";

export const mockEvents: EventRecord[] = [
  {
    id: "evt_01hq8k2m9",
    eventTypeId: "order.created",
    status: "COMPLETED",
    createdAt: "2025-03-20T14:22:00.000Z",
    userId: "usr_001",
    payload: {
      orderId: "ord_9921",
      customerId: "cust_441",
      totalCents: 4999,
      items: [{ sku: "SKU-A", qty: 1 }],
    },
  },
  {
    id: "evt_01hq8k3n0",
    eventTypeId: "webhook.received",
    status: "PROCESSING",
    createdAt: "2025-03-20T14:21:12.000Z",
    userId: "usr_002",
    payload: {
      source: "stripe",
      endpoint: "/hooks/stripe",
      eventType: "payment_intent.succeeded",
    },
  },
  {
    id: "evt_01hq8k4p1",
    eventTypeId: "inventory.sync",
    status: "PENDING",
    createdAt: "2025-03-20T14:18:45.000Z",
    userId: "usr_001",
    payload: {
      warehouse: "east-1",
      skuCount: 12840,
      scheduledFor: "2025-03-20T15:00:00.000Z",
    },
  },
  {
    id: "evt_01hq8k5q2",
    eventTypeId: "notification.send",
    status: "FAILED",
    createdAt: "2025-03-20T14:15:03.000Z",
    userId: "usr_003",
    payload: {
      channel: "email",
      template: "order-confirmation",
      to: "user@example.com",
      error: { code: "SMTP_TIMEOUT", retryable: true },
    },
  },
  {
    id: "evt_01hq8k6r3",
    eventTypeId: "user.signup",
    status: "COMPLETED",
    createdAt: "2025-03-20T14:10:00.000Z",
    userId: "usr_002",
    payload: {
      userId: "usr_8821",
      email: "new@example.com",
      referrer: "campaign_spring",
    },
  },
  {
    id: "evt_01hq8k7s4",
    eventTypeId: "report.generated",
    status: "PENDING",
    createdAt: "2025-03-20T14:05:22.000Z",
    userId: "usr_001",
    payload: {
      reportId: "rpt_march_sales",
      format: "csv",
      filters: { region: "NA", month: 3 },
    },
  },
  {
    id: "evt_01hq8k8t5",
    eventTypeId: "payment.capture",
    status: "FAILED",
    createdAt: "2025-03-20T13:59:01.000Z",
    userId: "usr_004",
    payload: {
      paymentId: "pay_331",
      amountCents: 1200,
      reason: "insufficient_funds",
    },
  },
];
