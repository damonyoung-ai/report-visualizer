import { ColumnInfo, ColumnStats, DetectedType } from '../types/data';

const DATE_SAMPLE_FORMATS = [
  /^\d{4}-\d{2}-\d{2}/, // ISO
  /^\d{1,2}\/\d{1,2}\/\d{2,4}/, // US
  /^\d{1,2}-\d{1,2}-\d{2,4}/,
];

function normalizeValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  }
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return String(value);
}

function parseNumber(value: string): number | null {
  const cleaned = value.replace(/,/g, '');
  if (!/^[-+]?\d*\.?\d+(e[-+]?\d+)?$/i.test(cleaned)) return null;
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

function parseBoolean(value: string): boolean | null {
  const lowered = value.toLowerCase();
  if (['true', 'false'].includes(lowered)) return lowered === 'true';
  if (['yes', 'no'].includes(lowered)) return lowered === 'yes';
  if (['0', '1'].includes(lowered)) return lowered === '1';
  return null;
}

function normalizeDateString(value: string): string {
  const match = value.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
  if (!match) return value;
  const [, m, d, y] = match;
  if (y.length === 2) {
    return `${m}/${d}/20${y}`;
  }
  if (y.length === 3) {
    return `${m}/${d}/2${y}`;
  }
  return value;
}

function parseDate(value: string): Date | null {
  if (!DATE_SAMPLE_FORMATS.some((re) => re.test(value))) return null;
  const normalized = normalizeDateString(value);
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function calcVariance(values: number[], mean: number): number {
  if (values.length === 0) return 0;
  const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
  return variance;
}

export function inferColumns(rows: Record<string, unknown>[], columns: string[]): ColumnInfo[] {
  return columns.map((name) => inferColumn(name, rows));
}

export function inferColumn(name: string, rows: Record<string, unknown>[]): ColumnInfo {
  const samples: string[] = [];
  let missingCount = 0;
  let numericCount = 0;
  let dateCount = 0;
  let booleanCount = 0;
  const numericValues: number[] = [];
  const uniqueValues = new Set<string>();

  const sampleSize = Math.min(rows.length, 2000);

  for (let i = 0; i < sampleSize; i += 1) {
    const raw = rows[i]?.[name];
    const normalized = normalizeValue(raw);
    if (normalized === null) {
      missingCount += 1;
      continue;
    }

    if (samples.length < 6) samples.push(normalized);
    uniqueValues.add(normalized);

    const num = parseNumber(normalized);
    if (num !== null) {
      numericCount += 1;
      numericValues.push(num);
      continue;
    }

    const bool = parseBoolean(normalized);
    if (bool !== null) {
      booleanCount += 1;
      continue;
    }

    const date = parseDate(normalized);
    if (date !== null) {
      dateCount += 1;
      continue;
    }
  }

  const nonMissing = sampleSize - missingCount;
  const numericRatio = nonMissing ? numericCount / nonMissing : 0;
  const booleanRatio = nonMissing ? booleanCount / nonMissing : 0;
  const dateRatio = nonMissing ? dateCount / nonMissing : 0;
  const uniqueCount = uniqueValues.size;

  let detectedType: DetectedType = 'unknown';
  if (nonMissing === 0) {
    detectedType = 'unknown';
  } else if (numericRatio >= 0.9) {
    detectedType = 'number';
  } else if (dateRatio >= 0.85) {
    detectedType = 'date';
  } else if (booleanRatio >= 0.9) {
    detectedType = 'boolean';
  } else {
    const cardinality = uniqueCount / nonMissing;
    detectedType = cardinality <= 0.2 || uniqueCount <= 20 ? 'category' : 'string';
  }

  const stats: ColumnStats = {
    missingCount,
    uniqueCount,
    sampleValues: samples,
  };

  if (detectedType === 'number' && numericValues.length) {
    const min = Math.min(...numericValues);
    const max = Math.max(...numericValues);
    const avg = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
    const variance = calcVariance(numericValues, avg);
    stats.numeric = { min, max, avg, variance };
  }

  return { name, detectedType, stats };
}

export function coerceRowTypes(
  rows: Record<string, unknown>[],
  columns: ColumnInfo[]
): Record<string, string | number | boolean | null>[] {
  const map = new Map(columns.map((col) => [col.name, col.detectedType]));
  return rows.map((row) => {
    const output: Record<string, string | number | boolean | null> = {};
    for (const [key, value] of Object.entries(row)) {
      const detectedType = map.get(key);
      const normalized = normalizeValue(value);
      if (normalized === null) {
        output[key] = null;
        continue;
      }
      if (detectedType === 'number') {
        const num = parseNumber(normalized);
        output[key] = num === null ? null : num;
      } else if (detectedType === 'boolean') {
        const bool = parseBoolean(normalized);
        output[key] = bool === null ? normalized : bool;
      } else if (detectedType === 'date') {
        const date = parseDate(normalized);
        output[key] = date ? date.toISOString() : normalized;
      } else {
        output[key] = normalized;
      }
    }
    return output;
  });
}

export function detectMostVariantNumeric(columns: ColumnInfo[]): ColumnInfo | null {
  const numeric = columns.filter((col) => col.detectedType === 'number' && col.stats.numeric);
  if (!numeric.length) return null;
  return numeric.sort((a, b) => (b.stats.numeric?.variance || 0) - (a.stats.numeric?.variance || 0))[0];
}

export function getMissingPercent(rows: Record<string, unknown>[], columns: ColumnInfo[]): number {
  if (!rows.length || !columns.length) return 0;
  const total = rows.length * columns.length;
  let missing = 0;
  for (const row of rows) {
    for (const col of columns) {
      const value = row[col.name];
      if (value === null || value === undefined || value === '') missing += 1;
    }
  }
  return total ? (missing / total) * 100 : 0;
}
