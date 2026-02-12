'use client';

import { useMemo, useState } from 'react';

export default function TablePreview({
  rows,
  columns,
}: {
  rows: Record<string, unknown>[];
  columns: string[];
}) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    const next = [...rows];
    next.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av === bv) return 0;
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av;
      }
      return sortDir === 'asc'
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
    return next;
  }, [rows, sortKey, sortDir]);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="section-title">Data preview</p>
          <h3 className="text-lg font-semibold">First 50 rows</h3>
        </div>
        {sortKey ? (
          <div className="text-xs text-slate/60">
            Sorted by {sortKey} ({sortDir})
          </div>
        ) : null}
      </div>
      <div className="mt-4 max-h-[420px] overflow-auto rounded-xl border border-slate/10">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-white">
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  className="cursor-pointer px-3 py-2 text-left font-semibold"
                  onClick={() => toggleSort(col)}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, idx) => (
              <tr key={idx} className="border-t border-slate/10">
                {columns.map((col) => (
                  <td key={col} className="px-3 py-2">
                    {row[col] === null || row[col] === undefined ? '—' : String(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
