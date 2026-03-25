'use client';

import { MonthlyMetricSummary } from '../types/sqo';

type Props = {
  current: MonthlyMetricSummary;
  previous: MonthlyMetricSummary | null;
};

type MetricConfig = {
  key: keyof Pick<
    MonthlyMetricSummary,
    'earnedPoints' | 'potentialPoints' | 'meetings' | 'dateSets' | 'sourceTotal' | 'statusTotal' | 'aeTotal'
  >;
  label: string;
};

const METRICS: MetricConfig[] = [
  { key: 'earnedPoints', label: 'Earned Points' },
  { key: 'potentialPoints', label: 'Potential Points' },
  { key: 'meetings', label: 'Meetings' },
  { key: 'dateSets', label: 'Date Sets' },
  { key: 'sourceTotal', label: 'Source Rows' },
  { key: 'statusTotal', label: 'Status Rows' },
  { key: 'aeTotal', label: 'A.E. Rows' },
];

function getDeltaTone(delta: number) {
  if (delta > 0) return 'text-green-600';
  if (delta < 0) return 'text-red-600';
  return 'text-slate/60';
}

function formatDelta(delta: number) {
  if (delta > 0) return `+${delta}`;
  return `${delta}`;
}

export default function ComparisonSummary({ current, previous }: Props) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {METRICS.map(({ key, label }) => {
        const currentValue = current[key];
        const previousValue = previous ? previous[key] : 0;
        const delta = currentValue - previousValue;

        return (
          <div key={key} className="card p-4">
            <p className="section-title">{label}</p>
            <div className="mt-3 flex items-end justify-between gap-4">
              <div>
                <div className="text-3xl font-semibold">{currentValue}</div>
                <div className="mt-1 text-xs text-slate/60">{current.monthLabel}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-slate/70">{previous ? previousValue : '—'}</div>
                <div className="mt-1 text-xs text-slate/60">{previous ? previous.monthLabel : 'No prior month'}</div>
              </div>
            </div>
            <div className={`mt-4 text-sm font-semibold ${getDeltaTone(delta)}`}>
              {previous ? `${formatDelta(delta)} vs prior month` : 'First month in range'}
            </div>
          </div>
        );
      })}
    </section>
  );
}
