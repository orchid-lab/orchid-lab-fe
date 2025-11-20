export interface Referent {
  id: string;
  name: string;
  valueFrom: number;
  valueTo: number;
  measurementUnit: string;
  status: boolean;
}

export interface ReferentApiResponse {
  value: {
    totalCount: number;
    pageCount: number;
    pageSize: number;
    pageNumber: number;
    data: Referent[];
  };
}
