import { CanonicalRow, Filters, MonthlyBreakdownRow, MonthlyMetricSummary } from '../types/sqo';
import { formatMonthLabel, getDayOfWeek, getIsoWeek, getMonthKey } from './dateUtils';

const normalize = (value: string | null) => (value && value.trim() ? value.trim() : null);
const normalizeStatusKey = (value: string | null) => (normalize(value) ?? '').toLowerCase().replace(/[^a-z]/g, '');

function getQuotaValue(source: string | null) {
  const normalizedSource = (normalize(source) ?? '').toLowerCase();
  if (!normalizedSource) return 0;
  return normalizedSource === 'upsell' ? 1 : 2;
}

export function getEarnedQuotaPoints(rows: CanonicalRow[]) {
  return rows.reduce((total, row) => {
    if (normalizeStatusKey(row.status) !== 'mtgcompletediscocc') return total;
    return total + getQuotaValue(row.source);
  }, 0);
}

export function getPotentialQuotaPoints(rows: CanonicalRow[]) {
  return rows.reduce((total, row) => {
    const status = normalizeStatusKey(row.status);
    if (status !== 'mtgset' && !status.startsWith('mtgcomplete')) return total;
    return total + getQuotaValue(row.source);
  }, 0);
}

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

function filterRowsForMonthKey(rows: CanonicalRow[], monthKey: string, dateField: 'meetingDate' | 'dateSet') {
  return rows.filter((row) => {
    const value = row[dateField];
    return value ? getMonthKey(value) === monthKey : false;
  });
}

function topBreakdownForMonth(
  rows: CanonicalRow[],
  monthKeys: string[],
  field: 'source' | 'status' | 'ae',
  topN = 5
) {
  const combined = new Map<string, number>();
  monthKeys.forEach((monthKey) => {
    filterRowsForMonthKey(rows, monthKey, 'meetingDate').forEach((row) => {
      const value = normalize(row[field]);
      if (!value) return;
      combined.set(value, (combined.get(value) ?? 0) + 1);
    });
  });

  const topLabels = Array.from(combined.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([label]) => label);

  return monthKeys.map((monthKey) => {
    const monthRows = filterRowsForMonthKey(rows, monthKey, 'meetingDate');
    const counts = new Map<string, number>();
    monthRows.forEach((row) => {
      const value = normalize(row[field]);
      if (!value) return;
      const key = topLabels.includes(value) ? value : 'Other';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });

    const output: MonthlyBreakdownRow = {
      monthKey,
      monthLabel: formatMonthLabel(monthKey),
    };

    topLabels.forEach((label) => {
      output[label] = counts.get(label) ?? 0;
    });

    const otherCount = counts.get('Other') ?? 0;
    if (otherCount > 0) {
      output.Other = otherCount;
    }

    return output;
  });
}

export function buildMonthlyMetricSummaries(rows: CanonicalRow[], monthKeys: string[]): MonthlyMetricSummary[] {
  return monthKeys.map((monthKey) => {
    const meetingRows = filterRowsForMonthKey(rows, monthKey, 'meetingDate');
    const dateSetRows = filterRowsForMonthKey(rows, monthKey, 'dateSet');

    return {
      monthKey,
      monthLabel: formatMonthLabel(monthKey),
      earnedPoints: getEarnedQuotaPoints(meetingRows),
      potentialPoints: getPotentialQuotaPoints(meetingRows),
      meetings: meetingRows.length,
      dateSets: dateSetRows.length,
      sourceTotal: countBy(meetingRows, 'source').reduce((total, [, count]) => total + count, 0),
      statusTotal: countBy(meetingRows, 'status').reduce((total, [, count]) => total + count, 0),
      aeTotal: countBy(meetingRows, 'ae').reduce((total, [, count]) => total + count, 0),
    };
  });
}

export function buildMonthlyBreakdowns(rows: CanonicalRow[], monthKeys: string[]) {
  return {
    source: topBreakdownForMonth(rows, monthKeys, 'source'),
    status: topBreakdownForMonth(rows, monthKeys, 'status'),
    ae: topBreakdownForMonth(rows, monthKeys, 'ae'),
  };
}
