'use client';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import ChartCard from './ChartCard';
import { topNWithOther } from '../lib/aggregations';

const COLORS = ['#1f6feb', '#12b981', '#f59e0b', '#ef4444', '#6366f1', '#0ea5e9'];

export default function SourceCharts({
  data,
  topN,
  onTopNChange,
}: {
  data: [string, number][];
  topN: number;
  onTopNChange: (value: number) => void;
}) {
  const trimmed = topNWithOther(data, topN).map(([name, value]) => ({ name, value }));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ChartCard title="Source counts" subtitle="Source">
        <div className="mb-3 flex items-center gap-3 text-xs">
          <span>Top N</span>
          <input
            type="range"
            min={3}
            max={20}
            value={topN}
            onChange={(event) => onTopNChange(Number(event.target.value))}
          />
          <span>{topN}</span>
        </div>
        <div style={{ width: Math.max(640, trimmed.length * 80) }}>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={trimmed} margin={{ top: 10, right: 20, left: 0, bottom: 50 }}>
              <XAxis dataKey="name" interval={0} angle={-20} height={70} tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill={COLORS[0]} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard title="Source share" subtitle="Source">
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Tooltip />
            <Pie data={trimmed} dataKey="value" nameKey="name" outerRadius={110} innerRadius={50}>
              {trimmed.map((_, idx) => (
                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
