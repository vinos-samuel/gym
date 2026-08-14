export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-xs">
        <h1 className="mb-8 text-center text-2xl font-semibold text-accent">GYM</h1>
        <form method="POST" action="/api/login" className="flex flex-col gap-4">
          <input
            type="password"
            name="passphrase"
            autoFocus
            autoComplete="current-password"
            placeholder="Passphrase"
            className="rounded-xl border border-stone-300 bg-stone-50 px-4 py-4 text-lg text-stone-900 placeholder:text-stone-400 focus:border-stone-500 focus:outline-none dark:border-stone-800 dark:bg-stone-900 dark:text-stone-50 dark:placeholder:text-stone-600"
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
