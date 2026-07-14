import { NextRequest, NextResponse } from "next/server";
import { reopenWorkout } from "@/lib/queries";

export async function POST(request: NextRequest) {
  const { workoutId } = await request.json();
  if (typeof workoutId !== "number") {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  await reopenWorkout(workoutId);
  return NextResponse.json({ ok: true });
}
