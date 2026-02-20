type Props = {
  points: number;
  quota: number;
};

export default function QuotaTracker({ points, quota }: Props) {
  const progress = quota > 0 ? Math.min((points / quota) * 100, 100) : 0;
  const remaining = Math.max(quota - points, 0);
  const overage = Math.max(points - quota, 0);
  const state: 'under' | 'at' | 'over' = points < quota ? 'under' : points === quota ? 'at' : 'over';
  const barColorClass =
    state === 'under' ? 'bg-red-500' : state === 'at' ? 'bg-yellow-400' : 'bg-green-500';
  const statusColorClass =
    state === 'under' ? 'text-red-600' : state === 'at' ? 'text-yellow-600' : 'text-green-600';

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="section-title">Quota Tracker</p>
          <h3 className="text-lg font-semibold">{points} / {quota} points</h3>
        </div>
        <div className={`text-sm font-semibold ${statusColorClass}`}>
          {state === 'over' ? `+${overage} over` : state === 'at' ? 'Goal reached' : `${remaining} remaining`}
        </div>
      </div>
      <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-slate/10">
        <div
          className={`h-full rounded-full transition-all ${barColorClass}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-slate/60">
        Scoring: <span className="font-semibold">Upsell = 1</span>, <span className="font-semibold">All other Source values = 2</span>
      </p>
    </div>
  );
}
