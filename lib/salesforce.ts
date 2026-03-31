import { parseMeetingDate } from './dateUtils';
import { SalesforceClosedWonRow, SalesforceOpenOppRow } from '../types/sqo';

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

function parseCurrency(value: string | undefined) {
  const trimmed = (value ?? '').trim();
  if (!trimmed) return 0;
  const normalized = trimmed.replace(/[$,]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getHeaderIndex(headers: string[], candidates: string[]) {
  const normalized = headers.map(normalizeHeader);
  return normalized.findIndex((header) => candidates.includes(header));
}

export function parseClosedWonGrid(grid: string[][]): SalesforceClosedWonRow[] {
  if (!grid.length) return [];
  const headers = grid[0];
  const accountIndex = getHeaderIndex(headers, ['accountname']);
  const commissionableIndex = getHeaderIndex(headers, ['commissionableamount']);
  const tcvIndex = getHeaderIndex(headers, ['tcv']);
  const gtmRoleIndex = getHeaderIndex(headers, ['createdbyoverwritegtmrole']);

  return grid.slice(1)
    .filter((row) => row.some((value) => String(value ?? '').trim()))
    .map((row) => ({
      accountName: row[accountIndex]?.trim() || null,
      commissionableAmount: parseCurrency(row[commissionableIndex]),
      tcv: parseCurrency(row[tcvIndex]),
      gtmRole: row[gtmRoleIndex]?.trim() || null,
    }));
}

export function parseOpenOppsGrid(grid: string[][]): SalesforceOpenOppRow[] {
  if (!grid.length) return [];
  const headers = grid[0];
  const ownerIndex = getHeaderIndex(headers, ['opportunityowner']);
  const accountIndex = getHeaderIndex(headers, ['accountname']);
  const commissionableIndex = getHeaderIndex(headers, ['commissionableamount']);
  const tcvIndex = getHeaderIndex(headers, ['tcv']);
  const closeDateIndex = getHeaderIndex(headers, ['closedate']);
  const nextStepIndex = getHeaderIndex(headers, ['nextstep']);
  const typeIndex = getHeaderIndex(headers, ['type']);
  const gtmRoleIndex = getHeaderIndex(headers, ['createdbyoverwritegtmrole']);

  return grid.slice(1)
    .filter((row) => row.some((value) => String(value ?? '').trim()))
    .map((row) => ({
      opportunityOwner: row[ownerIndex]?.trim() || null,
      accountName: row[accountIndex]?.trim() || null,
      commissionableAmount: parseCurrency(row[commissionableIndex]),
      tcv: parseCurrency(row[tcvIndex]),
      closeDate: parseMeetingDate(row[closeDateIndex] ?? ''),
      nextStep: row[nextStepIndex]?.trim() || null,
      type: row[typeIndex]?.trim() || null,
      gtmRole: row[gtmRoleIndex]?.trim() || null,
    }));
}

export function filterRowsByPeriod<T extends { closeDate?: Date | null; meetingDate?: Date | null }>(
  rows: T[],
  key: 'closeDate' | 'meetingDate',
  period: 'currentMonth' | 'rolling3Months' | 'allTime'
) {
  if (period === 'allTime') return rows;
  const now = new Date();
  const start =
    period === 'currentMonth'
      ? new Date(now.getFullYear(), now.getMonth(), 1)
      : new Date(now.getFullYear(), now.getMonth() - 2, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);

  return rows.filter((row) => {
    const value = row[key];
    return value ? value >= start && value <= end : false;
  });
}

export function sumField<T>(rows: T[], accessor: (row: T) => number) {
  return rows.reduce((total, row) => total + accessor(row), 0);
}

export function groupNumericBy<T>(
  rows: T[],
  getLabel: (row: T) => string | null,
  getValue: (row: T) => number
) {
  const totals = new Map<string, number>();
  rows.forEach((row) => {
    const label = getLabel(row)?.trim();
    if (!label) return;
    totals.set(label, (totals.get(label) ?? 0) + getValue(row));
  });
  return Array.from(totals.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }));
}

export function groupCountBy<T>(rows: T[], getLabel: (row: T) => string | null) {
  const totals = new Map<string, number>();
  rows.forEach((row) => {
    const label = getLabel(row)?.trim();
    if (!label) return;
    totals.set(label, (totals.get(label) ?? 0) + 1);
  });
  return Array.from(totals.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));
}

export function monthlyAmountSeries(
  rows: SalesforceOpenOppRow[],
  accessor: (row: SalesforceOpenOppRow) => number
) {
  const totals = new Map<string, number>();
  rows.forEach((row) => {
    if (!row.closeDate) return;
    const key = `${row.closeDate.getFullYear()}-${String(row.closeDate.getMonth() + 1).padStart(2, '0')}`;
    totals.set(key, (totals.get(key) ?? 0) + accessor(row));
  });
  return Array.from(totals.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, value]) => ({ month, value: Number(value.toFixed(2)) }));
}
