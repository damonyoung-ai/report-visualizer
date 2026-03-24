type Props = {
  points: number;
  potentialPoints: number;
  quota: number;
};

function getState(points: number, quota: number): 'under' | 'at' | 'over' {
  return points < quota ? 'under' : points === quota ? 'at' : 'over';
}

function getBarColor(state: 'under' | 'at' | 'over') {
  return state === 'under' ? 'bg-red-500' : state === 'at' ? 'bg-yellow-400' : 'bg-green-500';
}

function getTextColor(state: 'under' | 'at' | 'over') {
  return state === 'under' ? 'text-red-600' : state === 'at' ? 'text-yellow-600' : 'text-green-600';
}

export default function QuotaTracker({ points, potentialPoints, quota }: Props) {
  const progress = quota > 0 ? Math.min((points / quota) * 100, 100) : 0;
  const remaining = Math.max(quota - points, 0);
  const overage = Math.max(points - quota, 0);
  const potentialRemaining = Math.max(quota - potentialPoints, 0);
  const potentialOverage = Math.max(potentialPoints - quota, 0);
  const state = getState(points, quota);
  const potentialState = getState(potentialPoints, quota);
  const barColorClass = getBarColor(state);
  const statusColorClass = getTextColor(state);
  const potentialStatusColorClass = getTextColor(potentialState);

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="section-title">Quota Tracker</p>
          <h3 className="text-lg font-semibold">Earned: {points} / {quota} points</h3>
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
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm font-semibold">Potential: {potentialPoints} / {quota} points</div>
        <div className={`text-sm font-semibold ${potentialStatusColorClass}`}>
          {potentialState === 'over'
            ? `+${potentialOverage} over`
            : potentialState === 'at'
              ? 'Goal reached'
              : `${potentialRemaining} remaining`}
        </div>
      </div>
      <p className="mt-2 text-xs text-slate/60">
        Scoring: <span className="font-semibold">Upsell = 1</span>, <span className="font-semibold">All other Source values = 2</span>
      </p>
    </div>
  );
}
