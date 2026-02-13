'use client';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import ChartCard from './ChartCard';
import { countBy, stackByStatus, topNWithOther } from '../lib/aggregations';
import { CanonicalRow } from '../types/sqo';

const COLORS = ['#1f6feb', '#12b981', '#f59e0b', '#ef4444', '#6366f1', '#0ea5e9'];

export default function AeCharts({ rows }: { rows: CanonicalRow[] }) {
  const aeCounts = countBy(rows, 'ae');
  const trimmedAe = topNWithOther(aeCounts, 12).map(([name, value]) => ({ name, value }));

  const statusCounts = countBy(rows, 'status');
  const topStatuses = statusCounts.slice(0, 5).map(([label]) => label);
  const stackedData = stackByStatus(rows, topStatuses);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ChartCard title="A.E. counts" subtitle="A.E.">
        <div style={{ width: Math.max(640, trimmedAe.length * 80) }}>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={trimmedAe} margin={{ top: 10, right: 20, left: 0, bottom: 70 }}>
              <XAxis
                dataKey="name"
                interval={0}
                angle={-30}
                height={90}
                tick={{ fontSize: 11 }}
                tickMargin={10}
              />
              <YAxis />
              <Tooltip cursor={false} />
              <Bar dataKey="value" fill={COLORS[1]} radius={[6, 6, 0, 0]} isAnimationActive />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard title="A.E. by Status" subtitle="Stacked">
        <div style={{ width: Math.max(640, stackedData.length * 80) }}>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={stackedData} margin={{ top: 10, right: 20, left: 0, bottom: 70 }}>
              <XAxis
                dataKey="name"
                interval={0}
                angle={-30}
                height={90}
                tick={{ fontSize: 11 }}
                tickMargin={10}
              />
              <YAxis />
              <Tooltip cursor={false} />
              <Legend />
              {topStatuses.map((status, idx) => (
                <Bar key={status} dataKey={status} stackId="stack" fill={COLORS[idx % COLORS.length]} isAnimationActive />
              ))}
              <Bar dataKey="Other" stackId="stack" fill="#9ca3af" isAnimationActive />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}
