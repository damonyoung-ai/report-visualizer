import { CanonicalRow, Filters } from '../types/sqo';
import { getDayOfWeek, getIsoWeek, getMonthKey } from './dateUtils';

const normalize = (value: string | null) => (value && value.trim() ? value.trim() : null);

export function applyFilters(rows: CanonicalRow[], filters: Filters) {
  return rows.filter((row) => {
    if (filters.excludeMissing) {
      if (!row.meetingDate || !row.source || !row.status || !row.ae) return false;
    }

    if (!filters.allTime && (filters.dateFrom || filters.dateTo)) {
      if (!row.meetingDate) return false;
      if (filters.dateFrom && row.meetingDate < new Date(filters.dateFrom)) return false;
      if (filters.dateTo) {
        const to = new Date(filters.dateTo);
        to.setHours(23, 59, 59, 999);
        if (row.meetingDate > to) return false;
      }
    }

    if (filters.sources.length && (!row.source || !filters.sources.includes(row.source))) return false;
    if (filters.statuses.length && (!row.status || !filters.statuses.includes(row.status))) return false;
    if (filters.aes.length && (!row.ae || !filters.aes.includes(row.ae))) return false;

    return true;
  });
}

export function countBy(rows: CanonicalRow[], key: 'source' | 'status' | 'ae') {
  const map = new Map<string, number>();
  rows.forEach((row) => {
    const value = normalize(row[key]);
    if (!value) return;
    map.set(value, (map.get(value) ?? 0) + 1);
  });
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
}

export function ratioTable(rows: CanonicalRow[], key: 'status' | 'source' | 'ae') {
  const counts = countBy(rows, key);
  const total = counts.reduce((acc, [, count]) => acc + count, 0) || 1;
  return counts.map(([label, count]) => ({
    label,
    count,
    ratio: count / total,
  }));
}

export function rollupStatus(rows: CanonicalRow[]) {
  let complete = 0;
  let notComplete = 0;
  rows.forEach((row) => {
    const status = normalize(row.status) ?? '';
    if (status.toLowerCase().startsWith('mtg. complete')) complete += 1;
    else notComplete += 1;
  });
  const total = complete + notComplete || 1;
  return [
    { label: 'Mtg. Complete', count: complete, ratio: complete / total },
    { label: 'Not Complete', count: notComplete, ratio: notComplete / total },
  ];
}

export function topNWithOther(items: [string, number][], topN: number) {
  const top = items.slice(0, topN);
  const rest = items.slice(topN);
  const otherCount = rest.reduce((acc, [, count]) => acc + count, 0);
  if (otherCount > 0) {
    top.push(['Other', otherCount]);
  }
  return top;
}

export function meetingDateSeries(rows: CanonicalRow[], groupBy: 'week' | 'month', includeMissing: boolean) {
  const map = new Map<string, number>();
  let missing = 0;
  rows.forEach((row) => {
    if (!row.meetingDate) {
      if (includeMissing) missing += 1;
      return;
    }
    const key = groupBy === 'week' ? getIsoWeek(row.meetingDate) : getMonthKey(row.meetingDate);
    map.set(key, (map.get(key) ?? 0) + 1);
  });
  const series = Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([x, y]) => ({ x, y }));
  if (includeMissing && missing) {
    series.push({ x: 'Missing', y: missing });
  }
  return series;
}

export function dayOfWeekDistribution(rows: CanonicalRow[]) {
  const order = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const map = new Map<string, number>(order.map((day) => [day, 0]));
  rows.forEach((row) => {
    if (!row.meetingDate) return;
    const day = getDayOfWeek(row.meetingDate);
    map.set(day, (map.get(day) ?? 0) + 1);
  });
  return order.map((day) => ({ name: day, value: map.get(day) ?? 0 }));
}

export function dateSetSeries(rows: CanonicalRow[], groupBy: 'day' | 'week' | 'month') {
  const map = new Map<string, number>();
  rows.forEach((row) => {
    if (!row.dateSet) return;
    let key = '';
    if (groupBy === 'day') {
      key = row.dateSet.toISOString().slice(0, 10);
    } else if (groupBy === 'week') {
      key = getIsoWeek(row.dateSet);
    } else {
      key = getMonthKey(row.dateSet);
    }
    map.set(key, (map.get(key) ?? 0) + 1);
  });

  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([x, y]) => ({ x, y }));
}

export function dateSetDayOfWeekDistribution(rows: CanonicalRow[]) {
  const order = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const map = new Map<string, number>(order.map((day) => [day, 0]));
  rows.forEach((row) => {
    if (!row.dateSet) return;
    const day = getDayOfWeek(row.dateSet);
    map.set(day, (map.get(day) ?? 0) + 1);
  });
  return order.map((day) => ({ name: day, value: map.get(day) ?? 0 }));
}

export function stackByStatus(rows: CanonicalRow[], topStatuses: string[]) {
  const grouped = new Map<string, Record<string, number>>();
  rows.forEach((row) => {
    if (!row.ae) return;
    const ae = row.ae;
    if (!grouped.has(ae)) grouped.set(ae, {});
    const status = row.status ?? 'Missing';
    const key = topStatuses.includes(status) ? status : 'Other';
    const bucket = grouped.get(ae)!;
    bucket[key] = (bucket[key] ?? 0) + 1;
  });
  return Array.from(grouped.entries()).map(([name, counts]) => ({ name, ...counts }));
}
