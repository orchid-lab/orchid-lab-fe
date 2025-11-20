interface ReportAttributes {
  name: string;
  value: number;
  status: number;
  valueFrom: number;
  valueTo: number;
  measurementUnit: string;
}
export interface Sample {
  id: string;
  name: string;
  description: string;
  dob: string;
  statusEnum: string;
  ReportAttributes: ReportAttributes[];
}

export interface SampleApiResponse {
  value: {
    totalCount: number;
    pageCount: number;
    pageSize: number;
    pageNumber: number;
    data: Sample[];
  };
}
