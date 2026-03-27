'use client';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import ChartCard from './ChartCard';
import { ratioTable, rollupStatus } from '../lib/aggregations';
import { BLUE_SCALE } from '../lib/chartColors';
import { CanonicalRow } from '../types/sqo';

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
  const wrappedTick = ({ x, y, payload }: { x: number; y: number; payload?: { value: string } }) => {
    const value = payload?.value ?? '';
    const words = String(value).split(' ');
    const lines: string[] = [];
    let line = '';
    words.forEach((word) => {
      if ((line + ` ${word}`).trim().length > 12) {
        lines.push(line.trim());
        line = word;
      } else {
        line = `${line} ${word}`.trim();
      }
    });
    if (line) lines.push(line);
    return (
      <g transform={`translate(${x},${y + 10})`}>
        {lines.slice(0, 3).map((text, index) => (
          <text key={index} x={0} y={index * 12} textAnchor="middle" fontSize={11} fill="#475569">
            {text}
          </text>
        ))}
      </g>
    );
  };

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
              <BarChart data={barData} margin={{ top: 10, right: 20, left: 0, bottom: 90 }}>
                <XAxis dataKey="name" interval={0} height={80} tick={wrappedTick} />
                <YAxis />
                <Tooltip cursor={false} />
                <Bar dataKey="value" fill={BLUE_SCALE[3]} radius={[6, 6, 0, 0]} isAnimationActive />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

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
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
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
