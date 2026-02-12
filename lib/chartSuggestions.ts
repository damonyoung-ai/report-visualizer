import { ChartSuggestion, ColumnInfo } from '../types/data';
import { detectMostVariantNumeric } from './inference';

export function buildSuggestions(columns: ColumnInfo[]): ChartSuggestion[] {
  const suggestions: ChartSuggestion[] = [];
  const numeric = columns.filter((c) => c.detectedType === 'number');
  const categorical = columns.filter((c) => c.detectedType === 'category' || c.detectedType === 'string');
  const dates = columns.filter((c) => c.detectedType === 'date');

  if (dates.length && numeric.length) {
    suggestions.push({
      id: 'line-date',
      title: `Trend over time`,
      reason: 'Date + numeric detected',
      config: {
        type: 'line',
        xKey: dates[0].name,
        yKey: numeric[0].name,
        aggregation: 'sum',
        excludeMissing: true,
      },
    });
  }

  if (categorical.length && numeric.length) {
    suggestions.push({
      id: 'bar-category',
      title: `Top categories`,
      reason: 'Category + numeric detected',
      config: {
        type: 'bar',
        xKey: categorical[0].name,
        yKey: numeric[0].name,
        aggregation: 'sum',
        topN: 10,
        excludeMissing: true,
      },
    });
  }

  if (categorical.length && !numeric.length) {
    suggestions.push({
      id: 'bar-count',
      title: `Category counts`,
      reason: 'Only categorical columns detected',
      config: {
        type: 'bar',
        xKey: categorical[0].name,
        aggregation: 'count',
        topN: 10,
        excludeMissing: true,
      },
    });
  }

  if (numeric.length >= 2) {
    suggestions.push({
      id: 'scatter',
      title: `Correlation check`,
      reason: 'Multiple numeric columns detected',
      config: {
        type: 'scatter',
        xKey: numeric[0].name,
        yKey: numeric[1].name,
        excludeMissing: true,
      },
    });
  }

  const mostVariant = detectMostVariantNumeric(columns);
  if (mostVariant) {
    suggestions.push({
      id: 'histogram',
      title: `Distribution`,
      reason: 'Most variant numeric column',
      config: {
        type: 'histogram',
        xKey: mostVariant.name,
        excludeMissing: true,
      },
    });
  }

  return suggestions;
}
