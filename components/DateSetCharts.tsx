'use client';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import ChartCard from './ChartCard';
import { CanonicalRow } from '../types/sqo';
import { dateSetDayOfWeekDistribution, dateSetSeries } from '../lib/aggregations';
import { BLUE_SCALE } from '../lib/chartColors';
import { formatShortMonthDay, formatShortMonthYear, isoWeekToDate } from '../lib/dateUtils';

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
  const dayOfWeek = dateSetDayOfWeekDistribution(rows);

  const formatTick = (value: string) => {
    if (groupBy === 'day') {
      const date = new Date(value);
      if (!Number.isNaN(date.getTime())) return formatShortMonthDay(date);
      return value;
    }
    if (groupBy === 'week') {
      const date = isoWeekToDate(value);
      if (!date) return value;
      return formatShortMonthDay(date);
    }
    const parts = value.split('-');
    if (parts.length === 2) {
      const year = Number(parts[0]);
      const month = Number(parts[1]);
      const date = new Date(year, month - 1, 1);
      if (!Number.isNaN(date.getTime())) return formatShortMonthYear(date);
    }
    return value;
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ChartCard title="Sets over time" subtitle="Date Set">
        <div className="mb-3 flex items-center gap-3 text-xs">
          <span>Group by</span>
          <select className="input" value={groupBy} onChange={(event) => onGroupByChange(event.target.value as 'day' | 'week' | 'month')}>
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>
        </div>
        <div style={{ width: Math.max(640, series.length * 42) }}>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={series} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <XAxis dataKey="x" tick={{ fontSize: 11 }} tickFormatter={formatTick} />
              <YAxis />
              <Tooltip cursor={false} />
              <Bar dataKey="y" fill={BLUE_SCALE[4]} radius={[6, 6, 0, 0]} isAnimationActive />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard title="Day-of-week distribution" subtitle="Date Set">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={dayOfWeek} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis />
            <Tooltip cursor={false} />
            <Bar dataKey="value" fill={BLUE_SCALE[1]} radius={[6, 6, 0, 0]} isAnimationActive />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
