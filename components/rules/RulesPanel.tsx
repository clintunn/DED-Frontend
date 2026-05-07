"use client";

import React from "react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { ErrorBanner } from "@/components/feedback/ErrorBanner";
import { LoadingState } from "@/components/feedback/LoadingState";
import {
  ApiError,
  createRule,
  deleteRule,
  getActionTypes,
  getEventTypes,
  getRules,
  updateRule,
} from "@/lib/api";
import type { ActionType, EventType, Rule } from "@/types";
import { ruleActionTypeIds, ruleActionsSummary } from "@/types";
import {
  adminDangerOutlineButtonCompact,
  adminInputClass,
  adminPanelClass,
  adminPrimaryButton,
  adminSecondaryButton,
  adminTableActionButton,
} from "@/lib/admin-form-classes";

export type RulesPanelMode = "all" | "create";

type RulesPanelProps = {
  mode?: RulesPanelMode;
};

function recommendedActionTypeId(types: EventType[], eventTypeId: string): string | null {
  const t = types.find((x) => x.id === eventTypeId);
  if (!t?.recommendedActionType) return null;
  if (typeof t.recommendedActionType === "string") {
    return t.recommendedActionType;
  }
  return t.recommendedActionType.id ?? null;
}

export function RulesPanel({ mode = "all" }: RulesPanelProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === "ORG_ADMIN";
  const [rules, setRules] = useState<Rule[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [actionTypes, setActionTypes] = useState<ActionType[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [dropdownError, setDropdownError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [eventTypeId, setEventTypeId] = useState("");
  const [selectedActionIds, setSelectedActionIds] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const showListSection = mode === "all";
  const showCreateSection = mode === "create" || editingRuleId !== null;
  const safeRules = Array.isArray(rules) ? rules : [];

  const recommendedIdForSelection = useMemo(
    () => recommendedActionTypeId(eventTypes, eventTypeId),
    [eventTypes, eventTypeId]
  );
  const recommendedLabel = useMemo(() => {
    if (!recommendedIdForSelection) return null;
    return (
      actionTypes.find((a) => a.id === recommendedIdForSelection)?.name ??
      recommendedIdForSelection
    );
  }, [recommendedIdForSelection, actionTypes]);

  useEffect(() => {
    Promise.all([getRules(), getEventTypes(), getActionTypes()])
      .then(([rulesData, eventTypesData, actionTypesData]) => {
        setRules(Array.isArray(rulesData.items) ? rulesData.items : []);
        setEventTypes(Array.isArray(eventTypesData) ? eventTypesData : []);
        setActionTypes(Array.isArray(actionTypesData) ? actionTypesData : []);
        setListError(null);
        setDropdownError(null);
      })
      .catch((e) => {
        const message =
          e instanceof ApiError ? e.message : "Failed to load rules data.";
        setListError(message);
        setDropdownError("Failed to load rule configuration options.");
      })
      .finally(() => setListLoading(false));
  }, []);

  function resetForm() {
    setName("");
    setEventTypeId("");
    setSelectedActionIds([]);
    setIsActive(true);
    setEditingRuleId(null);
  }

  function toggleSelectedAction(actionId: string) {
    setSelectedActionIds((prev) =>
      prev.includes(actionId)
        ? prev.filter((xid) => xid !== actionId)
        : [...prev, actionId]
    );
    if (formError) setFormError("");
  }

  function moveSelectedAction(actionId: string, delta: -1 | 1) {
    setSelectedActionIds((prev) => {
      const i = prev.indexOf(actionId);
      if (i < 0) return prev;
      const j = i + delta;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      const a = next[i];
      const b = next[j];
      if (a === undefined || b === undefined) return prev;
      next[i] = b;
      next[j] = a;
      return next;
    });
    if (formError) setFormError("");
  }

  function includeRecommendedAction() {
    if (!recommendedIdForSelection) return;
    setSelectedActionIds((prev) =>
      prev.includes(recommendedIdForSelection)
        ? prev
        : [...prev, recommendedIdForSelection]
    );
    if (formError) setFormError("");
  }

  function requireAdminMutation(): boolean {
    if (isAdmin) return true;
    setFormError("Only organization admins can modify rules.");
    setFormSuccess("");
    return false;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!requireAdminMutation()) return;

    const n = name.trim();
    const et = eventTypeId.trim();
    const ids = selectedActionIds.map((xid) => xid.trim()).filter(Boolean);

    if (!n || !et || ids.length === 0) {
      setFormError("Name, event type, and at least one action type are required.");
      setFormSuccess("");
      return;
    }

    setFormError("");
    setFormSuccess("");
    setSaving(true);
    try {
      if (editingRuleId) {
        const updated = await updateRule(editingRuleId, {
          name: n,
          eventTypeId: et,
          actionTypeIds: ids,
          isActive,
        });
        setRules((prev) =>
          prev.map((rule) => (rule.id === editingRuleId ? updated : rule))
        );
        setFormSuccess("Rule updated successfully.");
      } else {
        const created = await createRule({
          name: n,
          eventTypeId: et,
          actionTypeIds: ids,
          isActive,
        });
        setRules((prev) => [...prev, created]);
        setFormSuccess("Rule created successfully.");
      }
      resetForm();
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : "Could not save rule."
      );
      setFormSuccess("");
    } finally {
      setSaving(false);
    }
  }

  function getNameById(collection: EventType[] | ActionType[], id: string): string {
    return collection.find((item) => item.id === id)?.name ?? id;
  }

  /** Recommended action comes from event type catalog, not persisted on the rule. */
  function recommendedCatalogLabel(rule: Rule): string {
    const rid = recommendedActionTypeId(eventTypes, rule.eventTypeId);
    if (!rid) return "—";
    return getNameById(actionTypes, rid);
  }

  function actionsCellLabel(rule: Rule): string {
    const summary = ruleActionsSummary(rule);
    if (summary !== "—") return summary;
    const ids = ruleActionTypeIds(rule);
    if (ids.length === 0) return "—";
    return ids.map((xid) => getNameById(actionTypes, xid)).join(", ");
  }

  function startEdit(rule: Rule) {
    if (!showListSection) return;
    if (!requireAdminMutation()) return;
    setEditingRuleId(rule.id);
    setName(rule.name);
    setEventTypeId(rule.eventTypeId);
    setSelectedActionIds(ruleActionTypeIds(rule));
    setIsActive(rule.isActive);
    setFormError("");
    setFormSuccess("");
  }

  async function handleDelete(id: string) {
    if (!requireAdminMutation()) return;
    setDeletingId(id);
    setFormError("");
    setFormSuccess("");
    try {
      await deleteRule(id);
      setRules((prev) => prev.filter((rule) => rule.id !== id));
      setFormSuccess("Rule deleted successfully.");
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : "Could not delete rule."
      );
    } finally {
      setDeletingId(null);
    }
  }

  const adminColSpan = isAdmin ? 6 : 5;

  return (
    <div className="space-y-6">
      <p className="text-sm leading-relaxed break-words text-brand">
        {mode === "create" ? (
          <>
            <strong className="text-ink">Create</strong> a new automation rule for incoming events.
          </>
        ) : isAdmin ? (
          <>
            <strong className="text-ink">Manage</strong> automation rules for incoming events.
          </>
        ) : (
          <>
            You have <strong className="text-ink">read-only</strong> access to rules. Contact an
            organization admin to make changes.
          </>
        )}
      </p>
      {isAdmin && showCreateSection ? (
        <div className={adminPanelClass}>
          <h2 className="text-base font-semibold text-ink">
            {editingRuleId ? "Edit rule" : "Create rule"}
          </h2>
          <p className="mt-1 text-sm text-brand">
            Choose an event type, pick one or more actions, arrange execution order, and set whether
            the rule is active.
          </p>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {formError ? (
              <p
                className="text-sm text-red-600"
                role="alert"
              >
                {formError}
              </p>
            ) : null}
            {formSuccess ? (
              <p
                className="text-sm text-emerald-700"
                role="status"
              >
                {formSuccess}
              </p>
            ) : null}
            <div>
              <label
                htmlFor="rule-name"
                className="block text-sm font-medium text-brand"
              >
                Name
              </label>
              <input
                id="rule-name"
                name="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (formError) setFormError("");
                }}
                className={adminInputClass}
                autoComplete="off"
                disabled={saving}
                required
              />
            </div>
            <div>
              <label
                htmlFor="rule-event-type"
                className="block text-sm font-medium text-brand"
              >
                Event type
              </label>
              <select
                id="rule-event-type"
                name="eventTypeId"
                value={eventTypeId}
                onChange={(e) => {
                  setEventTypeId(e.target.value);
                  if (formError) setFormError("");
                }}
                className={adminInputClass}
                disabled={saving}
                required
              >
                <option value="">Select an event type</option>
                {eventTypes.map((eventType) => (
                  <option key={eventType.id} value={eventType.id}>
                    {eventType.name}
                  </option>
                ))}
              </select>
              {recommendedIdForSelection ? (
                <div className="mt-3 rounded-xl border border-subtleBorder bg-surface/80 p-3 text-sm">
                  <p className="text-brand">
                    Recommended action type for this event:{" "}
                    <strong className="text-ink">{recommendedLabel}</strong>
                  </p>
                  <p className="mt-1 text-xs text-brand">
                    Add it to your selected actions below with the button if you want it in this rule.
                  </p>
                  <button
                    type="button"
                    disabled={saving || !recommendedIdForSelection}
                    onClick={() => includeRecommendedAction()}
                    className={`mt-2 ${adminTableActionButton} disabled:opacity-50`}
                  >
                    Include recommended action
                  </button>
                </div>
              ) : null}
            </div>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-brand">
                Action types
              </legend>
              <p className="text-xs text-brand">
                Checked actions are included. Reorder them below to set run order.
              </p>
              <div className="max-h-48 space-y-2 overflow-y-auto rounded-xl border border-subtleBorder bg-raised/80 p-3">
                {actionTypes.length === 0 ? (
                  <p className="text-sm text-brand">No action types loaded.</p>
                ) : (
                  actionTypes.map((actionType) => {
                    const cid = actionType.id;
                    const checked = selectedActionIds.includes(cid);
                    return (
                      <label
                        key={cid}
                        htmlFor={`rule-action-${cid}`}
                        className="flex cursor-pointer items-start gap-2 rounded-lg py-1.5 hover:bg-surface"
                      >
                        <input
                          id={`rule-action-${cid}`}
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSelectedAction(cid)}
                          disabled={saving}
                          className="mt-1 h-4 w-4 rounded border-subtleBorder text-brand focus:ring-2 focus:ring-accent/30"
                        />
                        <span className="text-sm text-ink">{actionType.name}</span>
                      </label>
                    );
                  })
                )}
              </div>
              {selectedActionIds.length > 0 ? (
                <div className="mt-3 rounded-xl border border-subtleBorder bg-surface/80 p-3">
                  <p className="text-xs font-medium text-brand">
                    Execution order
                  </p>
                  <p className="mt-0.5 text-xs text-brand">
                    Actions run from top to bottom.
                  </p>
                  <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-ink">
                    {selectedActionIds.map((aid) => {
                      const label = getNameById(actionTypes, aid);
                      return (
                        <li key={aid}>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="min-w-0 flex-1 break-words">{label}</span>
                            <div className="flex shrink-0 gap-1">
                              <button
                                type="button"
                                disabled={saving}
                                aria-label={`Move ${label} up`}
                                onClick={() => moveSelectedAction(aid, -1)}
                                className={adminTableActionButton}
                              >
                                Up
                              </button>
                              <button
                                type="button"
                                disabled={saving}
                                aria-label={`Move ${label} down`}
                                onClick={() => moveSelectedAction(aid, 1)}
                                className={adminTableActionButton}
                              >
                                Down
                              </button>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              ) : null}
            </fieldset>
            <label className="inline-flex items-center gap-2 text-sm text-brand">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-subtleBorder text-brand focus:ring-2 focus:ring-accent/30"
                disabled={saving}
              />
              Active
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <button type="submit" disabled={saving} className={adminPrimaryButton}>
                {saving
                  ? "Saving…"
                  : editingRuleId
                    ? "Update rule"
                    : "Create rule"}
              </button>
              {editingRuleId ? (
                <button type="button" onClick={resetForm} className={adminSecondaryButton}>
                  Cancel edit
                </button>
              ) : null}
            </div>
          </form>
        </div>
      ) : null}

      {dropdownError ? <ErrorBanner message={dropdownError} /> : null}

      {listLoading ? (
        <LoadingState variant="table" label="Loading rules…" />
      ) : null}

      {listError && !listLoading ? <ErrorBanner message={listError} /> : null}

      {!listLoading && showListSection ? (
        <div className="overflow-x-auto rounded-2xl bg-raised shadow-soft ring-1 ring-subtleBorder/50">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-subtleBorder">
                <th className="px-4 py-3 font-medium text-brand">Name</th>
                <th className="px-4 py-3 font-medium text-brand">Event type</th>
                <th className="px-4 py-3 font-medium text-brand">Action types</th>
                <th className="px-4 py-3 font-medium text-brand">Recommended action</th>
                <th className="px-4 py-3 font-medium text-brand">Active</th>
                {isAdmin ? (
                  <th className="px-4 py-3 font-medium text-brand">Actions</th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {safeRules.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-sm text-brand"
                    colSpan={adminColSpan}
                  >
                    No rules found.
                  </td>
                </tr>
              ) : null}
              {safeRules.map((rule) => (
                <tr
                  key={rule.id}
                  className="border-b border-subtleBorder/70 last:border-b-0"
                >
                  <td className="max-w-[10rem] break-words px-4 py-3 font-medium text-ink">
                    {rule.name}
                  </td>
                  <td className="px-4 py-3 text-ink">
                    <code className="rounded bg-surface px-1.5 py-0.5 text-xs whitespace-normal break-all">
                      {getNameById(eventTypes, rule.eventTypeId)}
                    </code>
                  </td>
                  <td className="max-w-[12rem] break-words px-4 py-3 text-ink sm:max-w-md">
                    <span className="text-xs sm:text-sm">
                      {actionsCellLabel(rule)}
                    </span>
                  </td>
                  <td className="max-w-[8rem] break-words px-4 py-3 text-xs text-ink sm:text-sm">
                    {recommendedCatalogLabel(rule)}
                  </td>
                  <td className="px-4 py-3 text-ink">
                    {rule.isActive ? "Yes" : "No"}
                  </td>
                  {isAdmin ? (
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(rule)}
                          className={adminTableActionButton}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(rule.id)}
                          disabled={deletingId === rule.id}
                          className={adminDangerOutlineButtonCompact}
                        >
                          {deletingId === rule.id ? "Deleting…" : "Delete"}
                        </button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
