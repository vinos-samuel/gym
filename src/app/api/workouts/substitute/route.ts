import { NextRequest, NextResponse } from "next/server";
import { setWorkoutSubstitution, removeWorkoutSubstitution, getLastSessionSets } from "@/lib/queries";

export async function POST(request: NextRequest) {
  const { workoutId, dayExerciseId, substituteExerciseId } = await request.json();
  if (
    typeof workoutId !== "number" ||
    typeof dayExerciseId !== "number" ||
    typeof substituteExerciseId !== "number"
  ) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  await setWorkoutSubstitution(workoutId, dayExerciseId, substituteExerciseId);
  const lastSets = await getLastSessionSets(substituteExerciseId);
  return NextResponse.json({ lastSets });
}

export async function DELETE(request: NextRequest) {
  const { workoutId, dayExerciseId } = await request.json();
  if (typeof workoutId !== "number" || typeof dayExerciseId !== "number") {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  await removeWorkoutSubstitution(workoutId, dayExerciseId);
  return NextResponse.json({ ok: true });
}
