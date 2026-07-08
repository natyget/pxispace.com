export default function DashboardPageLoading({ label = 'Loading workspace' }) {
  return (
    <div className="mx-auto flex min-h-[min(640px,calc(100vh-8rem))] max-w-6xl items-center justify-center">
      <div className="dashboard-surface-b w-full max-w-md rounded-[2rem] p-6">
        <div className="flex items-center gap-4">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/[0.055]">
            <img src="/favicon.png" alt="PXI" className="h-9 w-auto translate-y-[3px] object-contain" />
            <span className="absolute inset-0 rounded-full border border-white/10" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/35">PXI</p>
            <p className="mt-1 text-sm font-semibold text-white/75">{label}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
