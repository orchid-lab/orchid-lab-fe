export const MonitoringLogStatus = {
  Created: "Created",
  WaitingForApproval: "WaitingForApproval",
  Approved: "Approved",
  Rejected: "Rejected",
  Revised: "Revised",
} as const;

export type MonitoringLogStatus = typeof MonitoringLogStatus[keyof typeof MonitoringLogStatus];

export interface MonitoringLog {
  id: string;
  name: string;
  createdBy: string;
  createdDate: string;
  sampleName: string;
  status: MonitoringLogStatus;
  isNewest: boolean;
}

export interface MonitoringLogApiResponse {
  totalCount?: number;
  pageCount?: number;
  pageSize?: number;
  pageNumber?: number;
  totalPages?: number;
  pageNo?: number;
  data?: MonitoringLog[];
  items?: MonitoringLog[];
}
