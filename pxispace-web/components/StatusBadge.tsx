type Status = 'live' | 'upcoming' | 'memory';

interface StatusBadgeProps {
  status: Status;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const colors = {
    live: '#22c55e',
    upcoming: '#f59e0b',
    memory: '#6b7280',
  };

  const labels = {
    live: 'Live',
    upcoming: 'Pending',
    memory: 'Memory',
  };

  return (
    <div
      className="px-2.5 py-1 rounded-full text-white text-xs font-bold uppercase tracking-wider shadow-lg"
      style={{ backgroundColor: colors[status] }}
    >
      {labels[status]}
    </div>
  );
}

