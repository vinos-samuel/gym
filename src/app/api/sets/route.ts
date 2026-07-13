import { NextRequest, NextResponse } from "next/server";
import { logSet } from "@/lib/queries";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { workoutId, exerciseId, setNumber, weightKg, reps, clientId } = body;

  if (
    typeof workoutId !== "number" ||
    typeof exerciseId !== "number" ||
    typeof setNumber !== "number" ||
    typeof weightKg !== "number" ||
    typeof reps !== "number" ||
    typeof clientId !== "string"
  ) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const id = await logSet({ workoutId, exerciseId, setNumber, weightKg, reps, clientId });
  return NextResponse.json({ id });
}
