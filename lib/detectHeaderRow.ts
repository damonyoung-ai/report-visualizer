const EXPECTED = ['meeting date', 'source', 'status', 'a e', 'ae'];

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export function detectHeaderRow(grid: string[][]): { headerRowIndex: number; headers: string[] } {
  const maxRows = Math.min(grid.length, 10);
  let bestIndex = 0;
  let bestScore = -1;

  for (let i = 0; i < maxRows; i += 1) {
    const row = grid[i] || [];
    const normalizedRow = row.map((cell) => normalize(cell));
    let score = 0;
    for (const expected of EXPECTED) {
      if (normalizedRow.some((cell) => cell.includes(expected))) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  return { headerRowIndex: bestIndex, headers: grid[bestIndex] || [] };
}

export const normalizeHeader = (value: string) =>
  value
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\u00a0/g, '');

export const isEmptyHeader = (value: string) => {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return true;
  if (trimmed.startsWith('unnamed')) return true;
  return false;
};
