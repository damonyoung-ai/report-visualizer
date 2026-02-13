'use client';

import { Filters } from '../types/sqo';

type Props = {
  filters: Filters;
  sources: string[];
  statuses: string[];
  aes: string[];
  onChange: (next: Filters) => void;
};

export default function FilterBar({ filters, sources, statuses, aes, onChange }: Props) {
  const update = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });

  return (
    <div className="card p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
        <div className="flex flex-col gap-2">
          <label className="text-xs text-slate/70">Meeting Date From</label>
          <input
            type="date"
            className="input"
            value={filters.dateFrom ?? ''}
            onChange={(event) => update({ dateFrom: event.target.value })}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs text-slate/70">Meeting Date To</label>
          <input
            type="date"
            className="input"
            value={filters.dateTo ?? ''}
            onChange={(event) => update({ dateTo: event.target.value })}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs text-slate/70">Source</label>
          <select
            multiple
            className="input h-28"
            value={filters.sources}
            onChange={(event) => update({ sources: Array.from(event.target.selectedOptions).map((opt) => opt.value) })}
          >
            {sources.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs text-slate/70">Status</label>
          <select
            multiple
            className="input h-28"
            value={filters.statuses}
            onChange={(event) => update({ statuses: Array.from(event.target.selectedOptions).map((opt) => opt.value) })}
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs text-slate/70">A.E.</label>
          <select
            multiple
            className="input h-28"
            value={filters.aes}
            onChange={(event) => update({ aes: Array.from(event.target.selectedOptions).map((opt) => opt.value) })}
          >
            {aes.map((ae) => (
              <option key={ae} value={ae}>
                {ae}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={filters.excludeMissing}
            onChange={(event) => update({ excludeMissing: event.target.checked })}
          />
          <span className="text-xs text-slate/70">Exclude missing values</span>
        </div>
      </div>
    </div>
  );
}
