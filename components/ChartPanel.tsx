'use client';

import { useRef } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import html2canvas from 'html2canvas';
import { ChartConfig, ChartType } from '../types/data';

const PALETTE = ['#1f6feb', '#12b981', '#f59e0b', '#ef4444', '#6366f1', '#0ea5e9'];

export default function ChartPanel({
  config,
  data,
  warning,
  title,
  onRemove,
  onEdit,
  isTitleEditing,
  onTitleChange,
  onTitleBlur,
  draggableProps,
}: {
  config: ChartConfig;
  data: any[];
  warning?: string;
  title?: string;
  onRemove?: () => void;
  onEdit?: () => void;
  isTitleEditing?: boolean;
  onTitleChange?: (value: string) => void;
  onTitleBlur?: () => void;
  onStartRename?: () => void;
  draggableProps?: React.HTMLAttributes<HTMLDivElement>;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  const exportPng = async () => {
    if (!ref.current) return;
    const canvas = await html2canvas(ref.current, { backgroundColor: '#ffffff', scale: 2 });
    const link = document.createElement('a');
    link.download = 'chart.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const renderChart = (type: ChartType) => {
    if (!data.length) {
      return <div className="text-sm text-slate/60">No data available for this chart.</div>;
    }

    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-15} height={60} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill={PALETTE[0]} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="x" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="y" stroke={PALETTE[0]} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="x" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="y" stroke={PALETTE[1]} fill={PALETTE[1]} fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        );
      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={320}>
            <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="x" type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="y" type="number" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Legend />
              <Scatter data={data} name="Points" fill={PALETTE[0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Tooltip />
              <Legend />
              <Pie data={data} dataKey="value" nameKey="name" outerRadius={120}>
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        );
      case 'histogram':
        return (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} height={60} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill={PALETTE[2]} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  return (
    <div className="card p-5" {...draggableProps}>
      <div className="flex items-center justify-between">
        <div>
          <p className="section-title">Chart output</p>
          {isTitleEditing ? (
            <input
              className="mt-1 w-full rounded-md border border-slate/20 px-2 py-1 text-sm font-semibold"
              value={title ?? ''}
              onChange={(event) => onTitleChange?.(event.target.value)}
              onBlur={onTitleBlur}
              autoFocus
            />
          ) : (
            <h3 className="text-lg font-semibold">{title ?? `${config.type.toUpperCase()} chart`}</h3>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onEdit ? (
            <button
              type="button"
              className="rounded-full border border-slate/20 px-3 py-1 text-xs font-semibold text-slate/60"
              onClick={onEdit}
            >
              Edit
            </button>
          ) : null}
          {onRemove ? (
            <button
              type="button"
              className="rounded-full border border-slate/20 px-3 py-1 text-xs font-semibold text-slate/60"
              onClick={onRemove}
            >
              Remove
            </button>
          ) : null}
          {onTitleChange ? (
            <button
              type="button"
              className="rounded-full border border-slate/20 px-3 py-1 text-xs font-semibold text-slate/60"
              onClick={isTitleEditing ? onTitleBlur : onStartRename}
            >
              {isTitleEditing ? 'Done' : 'Rename'}
            </button>
          ) : null}
          <button
            type="button"
            className="rounded-full border border-slate/20 px-3 py-1 text-xs font-semibold"
            onClick={exportPng}
          >
            Export chart as PNG
          </button>
        </div>
      </div>
      {warning ? <div className="mt-3 text-xs text-warning">{warning}</div> : null}
      <div ref={ref} className="mt-4 rounded-xl bg-white p-3">
        {renderChart(config.type)}
      </div>
    </div>
  );
}
