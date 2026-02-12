export type DetectedType = 'number' | 'date' | 'boolean' | 'category' | 'string' | 'unknown';

export type ColumnStats = {
  missingCount: number;
  uniqueCount: number;
  sampleValues: string[];
  numeric?: {
    min: number;
    max: number;
    avg: number;
    variance: number;
  };
};

export type ColumnInfo = {
  name: string;
  detectedType: DetectedType;
  stats: ColumnStats;
};

export type Dataset = {
  name: string;
  rows: Record<string, string | number | boolean | null>[];
  columns: ColumnInfo[];
  rowCount: number;
  warnings: string[];
  sourceType: 'csv' | 'xlsx';
  sheetName?: string;
  sheetNames?: string[];
};

export type Aggregation = 'sum' | 'avg' | 'min' | 'max' | 'count';

export type ChartType = 'bar' | 'line' | 'area' | 'scatter' | 'pie' | 'histogram';

export type ChartConfig = {
  type: ChartType;
  xKey?: string;
  yKey?: string;
  aggregation?: Aggregation;
  topN?: number;
  colorKey?: string;
  excludeMissing?: boolean;
};

export type ChartSuggestion = {
  id: string;
  title: string;
  reason: string;
  config: ChartConfig;
};
