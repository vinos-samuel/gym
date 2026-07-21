export default function ProgressLoading() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 bg-zinc-50 px-4 pb-10 pt-6 dark:bg-zinc-950">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Progress</h1>
      </header>
      <div className="flex flex-col gap-4 animate-pulse">
        <div className="h-40 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-40 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-40 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
      </div>
    </div>
  );
}
