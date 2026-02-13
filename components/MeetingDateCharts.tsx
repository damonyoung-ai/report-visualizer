'use client';

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';
import ChartCard from './ChartCard';
import { meetingDateSeries, dayOfWeekDistribution } from '../lib/aggregations';
import { CanonicalRow } from '../types/sqo';

export default function MeetingDateCharts({
  rows,
  groupBy,
  onGroupByChange,
  includeMissing,
  onIncludeMissingChange,
}: {
  rows: CanonicalRow[];
  groupBy: 'week' | 'month';
  onGroupByChange: (value: 'week' | 'month') => void;
  includeMissing: boolean;
  onIncludeMissingChange: (value: boolean) => void;
}) {
  const series = meetingDateSeries(rows, groupBy, includeMissing);
  const dayOfWeek = dayOfWeekDistribution(rows);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ChartCard title="Meetings over time" subtitle="Meeting Date">
        <div className="mb-3 flex items-center gap-3 text-xs">
          <span>Group by</span>
          <select className="input" value={groupBy} onChange={(event) => onGroupByChange(event.target.value as 'week' | 'month')}>
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={includeMissing} onChange={(event) => onIncludeMissingChange(event.target.checked)} />
            Include missing
          </label>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={series} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            <XAxis dataKey="x" tick={{ fontSize: 11 }} />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="y" stroke="#1f6feb" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Day-of-week distribution" subtitle="Meeting Date">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={dayOfWeek} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#12b981" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
