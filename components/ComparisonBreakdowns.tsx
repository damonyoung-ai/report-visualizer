'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import ChartCard from './ChartCard';
import { MonthlyBreakdownRow } from '../types/sqo';

const PALETTE = ['#2563eb', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#94a3b8'];

function getKeys(rows: MonthlyBreakdownRow[]) {
  const keys = new Set<string>();
  rows.forEach((row) => {
    Object.keys(row).forEach((key) => {
      if (key !== 'monthKey' && key !== 'monthLabel') {
        keys.add(key);
      }
    });
  });
  return Array.from(keys);
}

function BreakdownChart({
  title,
  subtitle,
  rows,
}: {
  title: string;
  subtitle: string;
  rows: MonthlyBreakdownRow[];
}) {
  const keys = getKeys(rows);

  return (
    <ChartCard title={title} subtitle={subtitle}>
      <div style={{ width: Math.max(720, keys.length * 96) }}>
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={rows} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="monthLabel" />
            <YAxis />
            <Tooltip cursor={false} />
            <Legend />
            {keys.map((key, index) => (
              <Bar key={key} dataKey={key} fill={PALETTE[index % PALETTE.length]} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

export default function ComparisonBreakdowns({
  sourceRows,
  statusRows,
  aeRows,
}: {
  sourceRows: MonthlyBreakdownRow[];
  statusRows: MonthlyBreakdownRow[];
  aeRows: MonthlyBreakdownRow[];
}) {
  return (
    <div className="grid gap-6">
      <BreakdownChart title="Source Comparison" subtitle="Top sources by month" rows={sourceRows} />
      <BreakdownChart title="Status Comparison" subtitle="Top statuses by month" rows={statusRows} />
      <BreakdownChart title="A.E. Comparison" subtitle="Top A.E. totals by month" rows={aeRows} />
    </div>
  );
}
