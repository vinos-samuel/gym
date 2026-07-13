"use client";

const STORAGE_KEY = "gym_pending_sets";

export type QueuedSet = {
  clientId: string;
  workoutId: number;
  exerciseId: number;
  setNumber: number;
  weightKg: number;
  reps: number;
};

type Listener = (pendingCount: number) => void;
const listeners = new Set<Listener>();

function readQueue(): QueuedSet[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as QueuedSet[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: QueuedSet[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  listeners.forEach((fn) => fn(queue.length));
}

export function subscribePendingCount(fn: Listener): () => void {
  listeners.add(fn);
  fn(readQueue().length);
  return () => listeners.delete(fn);
}

async function trySend(item: QueuedSet): Promise<boolean> {
  try {
    const res = await fetch("/api/sets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    return res.ok;
  } catch {
    return false;
  }
}

let flushing = false;

export async function flushQueue(): Promise<void> {
  if (flushing) return;
  flushing = true;
  try {
    let queue = readQueue();
    for (const item of [...queue]) {
      const ok = await trySend(item);
      if (!ok) break; // stop on first failure — likely still offline, retry later
      queue = queue.filter((q) => q.clientId !== item.clientId);
      writeQueue(queue);
    }
  } finally {
    flushing = false;
  }
}

// Logs a set: tries immediately, falls back to the local queue on failure.
export async function logSetWithQueue(item: QueuedSet): Promise<void> {
  const ok = await trySend(item);
  if (!ok) {
    const queue = readQueue();
    queue.push(item);
    writeQueue(queue);
  }
}

export function initOfflineQueueSync() {
  if (typeof window === "undefined") return;
  window.addEventListener("online", () => void flushQueue());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void flushQueue();
  });
  void flushQueue();
}
