import { isEmptyHeader, normalizeHeader } from './detectHeaderRow';

export const canonicalMap = (header: string) => {
  const normalized = header
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();

  if (normalized === 'meetingdate' || normalized === 'meeting' || normalized === 'meetingdt') return 'meetingDate';
  if (normalized === 'dateset' || normalized === 'setdate') return 'dateSet';
  if (normalized === 'source') return 'source';
  if (normalized === 'status') return 'status';
  if (normalized === 'ae' || normalized === 'a.e' || normalized === 'a.e.' || normalized === 'a_e' || normalized === 'a e') return 'ae';
  return null;
};

export function buildHeaders(headers: string[]) {
  const columns: { header: string; canonical: string; index: number }[] = [];

  headers.forEach((header, index) => {
    const normalized = normalizeHeader(header);
    if (index === 0 && isEmptyHeader(normalized)) return;
    if (isEmptyHeader(normalized)) return;
    columns.push({ header: normalized, canonical: canonicalMap(normalized) ?? normalized, index });
  });

  return columns;
}
