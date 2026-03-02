'use client';

import { useEffect, useRef, useState } from 'react';
import { Filters } from '../types/sqo';

type Props = {
  filters: Filters;
  sources: string[];
  statuses: string[];
  aes: string[];
  onChange: (next: Filters) => void;
};

function MultiSelectDropdown({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (value: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const toggleValue = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
      return;
    }
    onChange([...selected, value]);
  };

  return (
    <div ref={rootRef} className="relative flex min-w-52 flex-col gap-2">
      <label className="text-xs text-slate/70">{label}</label>
      <button type="button" className="input flex items-center justify-between text-left" onClick={() => setOpen((prev) => !prev)}>
        <span className="truncate">
          {selected.length ? `${selected.length} selected` : `All ${label}`}
        </span>
        <span className="text-xs text-slate/60">{open ? '▲' : '▼'}</span>
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-[80] mt-1 max-h-64 w-full overflow-auto rounded-xl border border-slate/20 bg-white p-2 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <button type="button" className="text-xs text-accent" onClick={() => onChange(options)}>
              Select all
            </button>
            <button type="button" className="text-xs text-slate/60" onClick={() => onChange([])}>
              Clear
            </button>
          </div>
          <div className="space-y-1">
            {options.map((option) => (
              <label key={option} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-xs hover:bg-slate/5">
                <input
                  type="checkbox"
                  checked={selected.includes(option)}
                  onChange={() => toggleValue(option)}
                />
                <span className="truncate">{option}</span>
              </label>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function FilterBar({ filters, sources, statuses, aes, onChange }: Props) {
  const update = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });

  return (
    <div className="card relative z-[60] overflow-visible p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
        <div className="flex flex-col gap-2">
          <label className="text-xs text-slate/70">Meeting Date From</label>
          <input
            type="date"
            className="input"
            value={filters.dateFrom ?? ''}
            disabled={filters.allTime}
            onChange={(event) => update({ dateFrom: event.target.value, allTime: false })}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs text-slate/70">Meeting Date To</label>
          <input
            type="date"
            className="input"
            value={filters.dateTo ?? ''}
            disabled={filters.allTime}
            onChange={(event) => update({ dateTo: event.target.value, allTime: false })}
          />
        </div>
        <div className="flex items-center gap-2 pb-1">
          <input
            id="all-time-toggle"
            type="checkbox"
            checked={filters.allTime}
            onChange={(event) =>
              update(
                event.target.checked
                  ? { allTime: true, dateFrom: '', dateTo: '' }
                  : { allTime: false }
              )
            }
          />
          <label htmlFor="all-time-toggle" className="text-xs text-slate/70">
            All Time
          </label>
        </div>
        <MultiSelectDropdown
          label="Source"
          options={sources}
          selected={filters.sources}
          onChange={(value) => update({ sources: value })}
        />
        <MultiSelectDropdown
          label="Status"
          options={statuses}
          selected={filters.statuses}
          onChange={(value) => update({ statuses: value })}
        />
        <MultiSelectDropdown
          label="A.E."
          options={aes}
          selected={filters.aes}
          onChange={(value) => update({ aes: value })}
        />
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
