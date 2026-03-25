export function parseMeetingDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.toLowerCase() === 'nan') return null;

  const numeric = Number(trimmed);
  if (Number.isFinite(numeric) && numeric > 20000) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    return new Date(excelEpoch.getTime() + numeric * 86400000);
  }

  const normalized = trimmed.replace(/-/g, '/');
  const match = normalized.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (match) {
    const month = Number(match[1]);
    const day = Number(match[2]);
    const year = Number(match[3].length === 2 ? `20${match[3]}` : match[3]);
    const date = new Date(year, month - 1, day);
    if (!Number.isNaN(date.getTime())) return date;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export function formatDate(value: Date | null) {
  if (!value) return '—';
  return value.toLocaleDateString();
}

export function getIsoWeek(date: Date) {
  const copy = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = copy.getUTCDay() || 7;
  copy.setUTCDate(copy.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(copy.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil((((copy.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${copy.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

export function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function monthKeyToDate(monthKey: string) {
  const match = monthKey.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, 1);
}

export function formatMonthLabel(monthKey: string) {
  const date = monthKeyToDate(monthKey);
  if (!date) return monthKey;
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function getRelativeMonthKey(offset: number, baseDate = new Date()) {
  return getMonthKey(new Date(baseDate.getFullYear(), baseDate.getMonth() + offset, 1));
}

export function getRollingMonthKeys(count: number, baseDate = new Date()) {
  return Array.from({ length: count }, (_, index) => getRelativeMonthKey(index - count + 1, baseDate));
}

export function getDayOfWeek(date: Date) {
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

export function formatShortMonthDay(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatShortMonthYear(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function isoWeekToDate(isoWeek: string): Date | null {
  const match = isoWeek.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const week = Number(match[2]);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - jan4Day + 1 + (week - 1) * 7);
  return new Date(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate());
}
