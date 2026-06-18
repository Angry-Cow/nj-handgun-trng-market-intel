export type CompetitorDraft = {
  facilityName: string;
  address: string;
  county: string;
  latitude: number;
  longitude: number;
  facilityType: string;
  ownerOperator?: string;
  website: string;
  phone: string;
  servicesOffered: string;
  capacity?: string;
  lanes?: number;
  membershipOptions?: string;
  instructorCredentials?: string;
  basicHandgunPrice?: number;
  ccwPrepPrice?: number;
  laneFee?: number;
  privateLessonRate?: number;
  dataConfidence: number;
  needsVerification: boolean;
  sourceUrl: string;
  dateAccessed: Date;
  notes?: string;
};

export type MarketForecastDraft = {
  year: number;
  projectedEnrollments: number;
  estimatedRevenue: number;
  county?: string;
};

export type ResearchReportDraft = {
  title: string;
  reportDate: Date;
  contentMarkdown: string;
  executiveSummary: string;
  pdfDownloadUrl?: string;
};

export type SourceLogDraft = {
  sourceName: string;
  status: string;
  recordsFound: number;
  lastScrapeDate: Date;
};
