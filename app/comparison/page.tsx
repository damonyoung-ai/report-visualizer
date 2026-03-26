'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import html2canvas from 'html2canvas';
import FilterBar from '../../components/FilterBar';
import ComparisonModeCard, { ComparisonView } from '../../components/ComparisonModeCard';
import ComparisonSummary from '../../components/ComparisonSummary';
import ComparisonTrendCharts from '../../components/ComparisonTrendCharts';
import ComparisonBreakdowns from '../../components/ComparisonBreakdowns';
import { buildMonthlyBreakdowns, buildMonthlyMetricSummaries, applyFilters, countBy } from '../../lib/aggregations';
import { fetchSheetGrid } from '../../lib/googleSheets';
import { cleanDataset } from '../../lib/cleanDataset';
import { DEFAULT_SHEET_URL } from '../../lib/config';
import { getRollingMonthKeys } from '../../lib/dateUtils';
import { CanonicalRow, Filters } from '../../types/sqo';

function getComparisonFilters(): Filters {
  return {
    dateFrom: '',
    dateTo: '',
    allTime: true,
    sources: [],
    statuses: [],
    aes: [],
    excludeMissing: true,
  };
}

export default function ComparisonPage() {
  const router = useRouter();
  const dashboardRef = useRef<HTMLDivElement | null>(null);
  const [rows, setRows] = useState<CanonicalRow[]>([]);
  const [filters, setFilters] = useState<Filters>(getComparisonFilters);
  const [view, setView] = useState<ComparisonView>('rolling3');
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshHours, setRefreshHours] = useState(12);

  useEffect(() => {
    const raw = sessionStorage.getItem('sqo-dataset');
    if (!raw) {
      router.push('/');
      return;
    }

    const payload = JSON.parse(raw) as {
      rows: {
        dateSet: string | null;
        meetingDate: string | null;
        source: string | null;
        status: string | null;
        ae: string | null;
        raw: Record<string, string | null>;
      }[];
    };

    setRows(
      payload.rows.map((row) => ({
        dateSet: row.dateSet ? new Date(row.dateSet) : null,
        meetingDate: row.meetingDate ? new Date(row.meetingDate) : null,
        source: row.source,
        status: row.status,
        ae: row.ae,
        raw: row.raw,
      }))
    );

    setLastSync(new Date());
    const storedUrl = localStorage.getItem('sqo-sheet-url');
    setSheetUrl(storedUrl || DEFAULT_SHEET_URL);
  }, [router]);

  const syncFromSheet = async () => {
    if (!sheetUrl) return;
    setSyncing(true);
    try {
      const grid = await fetchSheetGrid(sheetUrl);
      const cleaned = cleanDataset(grid);
      setRows(cleaned.rows);
      setLastSync(new Date());
    } catch {
      // keep existing dataset on sync failures
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (!sheetUrl || !autoRefresh) return;
    const intervalMs = Math.max(1, refreshHours) * 60 * 60 * 1000;
    const id = setInterval(() => {
      syncFromSheet();
    }, intervalMs);
    return () => clearInterval(id);
  }, [sheetUrl, autoRefresh, refreshHours]);

  const exportDashboard = async () => {
    if (!dashboardRef.current) return;
    const canvas = await html2canvas(dashboardRef.current, { backgroundColor: '#ffffff', scale: 2 });
    const link = document.createElement('a');
    link.download = 'sqo-comparison-dashboard.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const filtered = useMemo(
    () => applyFilters(rows, { ...filters, dateFrom: '', dateTo: '', allTime: true }),
    [rows, filters]
  );
  const monthKeys = useMemo(() => getRollingMonthKeys(view === 'rolling3' ? 3 : 2), [view]);
  const summaries = useMemo(() => buildMonthlyMetricSummaries(filtered, monthKeys), [filtered, monthKeys]);
  const breakdowns = useMemo(() => buildMonthlyBreakdowns(filtered, monthKeys), [filtered, monthKeys]);
  const current = summaries[summaries.length - 1];
  const previous = summaries.length > 1 ? summaries[summaries.length - 2] : null;

  const sources = useMemo(() => countBy(rows, 'source').map(([label]) => label), [rows]);
  const statuses = useMemo(() => countBy(rows, 'status').map(([label]) => label), [rows]);
  const aes = useMemo(() => countBy(rows, 'ae').map(([label]) => label), [rows]);

  if (!rows.length || !current) {
    return (
      <main className="min-h-screen bg-grid px-6 py-10">
        <div className="mx-auto max-w-4xl">
          <div className="card p-6">
            <h2 className="text-xl font-semibold">No dataset loaded</h2>
            <p className="mt-2 text-sm text-slate/70">Upload a file to view the comparison dashboard.</p>
            <button className="button mt-4" onClick={() => router.push('/')}>Back to upload</button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-grid px-6 py-8">
      <div ref={dashboardRef} className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-2">
          <p className="section-title">SQO Report Visualizer</p>
          <h1 className="text-3xl font-semibold text-white">Month-to-Month Comparison</h1>
          <p className="text-sm text-slate-300">
            Default window: {view === 'rolling3' ? 'rolling 3 months' : 'this month vs last month'}
          </p>
          <div className="flex flex-wrap gap-3">
            <button className="button" onClick={exportDashboard}>Export comparison as PNG</button>
            <button className="button-outline" onClick={() => router.push('/dashboard')}>Back to dashboard</button>
            {sheetUrl ? (
              <button className="button-outline" onClick={syncFromSheet} disabled={syncing}>
                {syncing ? 'Syncing...' : 'Sync now'}
              </button>
            ) : null}
          </div>
        </header>

        <div className="fade-up">
          <ComparisonModeCard view={view} onChange={setView} />
        </div>

        <div className="fade-up-delay relative z-[60] overflow-visible">
          <FilterBar
            filters={filters}
            sources={sources}
            statuses={statuses}
            aes={aes}
            onChange={setFilters}
            showDateRange={false}
          />
        </div>

        <div className="fade-up">
          <ComparisonSummary current={current} previous={previous} />
        </div>

        <div className="fade-up">
          <ComparisonTrendCharts summaries={summaries} />
        </div>

        <div className="fade-up">
          <ComparisonBreakdowns
            sourceRows={breakdowns.source}
            statusRows={breakdowns.status}
            aeRows={breakdowns.ae}
          />
        </div>
      </div>
    </main>
  );
}
