'use client';

import { useCallback, useRef, useState } from 'react';

const ACCEPTED = ['.csv', '.xlsx'];

type Props = {
  onFileSelected: (file: File) => void;
  onExample?: (path: string) => void;
  error?: string | null;
};

export default function Uploader({ onFileSelected, onExample, error }: Props) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || !files[0]) return;
      onFileSelected(files[0]);
    },
    [onFileSelected]
  );

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    handleFiles(event.dataTransfer.files);
  };

  return (
    <div className="card p-6 bg-white">
      <div
        className={`rounded-2xl border-2 border-dashed p-8 text-center transition ${
          dragging ? 'border-accent bg-accent/5' : 'border-slate/20'
        }`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <h2 className="text-2xl font-semibold">Upload your data file</h2>
        <p className="mt-2 text-sm text-slate/70">
          Drag and drop a CSV or XLSX file, or click to browse. Files are parsed locally in your browser.
        </p>
        <button
          type="button"
          className="mt-6 rounded-full bg-ink px-6 py-2 text-sm font-semibold text-white"
          onClick={() => inputRef.current?.click()}
        >
          Choose file
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(',')}
          className="hidden"
          onChange={(event) => handleFiles(event.target.files)}
        />
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        {onExample ? (
          <div className="mt-5 text-xs text-slate/70">
            Try examples:{' '}
            <button className="underline" onClick={() => onExample('/examples/sample.csv')}>
              sample.csv
            </button>{' '}
            ·{' '}
            <button className="underline" onClick={() => onExample('/examples/sample.xlsx')}>
              sample.xlsx
            </button>
          </div>
        ) : null}
      </div>
      <p className="mt-4 text-xs text-slate/60">Supported extensions: {ACCEPTED.join(', ')}</p>
    </div>
  );
}
