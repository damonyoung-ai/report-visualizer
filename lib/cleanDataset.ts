import { parseMeetingDate } from './dateUtils';
import { detectHeaderRow } from './detectHeaderRow';
import { buildHeaders } from './normalizeColumns';
import { CanonicalRow, CleanDataset } from '../types/sqo';

export function cleanDataset(grid: string[][]): CleanDataset {
  if (!grid.length) {
    return { rows: [], rawHeaders: [], canonicalHeaders: [] };
  }

  const { headerRowIndex, headers } = detectHeaderRow(grid);
  const columns = buildHeaders(headers);

  const rows: CanonicalRow[] = [];
  const dataRows = grid.slice(headerRowIndex + 1);

  for (const row of dataRows) {
    if (!row || row.every((cell) => !String(cell || '').trim())) continue;
    const raw: Record<string, string | null> = {};

    columns.forEach((column) => {
      const value = row[column.index] ?? '';
      const stringValue = String(value ?? '').trim();
      raw[column.header] = stringValue === '' || stringValue.toLowerCase() === 'nan' ? null : stringValue;
    });

    const mapped: Record<string, string | null> = {};
    columns.forEach((column) => {
      if (!column.canonical || !column.header) return;
      mapped[column.canonical] = raw[column.header] ?? null;
    });

    const meetingDate = mapped.meetingDate ? parseMeetingDate(mapped.meetingDate) : null;

    rows.push({
      meetingDate,
      source: mapped.source ? mapped.source.trim() : null,
      status: mapped.status ? mapped.status.trim() : null,
      ae: mapped.ae ? mapped.ae.trim() : null,
      raw,
    });
  }

  return {
    rows,
    rawHeaders: columns.map((col) => col.header),
    canonicalHeaders: columns.map((col) => col.canonical),
  };
}
