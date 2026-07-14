import { NextRequest, NextResponse } from "next/server";
import { updateWorkoutNotes } from "@/lib/queries";

export async function POST(request: NextRequest) {
  const { workoutId, notes } = await request.json();
  if (typeof workoutId !== "number" || typeof notes !== "string") {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  await updateWorkoutNotes(workoutId, notes);
  return NextResponse.json({ ok: true });
}
