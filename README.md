# SQO Report Visualizer

A production-ready Next.js 14 app that lets you upload a CSV/XLSX report and instantly generates a dashboard focused on **Source**, **Status**, **Meeting Date**, and **A.E.**. Everything runs client-side.

## Features
- Auto-detects the correct header row (handles title rows + Google Sheets exports)
- Cleans empty/unnamed columns
- Normalizes column names to canonical keys
- Dashboard with KPIs, charts, and ratios
- Global filters for Meeting Date, Source, Status, A.E.
- Auto-sync from a public Google Sheet URL
- Download cleaned CSV
- Export dashboard as PNG

## Default Google Sheet
- The app auto-loads a default Google Sheet URL on the landing page.
- You can override it with:
```bash
NEXT_PUBLIC_DEFAULT_SHEET_URL=\"https://docs.google.com/spreadsheets/d/<sheet-id>/edit\"
```

## Tech Stack
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Recharts
- PapaParse + SheetJS (xlsx)

## Local Development
```bash
npm install
npm run dev
```
Open `http://localhost:3000`.

## Build & Start
```bash
npm run build
npm start
```

## Git Setup + Commit
```bash
git init
git add .
git commit -m "Initial SQO report visualizer"
```

## Push to GitHub
HTTPS:
```bash
git remote add origin https://github.com/<YOUR_USER>/<YOUR_REPO>.git
git push -u origin main
```

SSH:
```bash
git remote add origin git@github.com:<YOUR_USER>/<YOUR_REPO>.git
git push -u origin main
```

## Deploy to Vercel
CLI:
```bash
npm i -g vercel
vercel
vercel --prod
```

Dashboard:
1. Create a new project on Vercel
2. Import your GitHub repo
3. Keep defaults (Next.js detected)
4. Deploy

## Notes
- For large datasets (~200k rows), charts are computed with memoized aggregations and only the line chart may be downsampled if needed.
- Preview table is limited to the first 50 rows.
