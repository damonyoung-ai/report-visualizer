'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Uploader from '../components/Uploader';
import { parseCsvToGrid, parseXlsxToGrid } from '../lib/parseFile';
import { cleanDataset } from '../lib/cleanDataset';

export default function Home() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File, sheet?: string) => {
    setError(null);
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
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file.');
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
      </div>
    </main>
  );
}
