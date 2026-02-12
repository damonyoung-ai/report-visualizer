import Papa from 'papaparse';
import * as XLSX from 'xlsx';

type ParseResult = {
  rows: Record<string, string | number | boolean | null>[];
  columns: string[];
  sheetNames?: string[];
};

export async function parseCsv(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (result) => {
        if (result.errors?.length) {
          reject(new Error(result.errors[0]?.message || 'Failed to parse CSV.'));
          return;
        }

        const rows = (result.data || []).map((row) => {
          const cleaned: Record<string, string | number | boolean | null> = {};
          for (const key of Object.keys(row)) {
            const value = row[key];
            cleaned[key] = value === '' ? null : value;
          }
          return cleaned;
        });

        const columns = result.meta.fields || Object.keys(rows[0] || {});
        resolve({ rows, columns });
      },
      error: (error) => {
        reject(error);
      }
    });
  });
}

export async function parseXlsx(file: File, sheetName?: string): Promise<ParseResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetNames = workbook.SheetNames;
  const activeSheet = sheetName ?? sheetNames[0];
  const sheet = workbook.Sheets[activeSheet];
  if (!sheet) {
    throw new Error('Selected sheet not found.');
  }

  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: null,
    raw: false,
  });

  const rows = json.map((row) => {
    const cleaned: Record<string, string | number | boolean | null> = {};
    for (const [key, value] of Object.entries(row)) {
      if (value === '' || value === undefined) {
        cleaned[key] = null;
      } else if (value instanceof Date) {
        cleaned[key] = value.toISOString();
      } else {
        cleaned[key] = value as string | number | boolean;
      }
    }
    return cleaned;
  });

  const columns = Object.keys(rows[0] || {});
  return { rows, columns, sheetNames };
}
