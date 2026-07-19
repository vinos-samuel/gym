export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-white px-6 dark:bg-zinc-950">
      <div className="w-full max-w-xs">
        <h1 className="mb-8 text-center text-2xl font-semibold text-accent">GYM</h1>
        <form method="POST" action="/api/login" className="flex flex-col gap-4">
          <input
            type="password"
            name="passphrase"
            autoFocus
            autoComplete="current-password"
            placeholder="Passphrase"
            className="rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-4 text-lg text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-600"
          />
          {error && (
            <p className="text-sm text-red-500 dark:text-red-400" role="alert">
              Wrong passphrase. Try again.
            </p>
          )}
          <button
            type="submit"
            className="rounded-xl bg-accent px-4 py-4 text-lg font-medium text-accent-foreground active:opacity-80"
          >
            Enter
          </button>
        </form>
      </div>
    </div>
  );
}
