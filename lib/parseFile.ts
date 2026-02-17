import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export async function parseCsvToGrid(file: File): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    Papa.parse<string[]>(file, {
      skipEmptyLines: false,
      complete: (result) => {
        if (result.errors?.length) {
          reject(new Error(result.errors[0]?.message || 'Failed to parse CSV.'));
          return;
        }
        const data = result.data as string[][];
        resolve(data);
      },
      error: (error: Error) => reject(error),
    });
  });
}

export async function parseCsvTextToGrid(text: string): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    Papa.parse<string[]>(text, {
      skipEmptyLines: false,
      complete: (result) => {
        if (result.errors?.length) {
          reject(new Error(result.errors[0]?.message || 'Failed to parse CSV.'));
          return;
        }
        const data = result.data as string[][];
        resolve(data);
      },
      error: (error: Error) => reject(error),
    });
  });
}

export async function parseXlsxToGrid(file: File, sheetName?: string): Promise<{ grid: string[][]; sheetNames: string[] }>{
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetNames = workbook.SheetNames;
  const activeSheet = sheetName ?? sheetNames[0];
  const sheet = workbook.Sheets[activeSheet];
  if (!sheet) throw new Error('Selected sheet not found.');
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' }) as unknown[][];
  const grid = rows.map((row) => row.map((cell) => String(cell ?? '')));
  return { grid, sheetNames };
}
