'use client';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import ChartCard from './ChartCard';
import { ratioTable, rollupStatus } from '../lib/aggregations';
import { CanonicalRow } from '../types/sqo';

const COLORS = ['#1f6feb', '#12b981', '#f59e0b', '#ef4444', '#6366f1', '#0ea5e9'];

export default function StatusCharts({
  rows,
  ratioMode,
  onRatioModeChange,
}: {
  rows: CanonicalRow[];
  ratioMode: 'all' | 'filtered';
  onRatioModeChange: (value: 'all' | 'filtered') => void;
}) {
  const ratioData = ratioTable(rows, 'status');
  const barData = ratioData.map((item) => ({ name: item.label, value: item.count }));
  const rollup = rollupStatus(rows);
  const labelRenderer = ({ name, percent }: { name: string; percent: number }) =>
    `${name} ${(percent * 100).toFixed(0)}%`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs">
        <span>Ratio basis:</span>
        <select className="input" value={ratioMode} onChange={(event) => onRatioModeChange(event.target.value as 'all' | 'filtered')}>
          <option value="all">All rows</option>
          <option value="filtered">Filtered rows only</option>
        </select>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Status counts" subtitle="Status">
          <div style={{ width: Math.max(640, barData.length * 80) }}>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={barData} margin={{ top: 10, right: 20, left: 0, bottom: 70 }}>
                <XAxis
                  dataKey="name"
                  interval={0}
                  angle={-30}
                  height={90}
                  tick={{ fontSize: 11 }}
                  tickMargin={10}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill={COLORS[2]} radius={[6, 6, 0, 0]} isAnimationActive />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Status ratios" subtitle="Status">
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Tooltip />
              <Pie
                data={barData}
                dataKey="value"
                nameKey="name"
                outerRadius={110}
                innerRadius={60}
                label={labelRenderer}
                labelLine={false}
                isAnimationActive
              >
                {barData.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Status ratio table" subtitle="Status">
          <div className="overflow-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-white">
                <tr>
                  <th className="px-2 py-2 text-left">Status</th>
                  <th className="px-2 py-2 text-right">Count</th>
                  <th className="px-2 py-2 text-right">% of total</th>
                </tr>
              </thead>
              <tbody>
                {ratioData.map((row) => (
                  <tr key={row.label} className="border-t border-slate/10">
                    <td className="px-2 py-2">{row.label}</td>
                    <td className="px-2 py-2 text-right">{row.count}</td>
                    <td className="px-2 py-2 text-right">{(row.ratio * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>

        <ChartCard title="Mtg. Complete rollup" subtitle="Status rollup">
          <div className="space-y-3">
            {rollup.map((item) => (
              <div key={item.label} className="rounded-lg border border-slate/10 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span>{item.label}</span>
                  <span className="font-semibold">{item.count}</span>
                </div>
                <div className="text-xs text-slate/60">{(item.ratio * 100).toFixed(1)}% of total</div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
