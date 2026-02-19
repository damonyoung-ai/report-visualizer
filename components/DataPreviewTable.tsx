import { CanonicalRow } from '../types/sqo';

export default function DataPreviewTable({ rows }: { rows: CanonicalRow[] }) {
  const preview = rows.slice(0, 50);
  const columns = ['dateSet', 'meetingDate', 'source', 'status', 'ae'];

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="section-title">Preview</p>
          <h3 className="text-lg font-semibold">First 50 rows</h3>
        </div>
        <span className="text-xs text-slate/60">Canonical columns</span>
      </div>
      <div className="mt-4 max-h-[420px] overflow-auto rounded-xl border border-slate/10">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-white">
            <tr>
              {columns.map((col) => (
                <th key={col} className="px-3 py-2 text-left font-semibold">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.map((row, idx) => (
              <tr key={idx} className="border-t border-slate/10">
                <td className="px-3 py-2">{row.dateSet ? row.dateSet.toLocaleDateString() : '—'}</td>
                <td className="px-3 py-2">{row.meetingDate ? row.meetingDate.toLocaleDateString() : '—'}</td>
                <td className="px-3 py-2">{row.source ?? '—'}</td>
                <td className="px-3 py-2">{row.status ?? '—'}</td>
                <td className="px-3 py-2">{row.ae ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
