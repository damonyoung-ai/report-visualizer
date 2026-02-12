'use client';

import { ChartSuggestion } from '../types/data';

export default function SuggestedCharts({
  suggestions,
  onApply,
}: {
  suggestions: ChartSuggestion[];
  onApply: (suggestion: ChartSuggestion) => void;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="section-title">Suggested charts</p>
          <h3 className="text-lg font-semibold">Auto insights</h3>
        </div>
        <span className="text-xs text-slate/70">{suggestions.length} suggestions</span>
      </div>
      <div className="mt-4 space-y-3">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.id}
            className="w-full rounded-xl border border-slate/10 bg-white p-3 text-left transition hover:border-accent"
            onClick={() => onApply(suggestion)}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">{suggestion.title}</div>
                <div className="text-xs text-slate/60">{suggestion.reason}</div>
              </div>
              <span className="text-xs text-accent">Apply</span>
            </div>
          </button>
        ))}
        {!suggestions.length ? <div className="text-sm text-slate/60">No suggestions yet.</div> : null}
      </div>
    </div>
  );
}
