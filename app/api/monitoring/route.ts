import { NextResponse } from "next/server";
import { monitoringStats, recentLogs } from "@/lib/monitoring-mock";

export async function GET() {
  return NextResponse.json({
    stats: monitoringStats,
    logs: recentLogs,
  });
}
