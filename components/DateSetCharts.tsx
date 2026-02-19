'use client';

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import ChartCard from './ChartCard';
import { CanonicalRow } from '../types/sqo';
import { dateSetSeries } from '../lib/aggregations';

export default function DateSetCharts({
  rows,
  groupBy,
  onGroupByChange,
}: {
  rows: CanonicalRow[];
  groupBy: 'day' | 'week' | 'month';
  onGroupByChange: (value: 'day' | 'week' | 'month') => void;
}) {
  const series = dateSetSeries(rows, groupBy);

  return (
    <div className="grid gap-6 lg:grid-cols-1">
      <ChartCard title="Sets over time" subtitle="Date Set">
        <div className="mb-3 flex items-center gap-3 text-xs">
          <span>Group by</span>
          <select className="input" value={groupBy} onChange={(event) => onGroupByChange(event.target.value as 'day' | 'week' | 'month')}>
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={series} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            <XAxis dataKey="x" tick={{ fontSize: 11 }} />
            <YAxis />
            <Tooltip cursor={false} />
            <Line type="monotone" dataKey="y" stroke="#ef4444" strokeWidth={2} dot={false} isAnimationActive />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
