export type SampleResult<T> = {
  rows: T[];
  warning?: string;
};

export function downsample<T>(rows: T[], maxRows: number, label: string): SampleResult<T> {
  if (rows.length <= maxRows) return { rows };
  const stride = Math.ceil(rows.length / maxRows);
  const sampled = rows.filter((_, idx) => idx % stride === 0);
  return {
    rows: sampled,
    warning: `${label} showing ${sampled.length.toLocaleString()} of ${rows.length.toLocaleString()} rows for performance.`
  };
}
