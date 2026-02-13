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
  const labelRenderer = ({ name, percent }: { name: string; percent: number }) =>
    `${name} ${(percent * 100).toFixed(0)}%`;
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
          <text key={index} x={0} y={index * 12} textAnchor=\"middle\" fontSize={11} fill=\"#475569\">
            {text}
          </text>
        ))}
      </g>
    );
  };

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
            <BarChart data={trimmed} margin={{ top: 10, right: 20, left: 0, bottom: 90 }}>
              <XAxis dataKey="name" interval={0} height={80} tick={wrappedTick} />
              <YAxis />
              <Tooltip cursor={false} />
              <Bar dataKey="value" fill={COLORS[0]} radius={[6, 6, 0, 0]} isAnimationActive />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard title="Source share" subtitle="Source">
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Tooltip cursor={false} />
            <Pie
              data={trimmed}
              dataKey="value"
              nameKey="name"
              outerRadius={110}
              innerRadius={50}
              label={labelRenderer}
              labelLine={false}
              isAnimationActive
            >
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
