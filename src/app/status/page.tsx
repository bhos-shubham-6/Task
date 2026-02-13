async function fetchStatus() {
  try {
    const res = await fetch("/api/status", {
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Status request failed: ${res.status}`);
    }
    return res.json();
  } catch (error) {
    console.error("Failed to fetch status", error);
    return null;
  }
}

export default async function StatusPage() {
  const status = await fetchStatus();

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10 sm:py-14">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              System Status
            </h1>
            <p className="mt-1 text-xs text-zinc-600">
              Health checks for backend API, document store, and LLM
              configuration.
            </p>
          </div>
          <a
            href="/"
            className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 shadow-sm hover:bg-zinc-50"
          >
            Back to app
          </a>
        </header>

        {!status ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-700">
            Could not load status from the backend. Make sure the dev server is
            running.
          </div>
        ) : (
          <div className="space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-100">
            <p className="text-[11px] text-zinc-500">
              Last checked:{" "}
              <span className="font-mono">
                {new Date(status.timestamp).toLocaleString()}
              </span>
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <StatusCard
                label="Backend API"
                ok={status.checks.backend.ok}
                message={status.checks.backend.message}
              />
              <StatusCard
                label="Database"
                ok={status.checks.database.ok}
                message={status.checks.database.message}
              />
              <StatusCard
                label="LLM"
                ok={status.checks.llm.ok}
                message={status.checks.llm.message}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StatusCard(props: {
  label: string;
  ok: boolean;
  message: string;
}) {
  return (
    <div className="space-y-1 rounded-xl border border-zinc-100 bg-zinc-50 p-3 text-xs">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium text-zinc-800">{props.label}</p>
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            props.ok
              ? "bg-emerald-100 text-emerald-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {props.ok ? "Healthy" : "Issue"}
        </span>
      </div>
      <p className="text-[11px] text-zinc-600">{props.message}</p>
    </div>
  );
}

