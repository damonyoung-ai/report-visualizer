import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SQO Report Visualizer',
  description: 'Upload CSV/XLSX and get an instant SQO dashboard.'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
