import { NextRequest, NextResponse } from "next/server";
import { updateDayExerciseTargets, removeExerciseFromDay } from "@/lib/queries";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dayExerciseId = Number(id);
  const { targetSets, targetRepLow, targetRepHigh, incrementKg } = await request.json();

  if (
    !Number.isInteger(dayExerciseId) ||
    typeof targetSets !== "number" ||
    typeof targetRepLow !== "number" ||
    typeof targetRepHigh !== "number" ||
    typeof incrementKg !== "number"
  ) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  await updateDayExerciseTargets(dayExerciseId, { targetSets, targetRepLow, targetRepHigh, incrementKg });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dayExerciseId = Number(id);
  if (!Number.isInteger(dayExerciseId)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  await removeExerciseFromDay(dayExerciseId);
  return NextResponse.json({ ok: true });
}
