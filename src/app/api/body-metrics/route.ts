import { NextRequest, NextResponse } from "next/server";
import { logBodyMetric } from "@/lib/queries";

export async function POST(request: NextRequest) {
  const { date, type, value } = await request.json();
  if (
    typeof date !== "string" ||
    (type !== "bodyweight_kg" && type !== "waist_cm") ||
    typeof value !== "number"
  ) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  await logBodyMetric(date, type, value);
  return NextResponse.json({ ok: true });
}
