export function DashboardRouteSkeleton() {
  return (
    <div className="h-screen bg-[#050505] flex overflow-hidden">
      <aside className="hidden md:flex w-[240px] border-r border-white/5 bg-black p-6 flex-col">
        <div className="h-10 w-24 bg-white/10 rounded-full animate-pulse mb-8" />
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-11 w-full rounded-full bg-white/5 animate-pulse" />
          ))}
        </div>
        <div className="mt-auto h-12 w-full rounded-full bg-white/5 animate-pulse" />
      </aside>
      <main className="flex-1 p-6 md:p-8 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="h-8 w-56 rounded-lg bg-white/10 animate-pulse" />
          <div className="h-4 w-80 rounded bg-white/5 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-40 rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
          <div className="h-72 rounded-2xl bg-white/5 animate-pulse" />
        </div>
      </main>
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

export function GenericPageSkeleton() {
  return (
    <div className="min-h-screen bg-[#050505] p-6 md:p-10">
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="h-8 w-48 rounded-lg bg-white/10 animate-pulse" />
        <div className="h-4 w-72 rounded bg-white/5 animate-pulse" />
        <div className="h-40 rounded-2xl bg-white/5 animate-pulse" />
        <div className="h-40 rounded-2xl bg-white/5 animate-pulse" />
      </div>
    </div>
  );
}
