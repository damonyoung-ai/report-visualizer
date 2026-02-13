'use client';

import { useMemo, useState } from 'react';
import Uploader from '../components/Uploader';
import SchemaSummary from '../components/SchemaSummary';
import SuggestedCharts from '../components/SuggestedCharts';
import ChartPanel from '../components/ChartPanel';
import TablePreview from '../components/TablePreview';
import { parseCsv, parseXlsx } from '../lib/parsers';
import {
  coerceRowTypes,
  detectMostVariantNumeric,
  getMissingPercent,
  inferColumns,
} from '../lib/inference';
import { buildSuggestions } from '../lib/chartSuggestions';
import {
  buildHistogram,
  buildHistogramFromValues,
  groupByAggregate,
  extractScatterSeries,
} from '../lib/aggregations';
import { downsample } from '../lib/sampling';
import { ChartConfig, ChartSuggestion, ColumnInfo, Dataset } from '../types/data';

const CHART_LIMIT = 5000;

export default function Home() {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [chartConfig, setChartConfig] = useState<ChartConfig>({
    type: 'bar',
    aggregation: 'sum',
    topN: 10,
    excludeMissing: true,
  });
  const [charts, setCharts] = useState<
    { id: string; title: string; config: ChartConfig }[]
  >([]);
  const [activeChartId, setActiveChartId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [compareColumn, setCompareColumn] = useState<string>('');
  const [compareValueA, setCompareValueA] = useState<string>('');
  const [compareValueB, setCompareValueB] = useState<string>('');

  const [activeSheet, setActiveSheet] = useState<string | undefined>(undefined);

  const loadFile = async (file: File, sheet?: string) => {
    setError(null);
    setDataset(null);
    setActiveSheet(sheet);
    try {
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!extension || !['csv', 'xlsx'].includes(extension)) {
        throw new Error('Unsupported file type. Please upload a CSV or XLSX file.');
      }

      let parseResult;
      if (extension === 'csv') {
        parseResult = await parseCsv(file);
      } else {
        parseResult = await parseXlsx(file, sheet);
      }

      if (!parseResult.rows.length) {
        throw new Error('The file appears to be empty.');
      }

      const columns = inferColumns(parseResult.rows, parseResult.columns);
      const coercedRows = coerceRowTypes(parseResult.rows, columns);

      const warnings: string[] = [];
      if (coercedRows.length > 200000) {
        warnings.push('Large dataset detected. Charts will use sampling for performance.');
      }

      const nextDataset: Dataset = {
        name: file.name,
        rows: coercedRows,
        columns,
        rowCount: coercedRows.length,
        warnings,
        sourceType: extension === 'csv' ? 'csv' : 'xlsx',
        sheetName: sheet,
        sheetNames: parseResult.sheetNames,
      };

      setDataset(nextDataset);
      setCharts([]);
      setActiveChartId(null);
      setRenamingId(null);

      const numericCols = columns.filter((col) => col.detectedType === 'number');
      const categoryCols = columns.filter((col) => col.detectedType === 'category' || col.detectedType === 'string');
      const dateCols = columns.filter((col) => col.detectedType === 'date');

      const suggestions = buildSuggestions(columns);
      if (suggestions[0]) {
        setChartConfig((prev) => ({ ...prev, ...suggestions[0].config }));
      } else {
        setChartConfig((prev) => ({
          ...prev,
          type: dateCols.length && numericCols.length ? 'line' : 'bar',
          xKey: (dateCols[0]?.name || categoryCols[0]?.name || columns[0]?.name) ?? prev.xKey,
          yKey: numericCols[0]?.name ?? prev.yKey,
        }));
      }

      const defaultCharts = buildDefaultDashboard(columns);
      if (defaultCharts.length) {
        setCharts(defaultCharts);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file.');
    }
  };

  const handleExample = async (path: string) => {
    const response = await fetch(path);
    const blob = await response.blob();
    const name = path.split('/').pop() || 'example.csv';
    const file = new File([blob], name, { type: blob.type });
    setCurrentFile(file);
    await loadFile(file);
  };

  const handleFileSelected = async (file: File) => {
    setCurrentFile(file);
    await loadFile(file);
  };

  const columns = dataset?.columns ?? [];
  const numericColumns = columns.filter((col) => col.detectedType === 'number');
  const categoryColumns = columns.filter((col) => col.detectedType === 'category' || col.detectedType === 'string');
  const dateColumns = columns.filter((col) => col.detectedType === 'date');

  const missingPercent = dataset ? getMissingPercent(dataset.rows, dataset.columns) : 0;

  const suggestions = useMemo(() => buildSuggestions(columns), [columns]);

  const suggestedNumeric = detectMostVariantNumeric(columns) ?? numericColumns[0];
  const suggestedCategory = categoryColumns[0];

  const dateSetKey = columns.find((col) => col.name.toLowerCase() === 'date set')?.name;
  const meetingDateKey = columns.find((col) => col.name.toLowerCase() === 'meeting date')?.name;
  const sourceKey = columns.find((col) => col.name.toLowerCase() === 'source')?.name;
  const statusKey = columns.find((col) => col.name.toLowerCase() === 'status')?.name;
  const brandKey = columns.find((col) => col.name.toLowerCase() === 'brand name')?.name;

  const dateMetrics = useMemo(() => {
    if (!dataset || !dateSetKey || !meetingDateKey) return null;
    const lagDays: number[] = [];
    let minSet: number | null = null;
    let maxSet: number | null = null;
    let minMeeting: number | null = null;
    let maxMeeting: number | null = null;
    for (const row of dataset.rows) {
      const setRaw = row[dateSetKey];
      const meetRaw = row[meetingDateKey];
      const setDate = setRaw ? new Date(String(setRaw)) : null;
      const meetDate = meetRaw ? new Date(String(meetRaw)) : null;
      if (setDate && !Number.isNaN(setDate.getTime())) {
        const t = setDate.getTime();
        minSet = minSet === null ? t : Math.min(minSet, t);
        maxSet = maxSet === null ? t : Math.max(maxSet, t);
      }
      if (meetDate && !Number.isNaN(meetDate.getTime())) {
        const t = meetDate.getTime();
        minMeeting = minMeeting === null ? t : Math.min(minMeeting, t);
        maxMeeting = maxMeeting === null ? t : Math.max(maxMeeting, t);
      }
      if (setDate && meetDate && !Number.isNaN(setDate.getTime()) && !Number.isNaN(meetDate.getTime())) {
        const diff = (meetDate.getTime() - setDate.getTime()) / (1000 * 60 * 60 * 24);
        lagDays.push(diff);
      }
    }
    const avgLag = lagDays.length ? lagDays.reduce((a, b) => a + b, 0) / lagDays.length : null;
    return {
      minSet,
      maxSet,
      minMeeting,
      maxMeeting,
      avgLag,
    };
  }, [dataset, dateSetKey, meetingDateKey]);

  const brandMetrics = useMemo(() => {
    if (!dataset || !brandKey) return null;
    const counts = new Map<string, number>();
    for (const row of dataset.rows) {
      const brand = String(row[brandKey] ?? 'Missing');
      counts.set(brand, (counts.get(brand) ?? 0) + 1);
    }
    const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
    return {
      totalBrands: counts.size,
      topBrand: sorted[0]?.[0],
      topBrandCount: sorted[0]?.[1],
    };
  }, [dataset, brandKey]);

  const buildDefaultDashboard = (cols: ColumnInfo[]) => {
    const resolvedSource = sourceKey ?? cols.find((col) => col.name.toLowerCase() === 'source')?.name;
    const resolvedStatus = statusKey ?? cols.find((col) => col.name.toLowerCase() === 'status')?.name;
    const resolvedBrand = brandKey ?? cols.find((col) => col.name.toLowerCase() === 'brand name')?.name;
    const resolvedDateSet = dateSetKey ?? cols.find((col) => col.name.toLowerCase() === 'date set')?.name;
    const resolvedMeeting = meetingDateKey ?? cols.find((col) => col.name.toLowerCase() === 'meeting date')?.name;

    const items: { id: string; title: string; config: ChartConfig }[] = [];
    const pushChart = (title: string, config: ChartConfig) => {
      items.push({ id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, title, config });
    };

    if (resolvedSource) {
      pushChart('Source counts', { type: 'bar', xKey: resolvedSource, aggregation: 'count', topN: 12, excludeMissing: true });
      pushChart('Source share %', { type: 'pie', xKey: resolvedSource, aggregation: 'count', topN: 12, excludeMissing: true });
    }
    if (resolvedStatus) {
      pushChart('Status counts', { type: 'bar', xKey: resolvedStatus, aggregation: 'count', topN: 12, excludeMissing: true });
      pushChart('Status share %', { type: 'pie', xKey: resolvedStatus, aggregation: 'count', topN: 12, excludeMissing: true });
    }
    if (resolvedSource && resolvedStatus) {
      pushChart('Status by Source', { type: 'stackedBar', xKey: resolvedSource, seriesKey: resolvedStatus, topN: 10, excludeMissing: true });
    }
    if (resolvedBrand) {
      pushChart('Top Brands', { type: 'bar', xKey: resolvedBrand, aggregation: 'count', topN: 12, excludeMissing: true });
      if (resolvedStatus) {
        pushChart('Brand by Status', { type: 'stackedBar', xKey: resolvedBrand, seriesKey: resolvedStatus, topN: 10, excludeMissing: true });
      }
    }
    if (resolvedDateSet) {
      pushChart('Date Set volume', { type: 'line', xKey: resolvedDateSet, aggregation: 'count', excludeMissing: true });
    }
    if (resolvedMeeting) {
      pushChart('Meeting Date volume', { type: 'line', xKey: resolvedMeeting, aggregation: 'count', excludeMissing: true });
    }
    if (resolvedDateSet && resolvedMeeting) {
      pushChart('Lag days (Set → Meeting)', { type: 'lagHistogram', startKey: resolvedDateSet, endKey: resolvedMeeting, excludeMissing: true });
    }

    return items;
  };

  const displayColumnName = (name: string) => name.replace(/_\d+$/, '');

  const addCategoricalChart = (column: string, type: 'bar' | 'pie') => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const title = `${type === 'bar' ? 'Count by' : 'Share of'} ${displayColumnName(column)}`;
    setCharts((prev) => [
      { id, title, config: { type, xKey: column, aggregation: 'count', topN: 12, excludeMissing: true } },
      ...prev,
    ]);
  };

  const buildChartData = (config: ChartConfig) => {
    if (!dataset) return [];
    const rows = dataset.rows;

    if (config.type === 'bar' || config.type === 'pie') {
      if (!config.xKey) return [];
      const result = groupByAggregate(
        rows,
        config.xKey,
        config.yKey,
        config.aggregation || 'count',
        config.excludeMissing ?? true
      );
      const topN = config.topN ?? 10;
      return result.slice(0, topN);
    }

    if (config.type === 'line' || config.type === 'area') {
      if (!config.xKey) return [];
      const grouped = new Map<string, number[]>();
      for (const row of rows) {
        const x = row[config.xKey];
        const y = config.yKey ? row[config.yKey] : 1;
        if (config.excludeMissing && (x === null || x === undefined || y === null || y === undefined)) continue;
        const key = String(x ?? 'Missing');
        const yNum = typeof y === 'number' ? y : Number(y);
        if (!Number.isFinite(yNum)) continue;
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key)?.push(yNum);
      }
      const data = Array.from(grouped.entries()).map(([key, values]) => {
        const sum = values.reduce((a, b) => a + b, 0);
        const avg = values.length ? sum / values.length : 0;
        const min = Math.min(...values);
        const max = Math.max(...values);
        let value = sum;
        switch (config.aggregation) {
          case 'avg':
            value = avg;
            break;
          case 'min':
            value = min;
            break;
          case 'max':
            value = max;
            break;
          case 'count':
            value = values.length;
            break;
          default:
            value = sum;
        }
        return { x: key, y: value };
      });

      const sorted = data.sort((a, b) => {
        const aNum = Number(a.x);
        const bNum = Number(b.x);
        if (Number.isFinite(aNum) && Number.isFinite(bNum)) return aNum - bNum;
        const aDate = Date.parse(String(a.x));
        const bDate = Date.parse(String(b.x));
        if (!Number.isNaN(aDate) && !Number.isNaN(bDate)) return aDate - bDate;
        return String(a.x).localeCompare(String(b.x));
      });
      return downsample(sorted, CHART_LIMIT, 'Line/area chart').rows;
    }

    if (config.type === 'scatter') {
      if (!config.xKey || !config.yKey) return [];
      const series = extractScatterSeries(
        rows,
        config.xKey,
        config.yKey,
        config.colorKey,
        config.excludeMissing ?? true
      );
      return downsample(series, CHART_LIMIT, 'Scatter chart').rows;
    }

    if (config.type === 'histogram') {
      if (!config.xKey) return [];
      return buildHistogram(rows, config.xKey, 12, config.excludeMissing ?? true);
    }

    if (config.type === 'stackedBar') {
      if (!config.xKey || !config.seriesKey) return [];
      const grouped = new Map<string, Record<string, number>>();
      const seriesValues = new Set<string>();
      const seriesKey: string = config.seriesKey;
      for (const row of rows) {
        const groupRaw: unknown = row[config.xKey];
        const seriesRaw: unknown = row[seriesKey];
        if (config.excludeMissing && (groupRaw === null || groupRaw === undefined || seriesRaw === null || seriesRaw === undefined)) {
          continue;
        }
        const group = String(groupRaw ?? 'Missing');
        const series = String(seriesRaw ?? 'Missing');
        seriesValues.add(series);
        if (!grouped.has(group)) grouped.set(group, {});
        const bucket = grouped.get(group)!;
        bucket[series] = (bucket[series] ?? 0) + 1;
      }
      const data = Array.from(grouped.entries()).map(([name, counts]) => ({ name, ...counts }));
      const topN = config.topN ?? 10;
      return data
        .sort((a, b) => {
          const aSum = Object.values(a).reduce((acc, value) => (typeof value === 'number' ? acc + value : acc), 0);
          const bSum = Object.values(b).reduce((acc, value) => (typeof value === 'number' ? acc + value : acc), 0);
          return bSum - aSum;
        })
        .slice(0, topN);
    }

    if (config.type === 'lagHistogram') {
      if (!config.startKey || !config.endKey) return [];
      const values: number[] = [];
      for (const row of rows) {
        const startRaw = row[config.startKey];
        const endRaw = row[config.endKey];
        if (config.excludeMissing && (startRaw === null || startRaw === undefined || endRaw === null || endRaw === undefined)) continue;
        const start = new Date(String(startRaw));
        const end = new Date(String(endRaw));
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) continue;
        values.push((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      }
      return buildHistogramFromValues(values, 12);
    }

    return [];
  };

  const buildChartWarning = (config: ChartConfig) => {
    if (!dataset) return undefined;
    if (config.type === 'line' || config.type === 'area' || config.type === 'scatter') {
      if (dataset.rowCount > CHART_LIMIT) {
        return `This chart is sampled to ${CHART_LIMIT.toLocaleString()} points for performance.`;
      }
    }
    return undefined;
  };

  const previewRows = dataset ? dataset.rows.slice(0, 50) : [];

  const handleSuggestionApply = (suggestion: ChartSuggestion) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setCharts((prev) => [
      { id, title: suggestion.title, config: suggestion.config },
      ...prev,
    ]);
  };

  const handleSheetChange = async (value: string) => {
    if (!currentFile) return;
    await loadFile(currentFile, value);
  };

  const compareOptions = useMemo(() => {
    if (!dataset || !compareColumn) return [];
    const values = new Set<string>();
    for (const row of dataset.rows) {
      const value = row[compareColumn];
      if (value === null || value === undefined || value === '') continue;
      values.add(String(value));
    }
    return Array.from(values).sort((a, b) => a.localeCompare(b)).slice(0, 50);
  }, [compareColumn, dataset]);

  const compareStats = useMemo(() => {
    if (!dataset || !compareColumn) return null;
    if (!compareValueA || !compareValueB) return null;
    let countA = 0;
    let countB = 0;
    for (const row of dataset.rows) {
      const value = String(row[compareColumn] ?? '');
      if (value === compareValueA) countA += 1;
      if (value === compareValueB) countB += 1;
    }
    const ratio = countB ? countA / countB : null;
    return { countA, countB, ratio };
  }, [compareColumn, compareValueA, compareValueB, dataset]);

  const addChartFromBuilder = () => {
    if (activeChartId) {
      setCharts((prev) =>
        prev.map((chart) =>
          chart.id === activeChartId
            ? { ...chart, config: { ...chartConfig } }
            : chart
        )
      );
      setActiveChartId(null);
      return;
    }

    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const title = `${chartConfig.type.toUpperCase()} chart`;
    setCharts((prev) => [{ id, title, config: { ...chartConfig } }, ...prev]);
  };

  const removeChart = (id: string) => {
    setCharts((prev) => prev.filter((chart) => chart.id !== id));
    if (activeChartId === id) setActiveChartId(null);
    if (renamingId === id) setRenamingId(null);
  };

  const startEditChart = (id: string) => {
    const chart = charts.find((item) => item.id === id);
    if (!chart) return;
    setChartConfig({ ...chart.config });
    setActiveChartId(id);
  };

  const cancelEdit = () => {
    setActiveChartId(null);
  };

  const handleRenameChange = (id: string, value: string) => {
    setCharts((prev) => prev.map((chart) => (chart.id === id ? { ...chart, title: value } : chart)));
  };

  const reorderCharts = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    setCharts((prev) => {
      const fromIndex = prev.findIndex((c) => c.id === fromId);
      const toIndex = prev.findIndex((c) => c.id === toId);
      if (fromIndex === -1 || toIndex === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  return (
    <main className="min-h-screen bg-grid px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-3">
          <p className="section-title">Report Visualizer</p>
          <h1 className="text-4xl font-semibold">Turn spreadsheets into visual reports</h1>
          <p className="max-w-2xl text-sm text-slate/70">
            Upload a CSV or XLSX file and get instant chart suggestions, custom dashboards, and exportable visuals.
            Everything stays in your browser.
          </p>
        </header>

        {!dataset ? (
          <Uploader onFileSelected={handleFileSelected} onExample={handleExample} error={error} />
        ) : (
          <div className="flex flex-col gap-6">
            {dataset.warnings.length ? (
              <div className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning">
                {dataset.warnings.map((warning) => (
                  <div key={warning}>{warning}</div>
                ))}
              </div>
            ) : null}
            <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
              <div className="flex flex-col gap-6">
                <SchemaSummary
                  columns={columns}
                  rowCount={dataset.rowCount}
                  missingPercent={missingPercent}
                  selectedNumeric={suggestedNumeric}
                  selectedCategory={suggestedCategory}
                />
                {(dateMetrics || brandMetrics) && (
                  <div className="card p-5">
                    <p className="section-title">Additional metrics</p>
                    <h3 className="text-lg font-semibold">Dates & Brands</h3>
                    <div className="mt-4 grid gap-3 text-sm">
                      {dateMetrics ? (
                        <div className="rounded-xl bg-ink/5 p-3">
                          <div className="text-xs text-slate/70">Date range</div>
                          <div className="text-xs">
                            Set: {dateMetrics.minSet ? new Date(dateMetrics.minSet).toLocaleDateString() : '—'} →{' '}
                            {dateMetrics.maxSet ? new Date(dateMetrics.maxSet).toLocaleDateString() : '—'}
                          </div>
                          <div className="text-xs">
                            Meeting: {dateMetrics.minMeeting ? new Date(dateMetrics.minMeeting).toLocaleDateString() : '—'} →{' '}
                            {dateMetrics.maxMeeting ? new Date(dateMetrics.maxMeeting).toLocaleDateString() : '—'}
                          </div>
                          <div className="text-xs">
                            Avg lag: {dateMetrics.avgLag !== null ? `${dateMetrics.avgLag.toFixed(1)} days` : '—'}
                          </div>
                        </div>
                      ) : null}
                      {brandMetrics ? (
                        <div className="rounded-xl bg-ink/5 p-3">
                          <div className="text-xs text-slate/70">Brand metrics</div>
                          <div className="text-xs">Distinct brands: {brandMetrics.totalBrands}</div>
                          <div className="text-xs">
                            Top brand: {brandMetrics.topBrand ?? '—'} ({brandMetrics.topBrandCount ?? 0})
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}

                <div className="card p-5">
                  <p className="section-title">Build your chart</p>
                  <h3 className="text-lg font-semibold">Chart builder</h3>
                  {activeChartId ? (
                    <div className="mt-2 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-xs text-accent">
                      Editing an existing chart. Update settings and click “Update selected chart”.
                    </div>
                  ) : null}

                  <div className="mt-4 space-y-3 text-sm">
                    {dataset.sourceType === 'xlsx' && dataset.sheetNames?.length ? (
                      <label className="flex flex-col gap-1">
                        <span className="text-xs text-slate/70">Sheet</span>
                        <select
                          className="rounded-lg border border-slate/20 px-3 py-2"
                          value={activeSheet ?? dataset.sheetNames[0]}
                          onChange={(event) => handleSheetChange(event.target.value)}
                        >
                          {dataset.sheetNames.map((sheet) => (
                            <option key={sheet} value={sheet}>
                              {sheet}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : null}

                    <label className="flex flex-col gap-1">
                      <span className="text-xs text-slate/70">Chart type</span>
                      <select
                        className="rounded-lg border border-slate/20 px-3 py-2"
                        value={chartConfig.type}
                        onChange={(event) => setChartConfig((prev) => ({ ...prev, type: event.target.value as ChartConfig['type'] }))}
                      >
                        <option value="bar">Bar</option>
                        <option value="line">Line</option>
                        <option value="area">Area</option>
                        <option value="scatter">Scatter</option>
                        <option value="pie">Pie</option>
                        <option value="histogram">Histogram</option>
                      </select>
                    </label>

                    {(chartConfig.type === 'bar' || chartConfig.type === 'pie') && (
                      <label className="flex flex-col gap-1">
                        <span className="text-xs text-slate/70">Category (X)</span>
                        <select
                          className="rounded-lg border border-slate/20 px-3 py-2"
                          value={chartConfig.xKey ?? ''}
                          onChange={(event) => setChartConfig((prev) => ({ ...prev, xKey: event.target.value }))}
                        >
                          {categoryColumns.map((col) => (
                            <option key={col.name} value={col.name}>
                              {col.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}

                    {(chartConfig.type === 'bar' || chartConfig.type === 'pie') && (
                      <label className="flex flex-col gap-1">
                        <span className="text-xs text-slate/70">Numeric (Y)</span>
                        <select
                          className="rounded-lg border border-slate/20 px-3 py-2"
                          value={chartConfig.yKey ?? ''}
                          onChange={(event) => setChartConfig((prev) => ({ ...prev, yKey: event.target.value }))}
                        >
                          <option value="">(count only)</option>
                          {numericColumns.map((col) => (
                            <option key={col.name} value={col.name}>
                              {col.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}

                    {(chartConfig.type === 'line' || chartConfig.type === 'area') && (
                      <>
                        <label className="flex flex-col gap-1">
                          <span className="text-xs text-slate/70">X axis (Date/Numeric)</span>
                          <select
                            className="rounded-lg border border-slate/20 px-3 py-2"
                            value={chartConfig.xKey ?? ''}
                            onChange={(event) => setChartConfig((prev) => ({ ...prev, xKey: event.target.value }))}
                          >
                            {[...dateColumns, ...numericColumns].map((col) => (
                              <option key={col.name} value={col.name}>
                                {col.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="flex flex-col gap-1">
                          <span className="text-xs text-slate/70">Y axis (Numeric)</span>
                          <select
                            className="rounded-lg border border-slate/20 px-3 py-2"
                            value={chartConfig.yKey ?? ''}
                            onChange={(event) => setChartConfig((prev) => ({ ...prev, yKey: event.target.value }))}
                          >
                            {numericColumns.map((col) => (
                              <option key={col.name} value={col.name}>
                                {col.name}
                              </option>
                            ))}
                          </select>
                        </label>
                      </>
                    )}

                    {chartConfig.type === 'scatter' && (
                      <>
                        <label className="flex flex-col gap-1">
                          <span className="text-xs text-slate/70">X axis (Numeric)</span>
                          <select
                            className="rounded-lg border border-slate/20 px-3 py-2"
                            value={chartConfig.xKey ?? ''}
                            onChange={(event) => setChartConfig((prev) => ({ ...prev, xKey: event.target.value }))}
                          >
                            {numericColumns.map((col) => (
                              <option key={col.name} value={col.name}>
                                {col.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="flex flex-col gap-1">
                          <span className="text-xs text-slate/70">Y axis (Numeric)</span>
                          <select
                            className="rounded-lg border border-slate/20 px-3 py-2"
                            value={chartConfig.yKey ?? ''}
                            onChange={(event) => setChartConfig((prev) => ({ ...prev, yKey: event.target.value }))}
                          >
                            {numericColumns.map((col) => (
                              <option key={col.name} value={col.name}>
                                {col.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="flex flex-col gap-1">
                          <span className="text-xs text-slate/70">Color by (Category)</span>
                          <select
                            className="rounded-lg border border-slate/20 px-3 py-2"
                            value={chartConfig.colorKey ?? ''}
                            onChange={(event) => setChartConfig((prev) => ({ ...prev, colorKey: event.target.value }))}
                          >
                            <option value="">None</option>
                            {categoryColumns.map((col) => (
                              <option key={col.name} value={col.name}>
                                {col.name}
                              </option>
                            ))}
                          </select>
                        </label>
                      </>
                    )}

                    {chartConfig.type === 'histogram' && (
                      <label className="flex flex-col gap-1">
                        <span className="text-xs text-slate/70">Numeric column</span>
                        <select
                          className="rounded-lg border border-slate/20 px-3 py-2"
                          value={chartConfig.xKey ?? ''}
                          onChange={(event) => setChartConfig((prev) => ({ ...prev, xKey: event.target.value }))}
                        >
                          {numericColumns.map((col) => (
                            <option key={col.name} value={col.name}>
                              {col.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}

                    {(chartConfig.type === 'bar' || chartConfig.type === 'pie') && (
                      <label className="flex flex-col gap-1">
                        <span className="text-xs text-slate/70">Aggregation</span>
                        <select
                          className="rounded-lg border border-slate/20 px-3 py-2"
                          value={chartConfig.aggregation ?? 'count'}
                          onChange={(event) => setChartConfig((prev) => ({ ...prev, aggregation: event.target.value as ChartConfig['aggregation'] }))}
                        >
                          <option value="sum">Sum</option>
                          <option value="avg">Average</option>
                          <option value="min">Min</option>
                          <option value="max">Max</option>
                          <option value="count">Count</option>
                        </select>
                      </label>
                    )}

                    {(chartConfig.type === 'line' || chartConfig.type === 'area') && (
                      <label className="flex flex-col gap-1">
                        <span className="text-xs text-slate/70">Aggregation</span>
                        <select
                          className="rounded-lg border border-slate/20 px-3 py-2"
                          value={chartConfig.aggregation ?? 'sum'}
                          onChange={(event) => setChartConfig((prev) => ({ ...prev, aggregation: event.target.value as ChartConfig['aggregation'] }))}
                        >
                          <option value="sum">Sum</option>
                          <option value="avg">Average</option>
                          <option value="min">Min</option>
                          <option value="max">Max</option>
                          <option value="count">Count</option>
                        </select>
                      </label>
                    )}

                    {(chartConfig.type === 'bar' || chartConfig.type === 'pie') && (
                      <label className="flex flex-col gap-1">
                        <span className="text-xs text-slate/70">Top N categories</span>
                        <input
                          type="range"
                          min={3}
                          max={20}
                          value={chartConfig.topN ?? 10}
                          onChange={(event) => setChartConfig((prev) => ({ ...prev, topN: Number(event.target.value) }))}
                        />
                        <span className="text-xs text-slate/60">{chartConfig.topN ?? 10} categories</span>
                      </label>
                    )}

                    <label className="flex items-center gap-2 text-xs text-slate/70">
                      <input
                        type="checkbox"
                        checked={chartConfig.excludeMissing ?? true}
                        onChange={(event) => setChartConfig((prev) => ({ ...prev, excludeMissing: event.target.checked }))}
                      />
                      Exclude missing values
                    </label>

                    {!numericColumns.length && (
                      <div className="rounded-lg border border-warning/30 bg-warning/10 p-2 text-xs text-warning">
                        No numeric columns detected. Charts needing numeric values will be limited.
                      </div>
                    )}

                    <button
                      type="button"
                      className="w-full rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white"
                      onClick={addChartFromBuilder}
                    >
                      {activeChartId ? 'Update selected chart' : 'Add chart to dashboard'}
                    </button>
                    {activeChartId ? (
                      <button
                        type="button"
                        className="w-full rounded-xl border border-slate/20 px-4 py-2 text-sm font-semibold text-slate/70"
                        onClick={cancelEdit}
                      >
                        Cancel edit
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="card p-5">
                  <p className="section-title">Categorical quick charts</p>
                  <h3 className="text-lg font-semibold">Compare categories</h3>
                  <div className="mt-4 space-y-3 text-sm">
                    {categoryColumns.length ? (
                      categoryColumns.map((col) => (
                        <div key={col.name} className="rounded-lg border border-slate/10 p-3">
                          <div className="text-xs font-semibold">{displayColumnName(col.name)}</div>
                          <div className="mt-2 flex gap-2">
                            <button
                              type="button"
                              className="rounded-full border border-slate/20 px-3 py-1 text-xs font-semibold"
                              onClick={() => addCategoricalChart(col.name, 'bar')}
                            >
                              Count
                            </button>
                            <button
                              type="button"
                              className="rounded-full border border-slate/20 px-3 py-1 text-xs font-semibold"
                              onClick={() => addCategoricalChart(col.name, 'pie')}
                            >
                              Share %
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-slate/60">No categorical columns detected.</div>
                    )}
                  </div>
                </div>

                <div className="card p-5">
                  <p className="section-title">Value comparison</p>
                  <h3 className="text-lg font-semibold">Compare two values</h3>
                  <div className="mt-4 space-y-3 text-sm">
                    <label className="flex flex-col gap-1">
                      <span className="text-xs text-slate/70">Category column</span>
                      <select
                        className="rounded-lg border border-slate/20 px-3 py-2"
                        value={compareColumn}
                        onChange={(event) => {
                          setCompareColumn(event.target.value);
                          setCompareValueA('');
                          setCompareValueB('');
                        }}
                      >
                        <option value="">Select column</option>
                        {categoryColumns.map((col) => (
                          <option key={col.name} value={col.name}>
                            {col.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex flex-col gap-1">
                        <span className="text-xs text-slate/70">Value A</span>
                        <select
                          className="rounded-lg border border-slate/20 px-3 py-2"
                          value={compareValueA}
                          onChange={(event) => setCompareValueA(event.target.value)}
                        >
                          <option value="">Select value</option>
                          {compareOptions.map((option) => (
                            <option key={`a-${option}`} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs text-slate/70">Value B</span>
                        <select
                          className="rounded-lg border border-slate/20 px-3 py-2"
                          value={compareValueB}
                          onChange={(event) => setCompareValueB(event.target.value)}
                        >
                          <option value="">Select value</option>
                          {compareOptions.map((option) => (
                            <option key={`b-${option}`} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    {compareStats ? (
                      <div className="rounded-lg border border-slate/10 bg-white p-3 text-xs">
                        <div>
                          {compareValueA}: {compareStats.countA}
                        </div>
                        <div>
                          {compareValueB}: {compareStats.countB}
                        </div>
                        <div>
                          Ratio A/B: {compareStats.ratio !== null ? compareStats.ratio.toFixed(2) : '—'}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate/60">Pick two values to compare counts.</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <div className="card p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="section-title">Dashboard</p>
                      <h3 className="text-lg font-semibold">Your charts</h3>
                    </div>
                    <span className="text-xs text-slate/60">{charts.length} charts</span>
                  </div>
                  {charts.length ? (
                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                      {charts.map((chart) => {
                        const data = buildChartData(chart.config);
                        const isWide =
                          ['bar', 'histogram', 'stackedBar', 'lagHistogram'].includes(chart.config.type) &&
                          data.length > 6;
                        return (
                          <div key={chart.id} className={isWide ? 'lg:col-span-2' : ''}>
                            <ChartPanel
                              config={chart.config}
                              data={data}
                              warning={buildChartWarning(chart.config)}
                              title={chart.title}
                              onRemove={() => removeChart(chart.id)}
                              onEdit={() => startEditChart(chart.id)}
                              isTitleEditing={renamingId === chart.id}
                              onTitleChange={(value) => handleRenameChange(chart.id, value)}
                              onTitleBlur={() => setRenamingId(null)}
                              onStartRename={() => setRenamingId(chart.id)}
                              seriesKeys={
                                chart.config.type === 'stackedBar' && chart.config.seriesKey
                                  ? Array.from(
                                      new Set(
                                        dataset?.rows
                                          .map((row) => String(row[chart.config.seriesKey!] ?? 'Missing'))
                                      )
                                    )
                                  : undefined
                              }
                              draggableProps={{
                                draggable: true,
                                onDragStart: () => setDraggingId(chart.id),
                                onDragEnd: () => setDraggingId(null),
                                onDragOver: (event) => event.preventDefault(),
                                onDrop: () => {
                                  if (draggingId) reorderCharts(draggingId, chart.id);
                                  setDraggingId(null);
                                },
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-xl border border-dashed border-slate/20 p-6 text-sm text-slate/60">
                      No charts yet. Use the builder or click a suggestion to add charts to the dashboard.
                    </div>
                  )}
                </div>
                <SuggestedCharts suggestions={suggestions} onApply={handleSuggestionApply} />
              </div>
            </div>

            <TablePreview rows={previewRows} columns={columns.map((col) => col.name)} />
          </div>
        )}
      </div>
    </main>
  );
}
