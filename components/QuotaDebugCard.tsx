'use client';

import { QuotaExclusion } from '../types/sqo';
import { formatDate } from '../lib/dateUtils';

export default function QuotaDebugCard({ exclusions }: { exclusions: QuotaExclusion[] }) {
  return (
    <div className="card p-5">
      <p className="section-title">Quota Debug</p>
      <h2 className="mt-1 text-xl font-semibold">Excluded `Mtg. Complete - Disc. Occ.` Rows</h2>
      <p className="mt-2 text-sm text-slate/70">
        These rows match the exact quota status but are not counting toward quota. Reasons are listed per row.
      </p>

      {exclusions.length === 0 ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          No exact `Mtg. Complete - Disc. Occ.` rows are currently excluded from quota.
        </div>
      ) : (
        <div className="mt-4 overflow-auto">
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead className="sticky top-0 bg-white">
              <tr>
                <th className="px-2 py-2">Meeting Date</th>
                <th className="px-2 py-2">Source</th>
                <th className="px-2 py-2">A.E.</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Brand</th>
                <th className="px-2 py-2">Reasons</th>
              </tr>
            </thead>
            <tbody>
              {exclusions.map((item, index) => (
                <tr key={`${item.row.raw['Brand Name'] ?? 'row'}-${index}`} className="border-t border-slate/10 align-top">
                  <td className="px-2 py-2">{formatDate(item.row.meetingDate)}</td>
                  <td className="px-2 py-2">{item.row.source ?? '—'}</td>
                  <td className="px-2 py-2">{item.row.ae ?? '—'}</td>
                  <td className="px-2 py-2">{item.row.status ?? '—'}</td>
                  <td className="px-2 py-2">{item.row.raw['Brand Name'] ?? item.row.raw['Account Name'] ?? '—'}</td>
                  <td className="px-2 py-2">{item.reasons.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
