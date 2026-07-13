import { NextRequest, NextResponse } from "next/server";
import { completeWorkout } from "@/lib/queries";

export async function POST(request: NextRequest) {
  const { workoutId } = await request.json();
  if (typeof workoutId !== "number") {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  await completeWorkout(workoutId);
  return NextResponse.json({ ok: true });
}
