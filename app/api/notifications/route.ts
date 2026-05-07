import { NextResponse } from "next/server";
import { mockNotifications } from "@/lib/mock-notifications";

export async function GET() {
  return NextResponse.json(mockNotifications);
}
