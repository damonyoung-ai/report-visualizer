'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import ChartCard from './ChartCard';
import { BLUE_SCALE } from '../lib/chartColors';
import { MonthlyMetricSummary } from '../types/sqo';

const COLORS = {
  earned: '#2563eb',
  potential: '#f59e0b',
  meetings: BLUE_SCALE[2],
  sets: BLUE_SCALE[5],
  source: '#1d4ed8',
  status: '#dc2626',
  ae: '#059669',
};

export default function ComparisonTrendCharts({ summaries }: { summaries: MonthlyMetricSummary[] }) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <ChartCard title="Quota Trend" subtitle="Month over month">
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={summaries} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="monthLabel" />
            <YAxis />
            <Tooltip cursor={false} />
            <Legend />
            <Line type="monotone" dataKey="earnedPoints" name="Earned" stroke={COLORS.earned} strokeWidth={3} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="potentialPoints" name="Potential" stroke={COLORS.potential} strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Activity Trend" subtitle="Meetings and sets">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={summaries} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="monthLabel" />
            <YAxis />
            <Tooltip cursor={false} />
            <Legend />
            <Bar dataKey="meetings" name="Meetings" fill={COLORS.meetings} radius={[6, 6, 0, 0]} />
            <Bar dataKey="dateSets" name="Date Sets" fill={COLORS.sets} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
