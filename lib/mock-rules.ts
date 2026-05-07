import type { RuleRecord } from "@/types";

function ra(
  ruleIdPrefix: string,
  sortOrder: number,
  actionTypeId: string,
  actionName: string
) {
  return {
    id: `${ruleIdPrefix}-ra-${sortOrder}`,
    sortOrder,
    actionType: { id: actionTypeId, name: actionName },
  };
}

export const initialRules: RuleRecord[] = [
  {
    id: "rule_notify_order",
    name: "Notify on order created",
    eventTypeId: "order.created",
    ruleActions: [ra("rule_notify_order", 0, "send_email", "Send email")],
    isActive: true,
  },
  {
    id: "rule_webhook_stripe",
    name: "Forward Stripe webhooks",
    eventTypeId: "webhook.received",
    ruleActions: [ra("rule_webhook_stripe", 0, "forward_http", "Forward HTTP")],
    isActive: true,
  },
  {
    id: "rule_inventory_alert",
    name: "Low stock alert",
    eventTypeId: "inventory.sync",
    ruleActions: [ra("rule_inventory_alert", 0, "slack_message", "Slack message")],
    isActive: false,
  },
  {
    id: "rule_failed_payment",
    name: "Retry failed payments",
    eventTypeId: "payment.capture",
    ruleActions: [ra("rule_failed_payment", 0, "retry_queue", "Retry queue")],
    isActive: true,
  },
  {
    id: "rule_user_welcome",
    name: "Welcome new users",
    eventTypeId: "user.signup",
    ruleActions: [
      ra("rule_user_welcome", 0, "send_email", "Send email"),
      ra("rule_user_welcome", 1, "forward_http", "Forward HTTP"),
    ],
    isActive: false,
  },
];
