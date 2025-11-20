interface reportAttributes {
  name: string;
  value: number;
  status: number;
  valueFrom: number;
  valueTo: number;
  measurementUnit: string;
}
export interface Report {
  id: string;
  name: string;
  description: string;
  sample: string;
  technician: string;
  status: string;
  reportAttributes: reportAttributes[];
  reviewReport?: string;
}
export interface ReportApiResponse {
  value: {
    totalCount: number;
    pageCount: number;
    pageNumber: number;
    pageSize: number;
    data: Report[];
  };
}
