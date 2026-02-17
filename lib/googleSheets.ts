import { parseCsvTextToGrid } from './parseFile';

const SHEET_ID_RE = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;

export function buildCsvExportUrl(sheetUrl: string): string | null {
  const match = sheetUrl.match(SHEET_ID_RE);
  if (!match) return null;
  const sheetId = match[1];
  const url = new URL(`https://docs.google.com/spreadsheets/d/${sheetId}/export`);
  url.searchParams.set('format', 'csv');
  return url.toString();
}

export async function fetchSheetGrid(sheetUrl: string): Promise<string[][]> {
  const exportUrl = buildCsvExportUrl(sheetUrl);
  if (!exportUrl) {
    throw new Error('Invalid Google Sheets URL.');
  }
  const cacheKey = `sqo-sheet-cache:${exportUrl}`;
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached) as { ts: number; text: string };
      if (Date.now() - parsed.ts < 60_000) {
        return parseCsvTextToGrid(parsed.text);
      }
    }
  } catch {
    // ignore cache errors
  }
  const response = await fetch(exportUrl);
  if (!response.ok) {
    throw new Error('Unable to fetch Google Sheet. Make sure it is shared as public.');
  }
  const text = await response.text();
  try {
    sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), text }));
  } catch {
    // ignore cache errors
  }
  return parseCsvTextToGrid(text);
}
