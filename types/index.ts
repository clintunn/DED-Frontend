export type UserRole = "ORG_ADMIN" | "USER";

export type Organization = {
  id: string;
  name: string;
};

export type NavItem = {
  href: string;
  label: string;
  section?: "overview" | "operations" | "workspace";
  icon?:
    | "dashboard"
    | "users"
    | "events"
    | "rules"
    | "notifications"
    | "monitoring"
    | "activity";
  /** Optional count badge in the sidebar */
  badge?: string;
  badgeTone?: "accent" | "success";
  /** Roles that may see this link in the sidebar */
  allowedRoles: UserRole[];
  children?: NavItem[];
};

/** Session user after login (mock auth). */
export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

/** Placeholder for authenticated user; extend when wiring auth. */
export type User = {
  id: string;
  name: string;
  email?: string;
  role?: UserRole;
};

export type EventStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

export type EventRecord = {
  id: string;
  eventTypeId: string;
  status: EventStatus;
  /** ISO 8601 */
  createdAt: string;
  payload: Record<string, unknown>;
  userId: string;
  organizationId?: string;
  updatedAt?: string;
  logs?: EventLog[];
};

export type EventLogOutcome = "success" | "unsupported" | "failure" | "unknown";

export type EventLog = {
  id: string;
  message: string;
  /** ISO 8601 */
  createdAt: string;
  eventId: string;
  organizationId: string;
};

export type NotificationPriority = "LOW" | "MEDIUM" | "HIGH";

export type NotificationStatus = "PENDING" | "SENT" | "FAILED";

/** Nested `user` when the API includes it. */
export type NotificationUserRef = {
  id: string;
  name?: string | null;
  email?: string | null;
};

export type NotificationRecord = {
  id: string;
  message: string;
  priority: NotificationPriority;
  status: NotificationStatus;
  /** ISO 8601 */
  createdAt: string;
  user?: NotificationUserRef | null;
  /** Present when backend links the notification to an event */
  eventId?: string | null;
};

export type EventType = {
  id: string;
  name: string;
  recommendedActionType?: string | ActionType | null;
};

export type ActionType = {
  id: string;
  name: string;
  /** Present when catalog returns it */
  description?: string | null;
};

/** Embedded action snapshot on each rule junction row (`ruleActions`). */
export type RuleActionTypeRef = {
  id: string;
  name: string;
  description?: string | null;
};

export type RuleAction = {
  id: string;
  sortOrder: number;
  actionType: RuleActionTypeRef;
};

export type Rule = {
  id: string;
  name: string;
  eventTypeId: string;
  /** Ordered by execution (`sortOrder`); canonical source from the API */
  ruleActions?: RuleAction[];
  isActive: boolean;
};

export type PaginatedResponse<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
};

export type PaginatedRulesResponse = PaginatedResponse<Rule>;
export type PaginatedEventsResponse = PaginatedResponse<EventRecord>;

export type GetEventsParams = {
  page?: number;
  limit?: number;
  eventTypeId?: string;
  userId?: string;
  status?: EventStatus;
  createdAt?: string;
};

export type GetMyEventsParams = {
  page?: number;
  limit?: number;
  eventTypeId?: string;
  status?: EventStatus;
  createdAt?: string;
};

export type CreateEventPayload = {
  payload: Record<string, unknown>;
  eventTypeId: string;
  userId?: string;
};

export type UpdateEventPayload = {
  payload?: Record<string, unknown>;
  status?: EventStatus;
};

export type RuleRecord = Rule;

export function orderedRuleActions(rule: Rule): RuleAction[] {
  if (!Array.isArray(rule.ruleActions) || rule.ruleActions.length === 0) {
    return [];
  }
  return [...rule.ruleActions].sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Execution order: action type ids from `ruleActions`. */
export function ruleActionTypeIds(rule: Rule): string[] {
  return orderedRuleActions(rule).map((ra) => ra.actionType.id);
}

/** Human-readable action names in execution order (from API snapshots). */
export function ruleActionsSummary(rule: Rule): string {
  const actions = orderedRuleActions(rule);
  if (actions.length === 0) return "—";
  return actions.map((ra) => ra.actionType.name).join(", ");
}

export type MonitoringLogLevel = "info" | "warn" | "error";

export type MonitoringLog = {
  id: string;
  message: string;
  /** ISO 8601 */
  at: string;
  level: MonitoringLogLevel;
};

export type ActivityType =
  | "LOGIN"
  | "CREATE_INVITE"
  | "ACCEPT_INVITE"
  | "CREATE_USER"
  | "UPDATE_USER"
  | "DELETE_USER_FROM_ORG"
  | "DELETE_USER_FROM_SYSTEM";

export type ActivityLog = {
  id: string;
  type: ActivityType;
  createdAt: string;
  userEmail: string;
};

export type GetActivitiesParams = {
  page?: number;
  limit?: number;
  type?: ActivityType;
  createdAt?: string;
};

export type PaginatedActivitiesResponse = PaginatedResponse<ActivityLog>;

export type MonitorState = "ok" | "healthy" | "degraded" | "down" | "error";

export type MonitorLiveResponse = {
  live: boolean;
  at?: string;
};

export type MonitorReadyResponse = {
  ready: boolean;
  status?: MonitorState | string;
  at?: string;
};

export type MonitorVersionResponse = {
  env: string;
  version: string;
  uptime: number;
  node: string;
  at?: string;
};

export type MonitorDependencyHealth = {
  status: MonitorState | string;
  latencyMs?: number;
  details?: string;
};

export type MonitorHealthResponse = {
  status: MonitorState | string;
  dependencies: {
    database: MonitorDependencyHealth;
    redis: MonitorDependencyHealth;
    events_queue: MonitorDependencyHealth;
    memory_heap: MonitorDependencyHealth;
  };
  at?: string;
};

export type MonitorQueueEventsStatus = {
  waiting: number;
  active: number;
  delayed: number;
  failed: number;
  completed: number;
};

export type MonitorStatusResponse = {
  queue: {
    events: MonitorQueueEventsStatus;
  };
  events: {
    stuck: number;
    failedLastHour: number;
  };
  notifications: {
    failedLastHour: number;
  };
  worker: {
    lastEventLogAt: string | null;
  };
  at?: string;
};
