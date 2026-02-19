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
  sources: string[];
  statuses: string[];
  aes: string[];
  excludeMissing: boolean;
};

export type HeaderDetection = {
  headerRowIndex: number;
  headers: string[];
};
