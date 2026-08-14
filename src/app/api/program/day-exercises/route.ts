import { NextRequest, NextResponse } from "next/server";
import { addExerciseToDay } from "@/lib/queries";

export async function POST(request: NextRequest) {
  const { programDayId, exerciseId, targetSets, targetRepLow, targetRepHigh, incrementKg } =
    await request.json();

  if (
    typeof programDayId !== "number" ||
    typeof exerciseId !== "number" ||
    typeof targetSets !== "number" ||
    typeof targetRepLow !== "number" ||
    typeof targetRepHigh !== "number" ||
    typeof incrementKg !== "number"
  ) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  await addExerciseToDay(programDayId, exerciseId, { targetSets, targetRepLow, targetRepHigh, incrementKg });
  return NextResponse.json({ ok: true });
}
