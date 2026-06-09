export function DashboardRouteSkeleton() {
  return (
    <div className="dashboard-route-fade mx-auto max-w-6xl space-y-6">
      <div className="space-y-3">
        <div className="h-8 w-48 rounded-lg bg-white/[0.08] animate-pulse" />
        <div className="h-4 w-72 max-w-full rounded bg-white/[0.04] animate-pulse" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glow-surface-soft h-32 rounded-2xl animate-pulse" />
        ))}
      </div>
      <div className="glow-surface-soft h-72 rounded-2xl animate-pulse" />
    </div>
  );
}

export function DashboardSegmentSkeleton({ variant = 'default' }) {
  const cardCount = variant === 'account' ? 2 : 3;
  return (
    <div className="dashboard-route-fade max-w-6xl mx-auto space-y-7 md:space-y-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <div className="h-8 w-56 rounded-lg bg-white/10 animate-pulse" />
          <div className="h-4 w-80 max-w-full rounded bg-white/5 animate-pulse" />
        </div>
        <div className="h-9 w-28 rounded-full bg-white/5 animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: cardCount }).map((_, i) => (
          <div key={i} className="glow-surface h-36 rounded-2xl animate-pulse" />
        ))}
      </div>
      <div className="glow-surface h-80 rounded-2xl animate-pulse" />
      {variant === 'analytics' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="glow-surface h-72 rounded-2xl animate-pulse" />
          <div className="glow-surface h-72 rounded-2xl animate-pulse" />
        </div>
      ) : null}
    </div>
  );
}

export function DashboardListSkeleton() {
  return (
    <div className="dashboard-route-fade max-w-6xl mx-auto space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="h-8 w-40 rounded-lg bg-white/10 animate-pulse" />
          <div className="h-4 w-72 rounded bg-white/5 animate-pulse" />
        </div>
        <div className="h-10 w-32 rounded-xl bg-white/5 animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="glow-surface aspect-[3/4] rounded-[24px] animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export function PublicRouteSkeleton() {
  return (
    <div className="relative min-h-screen flex flex-col bg-black">
      <header className="h-16 border-b border-white/5 px-6 flex items-center">
        <div className="h-8 w-28 rounded-full bg-white/10 animate-pulse" />
      </header>
      <main className="flex-1 p-6 md:p-10">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="h-10 w-64 rounded-lg bg-white/10 animate-pulse" />
          <div className="h-4 w-96 rounded bg-white/5 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        </div>
      </main>
      <footer className="h-20 border-t border-white/5 px-6 flex items-center">
        <div className="h-5 w-40 rounded bg-white/10 animate-pulse" />
      </footer>
    </div>
  );
}

export function PublicLogoLoading() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050505]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(216,74,255,0.16),transparent_58%)]" />
      <div className="relative flex flex-col items-center gap-5">
        <div className="relative">
          <div className="absolute inset-[-14px] animate-pulse rounded-full bg-pxi-purple/20 blur-xl" />
          <img
            src="/Union.svg"
            alt="PXI"
            width={64}
            height={64}
            className="relative h-16 w-16 animate-[pulse_1.6s_ease-in-out_infinite]"
            draggable={false}
          />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-400">Loading PXI</p>
      </div>
    </div>
  );
}

export function GenericPageSkeleton() {
  return (
    <div className="dashboard-route-fade min-h-screen bg-[#050505] p-6 md:p-10">
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="h-8 w-48 rounded-lg bg-white/10 animate-pulse" />
        <div className="h-4 w-72 rounded bg-white/5 animate-pulse" />
        <div className="h-40 rounded-2xl bg-white/5 animate-pulse" />
        <div className="h-40 rounded-2xl bg-white/5 animate-pulse" />
      </div>
    </div>
  );
}
