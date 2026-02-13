import { Aggregation } from '../types/data';

function isMissing(value: unknown): boolean {
  return value === null || value === undefined || value === '' || Number.isNaN(value);
}

export function aggregateValues(values: number[], aggregation: Aggregation): number {
  if (aggregation === 'count') return values.length;
  if (!values.length) return 0;
  if (aggregation === 'sum') return values.reduce((a, b) => a + b, 0);
  if (aggregation === 'avg') return values.reduce((a, b) => a + b, 0) / values.length;
  if (aggregation === 'min') return Math.min(...values);
  if (aggregation === 'max') return Math.max(...values);
  return values.length;
}

export function groupByAggregate(
  rows: Record<string, unknown>[],
  categoryKey: string,
  numericKey: string | undefined,
  aggregation: Aggregation,
  excludeMissing: boolean
): { name: string; value: number; count: number }[] {
  const groups = new Map<string, number[]>();

  for (const row of rows) {
    const rawCategory = row[categoryKey];
    if (excludeMissing && isMissing(rawCategory)) continue;
    const category = String(rawCategory ?? 'Missing');
    const numRaw = numericKey ? row[numericKey] : null;

    if (!groups.has(category)) groups.set(category, []);
    if (numericKey) {
      const num = typeof numRaw === 'number' ? numRaw : Number(numRaw);
      if (!Number.isFinite(num)) {
        if (!excludeMissing) groups.get(category)?.push(0);
      } else {
        groups.get(category)?.push(num);
      }
    } else {
      groups.get(category)?.push(1);
    }
  }

  const results = Array.from(groups.entries()).map(([name, values]) => {
    const value = aggregation === 'count' || !numericKey ? values.length : aggregateValues(values, aggregation);
    return { name, value, count: values.length };
  });

  return results.sort((a, b) => b.value - a.value);
}

export function buildHistogram(
  rows: Record<string, unknown>[],
  numericKey: string,
  bins = 12,
  excludeMissing = true
): { name: string; value: number }[] {
  const values = rows
    .map((row) => row[numericKey])
    .filter((value) => !(excludeMissing && isMissing(value)))
    .map((value) => (typeof value === 'number' ? value : Number(value)))
    .filter((value) => Number.isFinite(value));

  if (!values.length) return [];

  const min = Math.min(...values);
  const max = Math.max(...values);
  const width = (max - min) / bins || 1;
  const buckets = Array.from({ length: bins }, (_, i) => ({
    name: `${(min + i * width).toFixed(2)} - ${(min + (i + 1) * width).toFixed(2)}`,
    value: 0,
  }));

  for (const value of values) {
    const idx = Math.min(Math.floor((value - min) / width), bins - 1);
    buckets[idx].value += 1;
  }

  return buckets;
}

export function buildHistogramFromValues(
  values: number[],
  bins = 12
): { name: string; value: number }[] {
  const valid = values.filter((value) => Number.isFinite(value));
  if (!valid.length) return [];

  const min = Math.min(...valid);
  const max = Math.max(...valid);
  const width = (max - min) / bins || 1;
  const buckets = Array.from({ length: bins }, (_, i) => ({
    name: `${(min + i * width).toFixed(2)} - ${(min + (i + 1) * width).toFixed(2)}`,
    value: 0,
  }));

  for (const value of valid) {
    const idx = Math.min(Math.floor((value - min) / width), bins - 1);
    buckets[idx].value += 1;
  }

  return buckets;
}

export function extractNumericSeries(
  rows: Record<string, unknown>[],
  xKey: string,
  yKey: string,
  excludeMissing: boolean
): { x: string | number; y: number }[] {
  const series: { x: string | number; y: number }[] = [];
  for (const row of rows) {
    const x = row[xKey];
    const yRaw = row[yKey];
    if (excludeMissing && (isMissing(x) || isMissing(yRaw))) continue;
    const y = typeof yRaw === 'number' ? yRaw : Number(yRaw);
    if (!Number.isFinite(y)) continue;
    series.push({ x: x as string | number, y });
  }
  return series;
}

export function extractScatterSeries(
  rows: Record<string, unknown>[],
  xKey: string,
  yKey: string,
  colorKey?: string,
  excludeMissing = true
): { x: number; y: number; category?: string }[] {
  const points: { x: number; y: number; category?: string }[] = [];
  for (const row of rows) {
    const xRaw = row[xKey];
    const yRaw = row[yKey];
    if (excludeMissing && (isMissing(xRaw) || isMissing(yRaw))) continue;
    const x = typeof xRaw === 'number' ? xRaw : Number(xRaw);
    const y = typeof yRaw === 'number' ? yRaw : Number(yRaw);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    const category = colorKey ? String(row[colorKey] ?? 'Missing') : undefined;
    points.push({ x, y, category });
  }
  return points;
}
