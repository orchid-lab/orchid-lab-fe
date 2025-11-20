export interface Element {
  id: string;
  name: string;
  description?: string;
  status?: boolean;
  currentInStage: number;
}

export interface ElementApiResponse {
  value: {
    totalCount: number;
    pageCount: number;
    pageSize: number;
    pageNumber: number;
    data: Element[];
  };
}
