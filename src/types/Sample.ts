// Sample status constants
export const SampleStatus = {
  Created: 'Created',
  InProgressed: 'InProgressed',
  Completed: 'Completed',
  ExecutedBecauseOfDisease: 'ExecutedBecauseOfDisease',
  ConvertedToSeedling: 'ConvertedToSeedling'
} as const;

export type SampleStatus = typeof SampleStatus[keyof typeof SampleStatus];

// Sample interface matching API response
export interface Sample {
  id: string;
  name: string;
  experimentLogId: string;
  currentSampleStage: string | null;
  notes: string | null;
  reason: string | null;
  executionDate: string | null;
  createdDate: string;
  createdBy: string;
  updatedDate: string | null;
  updatedBy: string | null;
  status: SampleStatus;
}

// API Response wrapper
export interface SampleApiResponse {
  totalCount: number;
  pageCount: number;
  pageSize: number;
  pageNumber: number;
  data: Sample[];
}

// Experiment Log interface
export interface ExperimentLog {
  id: string;
  name: string;
  currentStageOrder: number;
  methodName: string;
  batcheName: string;
  expectedSampleCount: number;
  createdBy: string;
  createdDate: string;
  status: string;
}

// Experiment Log API Response
export interface ExperimentLogApiResponse {
  totalCount: number;
  pageCount: number;
  pageSize: number;
  pageNumber: number;
  data: ExperimentLog[];
}
