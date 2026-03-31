'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import SalesforceReportUploader from '../../components/SalesforceReportUploader';
import SalesforceOverview from '../../components/SalesforceOverview';
import SalesforceCharts from '../../components/SalesforceCharts';
import { parseCsvToGrid, parseXlsxToGrid } from '../../lib/parseFile';
import {
  filterRowsByPeriod,
  groupCountBy,
  groupNumericBy,
  monthlyAmountSeries,
  parseClosedWonGrid,
  parseOpenOppsGrid,
  sumField,
} from '../../lib/salesforce';
import { CanonicalRow, SalesforceClosedWonRow, SalesforceOpenOppRow } from '../../types/sqo';
import { getEarnedQuotaPoints } from '../../lib/aggregations';

type Period = 'currentMonth' | 'rolling3Months' | 'allTime';

type StoredSalesforceData = {
  openOpps: (Omit<SalesforceOpenOppRow, 'closeDate'> & { closeDate: string | null })[];
  closedWon: SalesforceClosedWonRow[];
  openOppsFilename?: string | null;
  closedWonFilename?: string | null;
};

async function parseGridFromFile(file: File) {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'csv') return parseCsvToGrid(file);
  if (ext === 'xlsx') return (await parseXlsxToGrid(file)).grid;
  throw new Error('Unsupported file type. Upload a CSV or XLSX file.');
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function buildSqoMonthlyMeetings(rows: CanonicalRow[]) {
  const totals = new Map<string, number>();
  rows.forEach((row) => {
    if (!row.meetingDate) return;
    const key = monthKey(row.meetingDate);
    totals.set(key, (totals.get(key) ?? 0) + 1);
  });
  return Array.from(totals.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, value]) => ({ month, value }));
}

