'use client';

export type ComparisonView = 'rolling3' | 'monthVsLast';

export default function ComparisonModeCard({
  view,
  onChange,
}: {
  view: ComparisonView;
  onChange: (view: ComparisonView) => void;
}) {
  return (
    <div className="card p-4">
      <p className="section-title">Comparison Window</p>
      <div className="mt-3 flex flex-wrap gap-3">
        <button
          className={view === 'rolling3' ? 'button' : 'button-outline'}
          onClick={() => onChange('rolling3')}
        >
          Rolling 3 Months
        </button>
        <button
          className={view === 'monthVsLast' ? 'button' : 'button-outline'}
          onClick={() => onChange('monthVsLast')}
        >
          This Month vs Last
        </button>
      </div>
    </div>
  );
}
