import type { SessionSets } from "./queries";

export type ProgressionSuggestion =
  | { type: "increase"; fromWeight: number; toWeight: number }
  | { type: "stalled" }
  | { type: "in_progress" }
  | { type: "insufficient_data" };

/** Epley formula — a standard estimate, not a measurement. */
function estimate1RM(weightKg: number, reps: number): number {
  return weightKg * (1 + reps / 30);
}

function sessionTopEstimate(session: SessionSets): number {
  return Math.max(...session.sets.map((s) => estimate1RM(s.weightKg, s.reps)));
}

function maxedOut(session: SessionSets, targetSets: number, targetRepHigh: number): number | null {
  if (session.sets.length < targetSets) return null;
  const weight = session.sets[0].weightKg;
  const allAtTop = session.sets.every((s) => s.weightKg === weight && s.reps >= targetRepHigh);
  return allAtTop ? weight : null;
}

/**
 * PRD §3 double-progression rule: within the rep range first, then +increment
 * once every set hits the top of the range at the same weight for 2
 * consecutive sessions. Stall flag: no est. 1RM improvement across 4 sessions.
 */
export function computeProgressionSuggestion(
  recentSessions: SessionSets[],
  targets: { targetRepHigh: number; targetSets: number; incrementKg: number }
): ProgressionSuggestion {
  if (recentSessions.length < 2) return { type: "insufficient_data" };

  const lastTwo = recentSessions.slice(-2);
  const weights = lastTwo.map((s) => maxedOut(s, targets.targetSets, targets.targetRepHigh));
  if (weights[0] !== null && weights[0] === weights[1]) {
    return { type: "increase", fromWeight: weights[0], toWeight: weights[0] + targets.incrementKg };
  }

  if (recentSessions.length >= 4) {
    const lastFour = recentSessions.slice(-4);
    const estimates = lastFour.map(sessionTopEstimate);
    const latest = estimates[estimates.length - 1];
    const bestBefore = Math.max(...estimates.slice(0, -1));
    if (latest <= bestBefore) return { type: "stalled" };
  }

  return { type: "in_progress" };
}
