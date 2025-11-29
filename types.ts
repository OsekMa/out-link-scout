export interface LinkData {
  href: string;
  text: string;
  hostname: string;
  isExternal: boolean;
  category?: string; // Populated by AI
}

export interface CrawlResult {
  url: string;
  totalFound: number;
  externalCount: number;
  internalCount: number;
  links: LinkData[];
  timestamp: number;
}

export enum CrawlStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export enum AnalysisStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  DONE = 'DONE',
  ERROR = 'ERROR',
}
