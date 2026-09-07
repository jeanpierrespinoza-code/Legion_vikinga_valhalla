import { statusFromAverage } from '@/lib/calc';
import { formatScore } from '@/lib/calc';

export function StatusBadge({ avg }: { avg: number | null }) {
  const status = statusFromAverage(avg);
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${status.bg} ${status.text} ${status.border}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          status.color === 'red'
            ? 'bg-red-400'
            : status.color === 'amber'
            ? 'bg-amber-400'
            : status.color === 'emerald'
            ? 'bg-emerald-400'
            : 'bg-slate-500'
        }`}
      />
      {status.label}
      {avg !== null && <span className="opacity-60">· {formatScore(avg)}</span>}
    </span>
  );
}
