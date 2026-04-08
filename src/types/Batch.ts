export interface TissueCultureBatch {
  id: string;
  name?: string;
  labName?: string;
  labRoomId?: number;
  labRoomName?: string;
  batchName?: string;
  batchSizeWidth?: number;
  batchSizeHeight?: number;
  widthUnit?: string;
  heightUnit?: string;
  description?: string;
  inUse?: string;
  status?: string | boolean;
  isBatching?: boolean;
}

export interface ApiListResponse {
  value?: {
    data?: TissueCultureBatch[];
    totalCount?: number;
  };
  data?: TissueCultureBatch[];
  totalCount?: number;
}