export default function SalesforcePage() {
  const router = useRouter();
  const [sqoRows, setSqoRows] = useState<CanonicalRow[]>([]);
  const [openOpps, setOpenOpps] = useState<SalesforceOpenOppRow[]>([]);
  const [closedWon, setClosedWon] = useState<SalesforceClosedWonRow[]>([]);
  const [openOppsFilename, setOpenOppsFilename] = useState<string | null>(null);
  const [closedWonFilename, setClosedWonFilename] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('currentMonth');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('sqo-dataset');
    if (!raw) {
      router.push('/');
      return;
    }

    const payload = JSON.parse(raw) as {
      rows: {
        dateSet: string | null;
        meetingDate: string | null;
        source: string | null;
        status: string | null;
        ae: string | null;
        raw: Record<string, string | null>;
      }[];
    };

    setSqoRows(
      payload.rows.map((row) => ({
        dateSet: row.dateSet ? new Date(row.dateSet) : null,
        meetingDate: row.meetingDate ? new Date(row.meetingDate) : null,
        source: row.source,
        status: row.status,
        ae: row.ae,
        raw: row.raw,
      }))
    );

    const rawSalesforce = sessionStorage.getItem('sqo-salesforce-data');
    if (!rawSalesforce) return;
    const salesforcePayload = JSON.parse(rawSalesforce) as StoredSalesforceData;
    setOpenOpps(
      (salesforcePayload.openOpps ?? []).map((row) => ({
        ...row,
        closeDate: row.closeDate ? new Date(row.closeDate) : null,
      }))
    );
    setClosedWon(salesforcePayload.closedWon ?? []);
    setOpenOppsFilename(salesforcePayload.openOppsFilename ?? null);
    setClosedWonFilename(salesforcePayload.closedWonFilename ?? null);
  }, [router]);

  const persistSalesforceData = (
    nextOpenOpps: SalesforceOpenOppRow[],
    nextClosedWon: SalesforceClosedWonRow[],
    nextOpenOppsFilename: string | null,
    nextClosedWonFilename: string | null
  ) => {
    sessionStorage.setItem(
      'sqo-salesforce-data',
      JSON.stringify({
        openOpps: nextOpenOpps.map((row) => ({
          ...row,
          closeDate: row.closeDate ? row.closeDate.toISOString() : null,
        })),
        closedWon: nextClosedWon,
        openOppsFilename: nextOpenOppsFilename,
        closedWonFilename: nextClosedWonFilename,
      })
    );
  };

  const handleOpenOppsUpload = async (file: File) => {
    setError(null);
    try {
      const grid = await parseGridFromFile(file);
      const parsed = parseOpenOppsGrid(grid);
      setOpenOpps(parsed);
      setOpenOppsFilename(file.name);
      persistSalesforceData(parsed, closedWon, file.name, closedWonFilename);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Failed to parse open opportunities report.');
    }
  };

  const handleClosedWonUpload = async (file: File) => {
    setError(null);
    try {
      const grid = await parseGridFromFile(file);
      const parsed = parseClosedWonGrid(grid);
      setClosedWon(parsed);
      setClosedWonFilename(file.name);
      persistSalesforceData(openOpps, parsed, openOppsFilename, file.name);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Failed to parse closed won report.');
    }
  };

  const filteredSqoRows = useMemo(
    () => filterRowsByPeriod(sqoRows, 'meetingDate', period),
    [sqoRows, period]
  );
  const filteredOpenOpps = useMemo(
    () => filterRowsByPeriod(openOpps, 'closeDate', period),
    [openOpps, period]
  );

  const sqoEarnedPoints = useMemo(() => getEarnedQuotaPoints(filteredSqoRows), [filteredSqoRows]);
  const sqoMeetings = filteredSqoRows.length;
  const openOppCommissionable = useMemo(
    () => sumField(filteredOpenOpps, (row) => row.commissionableAmount),
    [filteredOpenOpps]
  );
  const openOppTcv = useMemo(
    () => sumField(filteredOpenOpps, (row) => row.tcv),
    [filteredOpenOpps]
  );
  const closedWonCommissionable = useMemo(
    () => sumField(closedWon, (row) => row.commissionableAmount),
    [closedWon]
  );
  const closedWonTcv = useMemo(() => sumField(closedWon, (row) => row.tcv), [closedWon]);

  const ownerCommissionable = useMemo(
    () => groupNumericBy(filteredOpenOpps, (row) => row.opportunityOwner, (row) => row.commissionableAmount),
    [filteredOpenOpps]
  );
  const ownerTcv = useMemo(
    () => groupNumericBy(filteredOpenOpps, (row) => row.opportunityOwner, (row) => row.tcv),
    [filteredOpenOpps]
  );
  const typeCounts = useMemo(
    () => groupCountBy(filteredOpenOpps, (row) => row.type),
    [filteredOpenOpps]
  );
  const closedWonRoleTotals = useMemo(
    () => groupNumericBy(closedWon, (row) => row.gtmRole, (row) => row.commissionableAmount),
    [closedWon]
  );
  const monthlyOpenCommissionable = useMemo(
    () => monthlyAmountSeries(filteredOpenOpps, (row) => row.commissionableAmount),
    [filteredOpenOpps]
  );
  const monthlySqoMeetings = useMemo(
    () => buildSqoMonthlyMeetings(filteredSqoRows),
    [filteredSqoRows]
  );

  const hasSalesforceData = openOpps.length > 0 || closedWon.length > 0;

  return (
    <main className="min-h-screen bg-grid px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-2">
          <p className="section-title">SQO + Salesforce</p>
          <h1 className="text-3xl font-semibold text-white">Combined Revenue View</h1>
          <p className="text-sm text-white/80">
            Upload Salesforce exports and compare pipeline and closed won metrics next to your SQO dashboard metrics.
          </p>
          <div className="flex flex-wrap gap-3">
            <button className="button-outline" onClick={() => router.push('/dashboard')}>Back to dashboard</button>
            <button
              className="button-outline"
              onClick={() => {
                sessionStorage.removeItem('sqo-salesforce-data');
                setOpenOpps([]);
                setClosedWon([]);
                setOpenOppsFilename(null);
                setClosedWonFilename(null);
              }}
            >
              Clear Salesforce reports
            </button>
          </div>
        </header>

        <div className="card p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="section-title">Period</span>
            <select
              className="input"
              value={period}
              onChange={(event) => setPeriod(event.target.value as Period)}
            >
              <option value="currentMonth">Current Month</option>
              <option value="rolling3Months">Rolling 3 Months</option>
              <option value="allTime">All Time</option>
            </select>
            <span className="text-sm text-slate/70">
              Open opps use `Close Date`. Closed won totals use the uploaded file as-is because that export does not include a close date column.
            </span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <SalesforceReportUploader
            title="Open Opportunities"
            description="Upload the Salesforce open opps export. We use Opportunity Owner, Commissionable Amount, TCV, Close Date, and Type."
            onFileSelected={handleOpenOppsUpload}
            filename={openOppsFilename}
          />
          <SalesforceReportUploader
            title="Closed Won"
            description="Upload the Salesforce closed won export. We use Commissionable Amount, TCV, and GTM role."
            onFileSelected={handleClosedWonUpload}
            filename={closedWonFilename}
          />
        </div>

        {error ? <div className="card p-4 text-sm text-red-600">{error}</div> : null}

        {hasSalesforceData ? (
          <>
            <SalesforceOverview
              sqoEarnedPoints={sqoEarnedPoints}
              sqoMeetings={sqoMeetings}
              openOppCommissionable={openOppCommissionable}
              openOppTcv={openOppTcv}
              closedWonCommissionable={closedWonCommissionable}
              closedWonTcv={closedWonTcv}
            />
            <SalesforceCharts
              ownerCommissionable={ownerCommissionable}
              ownerTcv={ownerTcv}
              typeCounts={typeCounts}
              monthlyOpenCommissionable={monthlyOpenCommissionable}
              monthlySqoMeetings={monthlySqoMeetings}
              closedWonRoleTotals={closedWonRoleTotals}
            />
          </>
        ) : (
          <div className="card p-6">
            <h2 className="text-xl font-semibold">No Salesforce reports loaded</h2>
            <p className="mt-2 text-sm text-slate/70">
              Upload one or both Salesforce reports above to create the combined view.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
