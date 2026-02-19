'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Uploader from '../components/Uploader';
import { parseCsvToGrid, parseXlsxToGrid } from '../lib/parseFile';
import { cleanDataset } from '../lib/cleanDataset';
import { fetchSheetGrid } from '../lib/googleSheets';

export default function Home() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [sheetUrl, setSheetUrl] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleSheetUrl = async () => {
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
  };

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
          <h1 className="text-4xl font-semibold">Instant SQO dashboard for Source, Status, Meeting Date, A.E.</h1>
          <p className="text-sm text-slate/70">
            Upload a Google Sheets export CSV/XLSX. We auto-detect the real header row and clean the data.
          </p>
        </header>

        <Uploader onFileSelected={(file) => handleFile(file)} error={error} onExample={handleExample} />

        <div className="card p-6">
          <p className="section-title">Auto-sync</p>
          <h2 className="text-xl font-semibold">Connect a Google Sheet</h2>
          <p className="mt-2 text-sm text-slate/70">
            Paste a public Google Sheets URL to sync automatically without uploads.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              className="input w-full"
              placeholder="https://docs.google.com/spreadsheets/d/..."
              value={sheetUrl}
              onChange={(event) => setSheetUrl(event.target.value)}
            />
            <button className="button" onClick={handleSheetUrl} disabled={loading}>
              {loading ? 'Loading...' : 'Connect'}
            </button>
          </div>
          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        </div>
      </div>
    </main>
  );
}
