'use client';

export default function DashboardSummary({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div className="card p-5">
      <p className="section-title">Summary</p>
      <h2 className="mt-1 text-xl font-semibold">{title}</h2>
      <div className="mt-4 space-y-2 text-sm text-slate/80">
        {items.map((item, index) => (
          <p key={`${title}-${index}`}>{item}</p>
        ))}
      </div>
    </div>
  );
}
