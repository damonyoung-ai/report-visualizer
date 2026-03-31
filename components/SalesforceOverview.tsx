'use client';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function SalesforceOverview({
  sqoEarnedPoints,
  sqoMeetings,
  openOppCommissionable,
  openOppTcv,
  closedWonCommissionable,
  closedWonTcv,
}: {
  sqoEarnedPoints: number;
  sqoMeetings: number;
  openOppCommissionable: number;
  openOppTcv: number;
  closedWonCommissionable: number;
  closedWonTcv: number;
}) {
  const items = [
    { label: 'SQO Earned Points', value: String(sqoEarnedPoints) },
    { label: 'SQO Meetings', value: String(sqoMeetings) },
    { label: 'Open Opp Commissionable', value: formatCurrency(openOppCommissionable) },
    { label: 'Open Opp TCV', value: formatCurrency(openOppTcv) },
    { label: 'Closed Won Commissionable', value: formatCurrency(closedWonCommissionable) },
    { label: 'Closed Won TCV', value: formatCurrency(closedWonTcv) },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="card p-4">
          <p className="section-title">{item.label}</p>
          <div className="mt-3 text-3xl font-semibold">{item.value}</div>
        </div>
      ))}
    </section>
  );
}
