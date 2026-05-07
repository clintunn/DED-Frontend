import { NextResponse } from "next/server";
import { initialRules } from "@/lib/mock-rules";
import type { RuleRecord } from "@/types";

let rules: RuleRecord[] = [...initialRules];

function dedupeIds(ids: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of ids) {
    const id = raw.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

export async function GET() {
  return NextResponse.json(rules);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const b = body as {
    name?: unknown;
    eventTypeId?: unknown;
    actionTypeIds?: unknown;
    isActive?: unknown;
  };

  const name = typeof b.name === "string" ? b.name.trim() : "";
  const eventTypeId =
    typeof b.eventTypeId === "string" ? b.eventTypeId.trim() : "";
  const isActive = typeof b.isActive === "boolean" ? b.isActive : true;

  const rawIds = Array.isArray(b.actionTypeIds)
    ? b.actionTypeIds.map((x) => String(x))
    : [];
  const actionTypeIds = dedupeIds(rawIds);

  if (!name || !eventTypeId || actionTypeIds.length === 0) {
    return NextResponse.json(
      {
        error:
          "Fields `name`, `eventTypeId`, and a non-empty `actionTypeIds` array are required",
      },
      { status: 400 }
    );
  }

  const ruleId = `rule_${crypto.randomUUID()}`;
  const rule: RuleRecord = {
    id: ruleId,
    name,
    eventTypeId,
    ruleActions: actionTypeIds.map((actionTypeId, i) => ({
      id: `${ruleId}-ra-${i}`,
      sortOrder: i,
      actionType: { id: actionTypeId, name: actionTypeId },
    })),
    isActive,
  };

  rules = [...rules, rule];
  return NextResponse.json(rule, { status: 201 });
}
