'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import html2canvas from 'html2canvas';
import FilterBar from '../../components/FilterBar';
import KpiStrip from '../../components/KpiStrip';
import SourceCharts from '../../components/SourceCharts';
import StatusCharts from '../../components/StatusCharts';
import MeetingDateCharts from '../../components/MeetingDateCharts';
import DateSetCharts from '../../components/DateSetCharts';
import AeCharts from '../../components/AeCharts';
import DataPreviewTable from '../../components/DataPreviewTable';
import { applyFilters, countBy } from '../../lib/aggregations';
import { formatDate } from '../../lib/dateUtils';
import { fetchSheetGrid } from '../../lib/googleSheets';
import { cleanDataset } from '../../lib/cleanDataset';
import { CanonicalRow, Filters } from '../../types/sqo';

const initialFilters: Filters = {
  sources: [],
  statuses: [],
  aes: [],
  excludeMissing: true,
};

export default function Dashboard() {
  const router = useRouter();
  const [rows, setRows] = useState<CanonicalRow[]>([]);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [topN, setTopN] = useState(10);
  const [ratioMode, setRatioMode] = useState<'all' | 'filtered'>('all');
  const [groupBy, setGroupBy] = useState<'week' | 'month'>('week');
  const [dateSetGroupBy, setDateSetGroupBy] = useState<'day' | 'week' | 'month'>('day');
  const [includeMissing, setIncludeMissing] = useState(false);
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshMinutes, setRefreshMinutes] = useState(5);
  const dashboardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('sqo-dataset');
    if (!raw) {
      router.push('/');
      return;
    }
    const payload = JSON.parse(raw) as { rows: { dateSet: string | null; meetingDate: string | null; source: string | null; status: string | null; ae: string | null; raw: Record<string, string | null> }[] };
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
    setSheetUrl(storedUrl);
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
      // keep existing data if sync fails
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (!sheetUrl || !autoRefresh) return;
    const intervalMs = Math.max(1, refreshMinutes) * 60 * 1000;
    const id = setInterval(() => {
      syncFromSheet();
    }, intervalMs);
    return () => clearInterval(id);
  }, [sheetUrl, autoRefresh, refreshMinutes]);

  const exportDashboard = async () => {
    if (!dashboardRef.current) return;
    const canvas = await html2canvas(dashboardRef.current, { backgroundColor: '#ffffff', scale: 2 });
    const link = document.createElement('a');
    link.download = 'sqo-dashboard.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const exportCleanedCsv = () => {
    const header = ['dateSet', 'meetingDate', 'source', 'status', 'ae'];
    const lines = [header.join(',')];
    rows.forEach((row) => {
      const values = [
        row.dateSet ? row.dateSet.toISOString() : '',
        row.meetingDate ? row.meetingDate.toISOString() : '',
        row.source ?? '',
        row.status ?? '',
        row.ae ?? '',
      ].map((value) => `"${String(value).replace(/"/g, '""')}"`);
      lines.push(values.join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const link = document.createElement('a');
    link.download = 'sqo-cleaned.csv';
    link.href = URL.createObjectURL(blob);
    link.click();
  };

  const filtered = useMemo(() => applyFilters(rows, filters), [rows, filters]);
  const ratioRows = ratioMode === 'all' ? rows : filtered;

  const sources = useMemo(() => countBy(rows, 'source').map(([label]) => label), [rows]);
  const statuses = useMemo(() => countBy(rows, 'status').map(([label]) => label), [rows]);
  const aes = useMemo(() => countBy(rows, 'ae').map(([label]) => label), [rows]);

  const missingMeeting = useMemo(() => (rows.length ? (rows.filter((r) => !r.meetingDate).length / rows.length) * 100 : 0), [rows]);
  const missingStatus = useMemo(() => (rows.length ? (rows.filter((r) => !r.status).length / rows.length) * 100 : 0), [rows]);
  const missingSource = useMemo(() => (rows.length ? (rows.filter((r) => !r.source).length / rows.length) * 100 : 0), [rows]);
  const missingAe = useMemo(() => (rows.length ? (rows.filter((r) => !r.ae).length / rows.length) * 100 : 0), [rows]);

  const dateRange = useMemo(() => {
    const dates = rows.map((row) => row.meetingDate).filter(Boolean) as Date[];
    if (!dates.length) return { min: null, max: null };
    const min = new Date(Math.min(...dates.map((d) => d.getTime())));
    const max = new Date(Math.max(...dates.map((d) => d.getTime())));
    return { min, max };
  }, [rows]);

  const sourceCounts = useMemo(() => countBy(filtered, 'source'), [filtered]);

  if (!rows.length) {
    return (
      <main className="min-h-screen bg-grid px-6 py-10">
        <div className="mx-auto max-w-4xl">
          <div className="card p-6">
            <h2 className="text-xl font-semibold">No dataset loaded</h2>
            <p className="mt-2 text-sm text-slate/70">Upload a file to view the dashboard.</p>
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
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="text-sm text-slate/70">Meeting date range: {formatDate(dateRange.min)} → {formatDate(dateRange.max)}</p>
          <div className="flex flex-wrap gap-3">
            <button className="button" onClick={exportDashboard}>Export dashboard as PNG</button>
            <button className="button-outline" onClick={exportCleanedCsv}>Download cleaned CSV</button>
            <button
              className="button-outline"
              onClick={() => {
                sessionStorage.removeItem('sqo-dataset');
                localStorage.removeItem('sqo-sheet-url');
                router.push('/');
              }}
            >
              Run new report
            </button>
            {sheetUrl ? (
              <button className="button-outline" onClick={syncFromSheet} disabled={syncing}>
                {syncing ? 'Syncing...' : 'Sync now'}
              </button>
            ) : null}
          </div>
          {sheetUrl ? (
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate/60">
              <span>Auto-sync enabled</span>
              <span>Last sync: {lastSync ? lastSync.toLocaleTimeString() : '—'}</span>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={autoRefresh} onChange={(event) => setAutoRefresh(event.target.checked)} />
                Auto refresh
              </label>
              <label className="flex items-center gap-2">
                <span>Every</span>
                <input
                  type="number"
                  min={1}
                  className="input w-16"
                  value={refreshMinutes}
                  onChange={(event) => setRefreshMinutes(Number(event.target.value))}
                />
                <span>min</span>
              </label>
            </div>
          ) : null}
        </header>

        <div className="fade-up">
          <KpiStrip
          total={rows.length}
          dateMin={dateRange.min}
          dateMax={dateRange.max}
          missingMeeting={missingMeeting}
          missingStatus={missingStatus}
          missingSource={missingSource}
          missingAe={missingAe}
          />
        </div>

        <div className="fade-up-delay relative z-[60] overflow-visible">
          <FilterBar
            filters={filters}
            sources={sources}
            statuses={statuses}
            aes={aes}
            onChange={setFilters}
          />
        </div>

        <section className="space-y-4 fade-up">
          <h2 className="text-xl font-semibold">Source Charts</h2>
          <SourceCharts data={sourceCounts} topN={topN} onTopNChange={setTopN} />
        </section>

        <section className="space-y-4 fade-up">
          <h2 className="text-xl font-semibold">Status Charts + Ratios</h2>
          <StatusCharts rows={ratioRows} ratioMode={ratioMode} onRatioModeChange={setRatioMode} />
        </section>

        <section className="space-y-4 fade-up">
          <h2 className="text-xl font-semibold">Date Set Charts</h2>
          <DateSetCharts rows={filtered} groupBy={dateSetGroupBy} onGroupByChange={setDateSetGroupBy} />
        </section>

        <section className="space-y-4 fade-up">
          <h2 className="text-xl font-semibold">Meeting Date Charts</h2>
          <MeetingDateCharts
            rows={filtered}
            groupBy={groupBy}
            onGroupByChange={setGroupBy}
            includeMissing={includeMissing}
            onIncludeMissingChange={setIncludeMissing}
          />
        </section>

        <section className="space-y-4 fade-up">
          <h2 className="text-xl font-semibold">A.E. Charts</h2>
          <AeCharts rows={filtered} />
        </section>

        <div className="fade-up">
          <DataPreviewTable rows={filtered} />
        </div>
      </div>
    </main>
  );
}
