import { formatDate } from '../lib/dateUtils';

export default function KpiStrip({
  total,
  dateMin,
  dateMax,
  missingMeeting,
  missingStatus,
  missingSource,
  missingAe,
}: {
  total: number;
  dateMin: Date | null;
  dateMax: Date | null;
  missingMeeting: number;
  missingStatus: number;
  missingSource: number;
  missingAe: number;
}) {
  const missingClass = (value: number) =>
    value > 0 ? 'bg-red-50 ring-1 ring-red-200 text-red-700' : 'bg-white/90';

  return (
    <div className="grid gap-3 lg:grid-cols-6">
      <div className="card p-4">
        <div className="text-xs text-slate/60">Total rows</div>
        <div className="text-lg font-semibold">{total.toLocaleString()}</div>
      </div>
      <div className="card p-4">
        <div className="text-xs text-slate/60">Meeting date range</div>
        <div className="text-sm font-semibold">
          {formatDate(dateMin)} → {formatDate(dateMax)}
        </div>
      </div>
      <div className={`card p-4 ${missingClass(missingMeeting)}`}>
        <div className="text-xs text-slate/60">Missing Meeting Date</div>
        <div className="text-lg font-semibold">{missingMeeting.toFixed(1)}%</div>
      </div>
      <div className={`card p-4 ${missingClass(missingStatus)}`}>
        <div className="text-xs text-slate/60">Missing Status</div>
        <div className="text-lg font-semibold">{missingStatus.toFixed(1)}%</div>
      </div>
      <div className={`card p-4 ${missingClass(missingSource)}`}>
        <div className="text-xs text-slate/60">Missing Source</div>
        <div className="text-lg font-semibold">{missingSource.toFixed(1)}%</div>
      </div>
      <div className={`card p-4 ${missingClass(missingAe)}`}>
        <div className="text-xs text-slate/60">Missing A.E.</div>
        <div className="text-lg font-semibold">{missingAe.toFixed(1)}%</div>
      </div>
    </div>
  );
}
