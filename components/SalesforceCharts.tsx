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

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function SalesforceCharts({
  ownerCommissionable,
  ownerTcv,
  typeCounts,
  monthlyOpenCommissionable,
  monthlySqoMeetings,
  closedWonRoleTotals,
}: {
  ownerCommissionable: { name: string; value: number }[];
  ownerTcv: { name: string; value: number }[];
  typeCounts: { name: string; value: number }[];
  monthlyOpenCommissionable: { month: string; value: number }[];
  monthlySqoMeetings: { month: string; value: number }[];
  closedWonRoleTotals: { name: string; value: number }[];
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <ChartCard title="Open Pipeline by Owner" subtitle="Commissionable Amount">
        <div style={{ width: Math.max(640, ownerCommissionable.length * 88) }}>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={ownerCommissionable} margin={{ top: 10, right: 20, left: 0, bottom: 70 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" angle={-25} height={80} textAnchor="end" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip cursor={false} formatter={(value: number) => formatCurrency(value)} />
              <Bar dataKey="value" fill={BLUE_SCALE[4]} radius={[6, 6, 0, 0]} isAnimationActive />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard title="Open Pipeline by Owner" subtitle="TCV">
        <div style={{ width: Math.max(640, ownerTcv.length * 88) }}>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={ownerTcv} margin={{ top: 10, right: 20, left: 0, bottom: 70 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" angle={-25} height={80} textAnchor="end" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip cursor={false} formatter={(value: number) => formatCurrency(value)} />
              <Bar dataKey="value" fill={BLUE_SCALE[2]} radius={[6, 6, 0, 0]} isAnimationActive />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard title="Open Opportunities by Type" subtitle="Count">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={typeCounts} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip cursor={false} />
            <Bar dataKey="value" fill={BLUE_SCALE[3]} radius={[6, 6, 0, 0]} isAnimationActive />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Closed Won by GTM Role" subtitle="Commissionable Amount">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={closedWonRoleTotals} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={formatCurrency} />
            <Tooltip cursor={false} formatter={(value: number) => formatCurrency(value)} />
            <Bar dataKey="value" fill={BLUE_SCALE[5]} radius={[6, 6, 0, 0]} isAnimationActive />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="SQO vs Open Pipeline Trend" subtitle="Meetings and commissionable amount">
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={monthlyOpenCommissionable.map((item) => ({
            month: item.month,
            openCommissionable: item.value,
            sqoMeetings: monthlySqoMeetings.find((meeting) => meeting.month === item.month)?.value ?? 0,
          }))} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" tickFormatter={formatCurrency} />
            <Tooltip cursor={false} formatter={(value: number, name: string) => (
              name === 'openCommissionable' ? formatCurrency(value) : value
            )} />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="sqoMeetings" name="SQO Meetings" stroke={BLUE_SCALE[2]} strokeWidth={3} dot={{ r: 4 }} />
            <Line yAxisId="right" type="monotone" dataKey="openCommissionable" name="Open Commissionable" stroke={BLUE_SCALE[5]} strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
