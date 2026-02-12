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
import { buildHistogram, groupByAggregate, extractScatterSeries } from '../lib/aggregations';
import { downsample } from '../lib/sampling';
import { ChartConfig, ChartSuggestion, Dataset } from '../types/data';

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

  const chartData = useMemo(() => {
    if (!dataset) return [];
    const rows = dataset.rows;

    if (chartConfig.type === 'bar' || chartConfig.type === 'pie') {
      if (!chartConfig.xKey) return [];
      const result = groupByAggregate(
        rows,
        chartConfig.xKey,
        chartConfig.yKey,
        chartConfig.aggregation || 'count',
        chartConfig.excludeMissing ?? true
      );
      const topN = chartConfig.topN ?? 10;
      return result.slice(0, topN);
    }

    if (chartConfig.type === 'line' || chartConfig.type === 'area') {
      if (!chartConfig.xKey || !chartConfig.yKey) return [];
      const grouped = new Map<string, number[]>();
      for (const row of rows) {
        const x = row[chartConfig.xKey];
        const y = row[chartConfig.yKey];
        if (chartConfig.excludeMissing && (x === null || x === undefined || y === null || y === undefined)) continue;
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
        switch (chartConfig.aggregation) {
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

    if (chartConfig.type === 'scatter') {
      if (!chartConfig.xKey || !chartConfig.yKey) return [];
      const series = extractScatterSeries(
        rows,
        chartConfig.xKey,
        chartConfig.yKey,
        chartConfig.colorKey,
        chartConfig.excludeMissing ?? true
      );
      return downsample(series, CHART_LIMIT, 'Scatter chart').rows;
    }

    if (chartConfig.type === 'histogram') {
      if (!chartConfig.xKey) return [];
      return buildHistogram(rows, chartConfig.xKey, 12, chartConfig.excludeMissing ?? true);
    }

    return [];
  }, [chartConfig, dataset]);

  const chartWarning = useMemo(() => {
    if (!dataset) return undefined;
    if (chartConfig.type === 'line' || chartConfig.type === 'area' || chartConfig.type === 'scatter') {
      if (dataset.rowCount > CHART_LIMIT) {
        return `This chart is sampled to ${CHART_LIMIT.toLocaleString()} points for performance.`;
      }
    }
    return undefined;
  }, [chartConfig.type, dataset]);

  const previewRows = dataset ? dataset.rows.slice(0, 50) : [];

  const handleSuggestionApply = (suggestion: ChartSuggestion) => {
    setChartConfig((prev) => ({ ...prev, ...suggestion.config }));
  };

  const handleSheetChange = async (value: string) => {
    if (!currentFile) return;
    await loadFile(currentFile, value);
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

                <div className="card p-5">
                  <p className="section-title">Build your chart</p>
                  <h3 className="text-lg font-semibold">Chart builder</h3>

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
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <ChartPanel config={chartConfig} data={chartData} warning={chartWarning} />
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
