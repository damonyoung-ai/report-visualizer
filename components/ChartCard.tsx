'use client';

import { ReactNode, useRef } from 'react';
import html2canvas from 'html2canvas';

export default function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);

  const exportPng = async () => {
    if (!ref.current) return;
    const canvas = await html2canvas(ref.current, { backgroundColor: '#ffffff', scale: 2 });
    const link = document.createElement('a');
    link.download = `${title.replace(/\s+/g, '-')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="section-title">{subtitle ?? 'Chart'}</p>
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <button className="button-outline" onClick={exportPng}>
          Export PNG
        </button>
      </div>
      <div ref={ref} className="mt-4 rounded-xl bg-white p-3">
        <div className="overflow-x-auto rounded-xl border border-slate/10">
          <div className="min-w-full">{children}</div>
        </div>
      </div>
    </div>
  );
}
