import Link from "next/link";
import { getFullProgram, getAllExercises } from "@/lib/queries";
import { ProgramEditor } from "@/components/ProgramEditor";

export const dynamic = "force-dynamic";

export default async function ProgramPage() {
  const [program, allExercises] = await Promise.all([getFullProgram(), getAllExercises()]);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 bg-background px-4 pb-10 pt-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-50">Program</h1>
        <Link
          href="/"
          className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground active:opacity-80"
        >
          ← Today
        </Link>
      </header>

      <p className="text-sm text-stone-500">
        Edit your program directly — changes take effect on your next visit to that day. Removing an
        exercise keeps its logged history; it just won&apos;t show up here going forward.
      </p>

      <ProgramEditor program={program} allExercises={allExercises} />
    </div>
  );
}
