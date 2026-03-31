'use client';

import { useRef, useState } from 'react';

const ACCEPTED = ['.csv', '.xlsx'];

export default function SalesforceReportUploader({
  title,
  description,
  onFileSelected,
  filename,
}: {
  title: string;
  description: string;
  onFileSelected: (file: File) => void;
  filename?: string | null;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || !files[0]) return;
    onFileSelected(files[0]);
  };

  return (
    <div className="card p-6">
      <div
        className={`rounded-2xl border-2 border-dashed p-6 text-center transition ${
          dragging ? 'border-accent bg-accent/5' : 'border-slate/20'
        }`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          handleFiles(event.dataTransfer.files);
        }}
      >
        <p className="section-title">Salesforce Report</p>
        <h2 className="mt-2 text-2xl font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-slate/70">{description}</p>
        <button
          type="button"
          className="mt-6 rounded-full bg-ink px-6 py-2 text-sm font-semibold text-white"
          onClick={() => inputRef.current?.click()}
        >
          {filename ? 'Replace file' : 'Choose file'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(',')}
          className="hidden"
          onChange={(event) => handleFiles(event.target.files)}
        />
        <p className="mt-4 text-xs text-slate/60">
          {filename ? `Loaded: ${filename}` : `Supported extensions: ${ACCEPTED.join(', ')}`}
        </p>
      </div>
    </div>
  );
}
