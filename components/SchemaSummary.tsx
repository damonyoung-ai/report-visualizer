'use client';

import { ColumnInfo } from '../types/data';

export default function SchemaSummary({
  columns,
  rowCount,
  missingPercent,
  selectedNumeric,
  selectedCategory,
}: {
  columns: ColumnInfo[];
  rowCount: number;
  missingPercent: number;
  selectedNumeric?: ColumnInfo | null;
  selectedCategory?: ColumnInfo | null;
}) {
  const numericStats = selectedNumeric?.stats.numeric;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="section-title">Dataset summary</p>
          <h3 className="text-xl font-semibold">Schema + KPIs</h3>
        </div>
        <div className="text-xs text-slate/70">{columns.length} columns</div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-ink/5 p-3">
          <div className="text-xs text-slate/70">Total rows</div>
          <div className="text-lg font-semibold">{rowCount.toLocaleString()}</div>
        </div>
        <div className="rounded-xl bg-ink/5 p-3">
          <div className="text-xs text-slate/70">Missing values</div>
          <div className="text-lg font-semibold">{missingPercent.toFixed(1)}%</div>
        </div>
        <div className="rounded-xl bg-ink/5 p-3">
          <div className="text-xs text-slate/70">Numeric: {selectedNumeric?.name ?? '—'}</div>
          <div className="text-xs">
            {numericStats
              ? `Min ${numericStats.min.toFixed(2)} · Max ${numericStats.max.toFixed(2)} · Avg ${numericStats.avg.toFixed(2)}`
              : 'Select a numeric column'}
          </div>
        </div>
        <div className="rounded-xl bg-ink/5 p-3">
          <div className="text-xs text-slate/70">Category: {selectedCategory?.name ?? '—'}</div>
          <div className="text-xs">
            {selectedCategory ? `${selectedCategory.stats.uniqueCount} distinct` : 'Select a category column'}
          </div>
        </div>
      </div>

      <div className="mt-4 max-h-52 overflow-auto rounded-xl border border-slate/10">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-white">
            <tr>
              <th className="px-3 py-2 text-left">Column</th>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-left">Missing</th>
              <th className="px-3 py-2 text-left">Unique</th>
            </tr>
          </thead>
          <tbody>
            {columns.map((col) => (
              <tr key={col.name} className="border-t border-slate/10">
                <td className="px-3 py-2 font-medium">{col.name}</td>
                <td className="px-3 py-2">{col.detectedType}</td>
                <td className="px-3 py-2">{col.stats.missingCount}</td>
                <td className="px-3 py-2">{col.stats.uniqueCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
