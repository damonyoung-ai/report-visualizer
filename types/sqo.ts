export type CanonicalRow = {
  dateSet: Date | null;
  meetingDate: Date | null;
  source: string | null;
  status: string | null;
  ae: string | null;
  raw: Record<string, string | null>;
};

export type CleanDataset = {
  rows: CanonicalRow[];
  rawHeaders: string[];
  canonicalHeaders: string[];
};

export type Filters = {
  dateFrom?: string;
  dateTo?: string;
  allTime: boolean;
  sources: string[];
  statuses: string[];
  aes: string[];
  excludeMissing: boolean;
};

export type HeaderDetection = {
  headerRowIndex: number;
  headers: string[];
};

export type MonthlyMetricSummary = {
  monthKey: string;
  monthLabel: string;
  earnedPoints: number;
  potentialPoints: number;
  meetings: number;
  dateSets: number;
  sourceTotal: number;
  statusTotal: number;
  aeTotal: number;
};

export type MonthlyBreakdownRow = {
  monthKey: string;
  monthLabel: string;
  [key: string]: string | number;
};

export type SalesforceOpenOppRow = {
  opportunityOwner: string | null;
  accountName: string | null;
  commissionableAmount: number;
  tcv: number;
  closeDate: Date | null;
  nextStep: string | null;
  type: string | null;
  gtmRole: string | null;
};

export type SalesforceClosedWonRow = {
  accountName: string | null;
  commissionableAmount: number;
  tcv: number;
  gtmRole: string | null;
};
