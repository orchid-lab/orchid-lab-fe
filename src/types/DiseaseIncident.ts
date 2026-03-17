export const DiseaseIncidentStatus = {
  AIDetected: 0,
  UnderReview: 1,
  Confirmed: 2,
  Dismissed: 3,
} as const;

export type DiseaseIncidentStatus =
  (typeof DiseaseIncidentStatus)[keyof typeof DiseaseIncidentStatus];

export interface DiseaseIncident {
  id: string;
  sampleStageId: string;
  sampleName: string;
  diseaseName: string;
  status: DiseaseIncidentStatus;
  aiConfidence: number;
  reviewNote: string | null;
}

export interface DiseaseIncidentListResponse {
  items: DiseaseIncident[];
  totalCount: number;
  pageNo: number;
  pageSize: number;
}

export interface ReviewIncidentRequest {
  isConfirmed: boolean;
  note?: string;
}
