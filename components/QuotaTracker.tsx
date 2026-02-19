type Props = {
  points: number;
  quota: number;
};

export default function QuotaTracker({ points, quota }: Props) {
  const progress = quota > 0 ? Math.min((points / quota) * 100, 100) : 0;
  const remaining = Math.max(quota - points, 0);
  const overage = Math.max(points - quota, 0);

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="section-title">Quota Tracker</p>
          <h3 className="text-lg font-semibold">{points} / {quota} points</h3>
        </div>
        <div className={`text-sm font-semibold ${overage > 0 ? 'text-red-600' : 'text-slate/70'}`}>
          {overage > 0 ? `+${overage} over` : `${remaining} remaining`}
        </div>
      </div>
      <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-slate/10">
        <div
          className={`h-full rounded-full transition-all ${overage > 0 ? 'bg-red-500' : 'bg-accent'}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-slate/60">
        Scoring: <span className="font-semibold">Upsell = 1</span>, <span className="font-semibold">All other Source values = 2</span>
      </p>
    </div>
  );
}
