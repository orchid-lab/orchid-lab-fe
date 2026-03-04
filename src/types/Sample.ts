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

export interface SampleRequirementDefinition {
  id: string;
  characteristicCode: string;
  name: string;
  description: string;
  unit: string;
}

export interface StageRequirementDefinition {
  id: string;
  sampleRequirementDefinitionDto: SampleRequirementDefinition;
  minValue: number;
  maxValue: number;
  expectedValue: number;
}

export interface SampleLogDetail {
  id: string;
  measuredValue: number;
  isMatch: boolean;
  stageRequirementDefinitionDto: StageRequirementDefinition;
}

export interface SampleStageDetail {
  id: string;
  startAt: string;
  currentSampleStage: string;
  logDetailDtos: SampleLogDetail[];
}

export interface SampleDetail {
  id: string;
  name: string;
  experimentLogId: string;
  notes: string | null;
  reason: string | null;
  executionDate: string | null;
  status: SampleStatus;
  createdBy?: string | null;
  createdDate?: string | null;
  updatedBy?: string | null;
  updatedDate?: string | null;
  sampleStageDto: SampleStageDetail | null;
}

// Disease analysis types
export interface Disease {
  id: number;
  name: string;
  code: string;
  description: string;
}

export interface AnalyticResult {
  id: string;
  anthracnose: number;
  bacterialWilt: number;
  blackrot: number;
  brownspots: number;
  moldBacterial: number;
  moldFungus: number;
  softRot: number;
  stemRot: number;
  witheredYellowRoot: number;
  healthy: number;
  oxidation: number;
  virus: number;
}

export interface AnalysisResponse {
  stageName: string;
  disease: Disease;
  analyticResult: AnalyticResult;
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
