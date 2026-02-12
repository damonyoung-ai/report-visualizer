# Report Visualizer

A production-ready Next.js 14 web app that lets users upload a CSV or XLSX file and automatically generates visual reports (charts/graphs) directly in the browser.

## Features
- Drag & drop uploader for `.csv` and `.xlsx`
- Client-side parsing with PapaParse and SheetJS
- Type inference (number, date, boolean, category/string)
- Schema summary + KPIs
- Suggested charts + custom chart builder
- Data preview table (first 50 rows, sortable)
- Chart export to PNG
- XLSX sheet selector

## Tech Stack
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Recharts
- PapaParse + SheetJS

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

## Example Data
Sample files are located in `public/examples`:
- `public/examples/sample.csv`
- `public/examples/sample.xlsx`

## Deployment (Vercel)
### CLI
```bash
npm i -g vercel
vercel
vercel --prod
```

### Dashboard
1. Create a new project at Vercel.
2. Import your GitHub repo.
3. Keep defaults (Next.js framework detected).
4. Deploy.

## GitHub Setup
```bash
git init
git add .
git commit -m "Initial report visualizer"
```
Then create a repo on GitHub and push.

## Limitations & Performance Notes
- Parsing and charts run entirely in browser memory.
- For datasets larger than ~200k rows, charts are sampled to maintain performance.
- Preview table is limited to the first 50 rows.

## Environment
- No API keys are required. Do not store secrets in source control.
- If you add secrets later, use `.env`.
