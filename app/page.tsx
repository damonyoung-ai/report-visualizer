'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Uploader from '../components/Uploader';
import { parseCsvToGrid, parseXlsxToGrid } from '../lib/parseFile';
import { cleanDataset } from '../lib/cleanDataset';
import { fetchSheetGrid } from '../lib/googleSheets';
import { DEFAULT_SHEET_URL } from '../lib/config';

export default function Home() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const autoConnectStartedRef = useRef(false);

  const handleFile = async (file: File, sheet?: string) => {
    setError(null);
    setLoading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      let grid: string[][] = [];
      let sheetNames: string[] | undefined;

      if (ext === 'csv') {
        grid = await parseCsvToGrid(file);
      } else if (ext === 'xlsx') {
        const result = await parseXlsxToGrid(file, sheet);
        grid = result.grid;
        sheetNames = result.sheetNames;
      } else {
        throw new Error('Unsupported file type. Upload a CSV or XLSX file.');
      }

      if (!grid.length) throw new Error('File is empty.');

      const cleaned = cleanDataset(grid);
      if (!cleaned.rows.length) throw new Error('No data rows found.');

      const payload = {
        rows: cleaned.rows.map((row) => ({
          dateSet: row.dateSet ? row.dateSet.toISOString() : null,
          meetingDate: row.meetingDate ? row.meetingDate.toISOString() : null,
          source: row.source,
          status: row.status,
          ae: row.ae,
          raw: row.raw,
        })),
        rawHeaders: cleaned.rawHeaders,
        canonicalHeaders: cleaned.canonicalHeaders,
        sheetNames,
      };

      sessionStorage.setItem('sqo-dataset', JSON.stringify(payload));
      localStorage.removeItem('sqo-sheet-url');
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file.');
    } finally {
      setLoading(false);
    }
  };

  const handleSheetUrl = useCallback(async (sheetUrl: string) => {
    if (!sheetUrl.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const grid = await fetchSheetGrid(sheetUrl.trim());
      const cleaned = cleanDataset(grid);
      if (!cleaned.rows.length) throw new Error('No data rows found.');

      const payload = {
        rows: cleaned.rows.map((row) => ({
          dateSet: row.dateSet ? row.dateSet.toISOString() : null,
          meetingDate: row.meetingDate ? row.meetingDate.toISOString() : null,
          source: row.source,
          status: row.status,
          ae: row.ae,
          raw: row.raw,
        })),
        rawHeaders: cleaned.rawHeaders,
        canonicalHeaders: cleaned.canonicalHeaders,
      };

      sessionStorage.setItem('sqo-dataset', JSON.stringify(payload));
      localStorage.setItem('sqo-sheet-url', sheetUrl.trim());
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sheet.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!DEFAULT_SHEET_URL || autoConnectStartedRef.current) return;
    autoConnectStartedRef.current = true;
    handleSheetUrl(DEFAULT_SHEET_URL);
  }, [handleSheetUrl]);

  const handleExample = async (path: string) => {
    const response = await fetch(path);
    const blob = await response.blob();
    const name = path.split('/').pop() || 'example.csv';
    const file = new File([blob], name, { type: blob.type });
    await handleFile(file);
  };

  return (
    <main className="min-h-screen bg-grid px-6 py-10">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <header className="space-y-2">
          <p className="section-title">SQO Report Visualizer</p>
          <h1 className="text-4xl font-semibold text-white">Instant SQO dashboard for Source, Status, Meeting Date, A.E.</h1>
          <p className="text-sm text-slate-300">
            Upload a Google Sheets export CSV/XLSX. We auto-detect the real header row and clean the data.
          </p>
        </header>

        <Uploader onFileSelected={(file) => handleFile(file)} error={error} onExample={handleExample} />

        <div className="card p-6">
          <p className="section-title">Auto-sync</p>
          <h2 className="text-xl font-semibold">Google Sheet Connected</h2>
          <p className="mt-2 text-sm text-slate/70">
            This dashboard auto-loads your configured Google Sheet. Use reload if you want to reconnect.
          </p>
          <div className="mt-4 flex gap-3">
            <button className="button" onClick={() => handleSheetUrl(DEFAULT_SHEET_URL)} disabled={loading}>
              {loading ? 'Loading...' : 'Reload sheet'}
            </button>
          </div>
          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        </div>
      </div>
    </main>
  );
}
