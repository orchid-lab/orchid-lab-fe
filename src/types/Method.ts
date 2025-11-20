interface MethodStage {
  name: string;
  description: string;
  dateOfProcessing: number;
  step: number;
  status: boolean;
  elementDTO: ElementDTO[];
}
interface ElementDTO {
  id: string;
  name: string;
  description: string;
  status: boolean;
}
export interface Method {
  id: string;
  name: string;
  description: string;
  type: string;
  status: boolean;
  stages: MethodStage[];
}

export interface MethodApiResponse {
  value: {
    totalCount: number;
    pageCount: number;
    pageSize: number;
    pageNumber: number;
    data: Method[];
  };
}
