import { NextRequest, NextResponse } from "next/server";
import { updateSet } from "@/lib/queries";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { workoutId, exerciseId, setNumber, weightKg, reps } = body;

  if (
    typeof workoutId !== "number" ||
    typeof exerciseId !== "number" ||
    typeof setNumber !== "number" ||
    typeof weightKg !== "number" ||
    typeof reps !== "number"
  ) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  await updateSet({ workoutId, exerciseId, setNumber, weightKg, reps });
  return NextResponse.json({ ok: true });
}
