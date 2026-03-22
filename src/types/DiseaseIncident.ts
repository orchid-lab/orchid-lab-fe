export const DiseaseIncidentStatus = {
  AIDetected: "AIDetected",
  UnderReview: "UnderReview",
  Confirmed: "Confirmed",
  Dismissed: "Dismissed",
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
  data: DiseaseIncident[];
  totalCount: number;
  pageNo: number;
  pageSize: number;
}

export interface ReviewIncidentRequest {
  isConfirmed: boolean;
  note?: string;
}
