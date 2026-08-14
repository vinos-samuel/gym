import { NextRequest, NextResponse } from "next/server";
import { reorderDayExercise } from "@/lib/queries";

export async function POST(request: NextRequest) {
  const { dayExerciseId, direction } = await request.json();
  if (typeof dayExerciseId !== "number" || (direction !== "up" && direction !== "down")) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  await reorderDayExercise(dayExerciseId, direction);
  return NextResponse.json({ ok: true });
}
