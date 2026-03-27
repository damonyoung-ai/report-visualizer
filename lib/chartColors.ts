const START = '#BDD2FF';
const END = '#091F63';

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '');
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b]
    .map((value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0'))
    .join('')}`;
}

function interpolateColor(start: string, end: string, factor: number) {
  const from = hexToRgb(start);
  const to = hexToRgb(end);
  return rgbToHex(
    from.r + (to.r - from.r) * factor,
    from.g + (to.g - from.g) * factor,
    from.b + (to.b - from.b) * factor
  );
}

export function getBlueScale(steps: number) {
  if (steps <= 1) return [END];
  return Array.from({ length: steps }, (_, index) =>
    interpolateColor(START, END, index / (steps - 1))
  );
}

export const BLUE_SCALE = getBlueScale(7);
