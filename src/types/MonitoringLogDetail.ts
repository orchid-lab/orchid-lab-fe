export interface AnalyticResult {
  id: string;
  predictions: Record<string, number>;
  topDisease: string;
  confidence: number;
  analyzedAt: string;
}

export interface LogDetail {
  id: string;
  measuredValue: number | null;
  isMatch: boolean;
  stageRequirementDefinitionDto: {
    id: string;
    sampleRequirementDefinitionDto: {
      id: string;
      characteristicCode: string;
      name: string;
      description: string;
      unit: string;
    };
    minValue: number | null;
    maxValue: number | null;
    expectedValue: number | null;
  };
}

export interface MonitoringLogDetailImage {
  id: string;
  targetType: string;
  targetId: string;
  url: string;
}

export interface MonitoringLogDetail {
  id: string;
  name: string;
  createdBy: string;
  createdDate: string;
  sampleName: string;
  sampleStageDefinitionName: string;
  diseaseName: string | null;
  analyticResult: AnalyticResult | null;
  status: string;
  deletedDate: string | null;
  deletedBy: string | null;
  updatedDate: string | null;
  updatedBy: string | null;
  isNewest: boolean;
  logDetails: LogDetail[];
  images: MonitoringLogDetailImage[];
  rejectionReason: string | null;
  rejectedDate: string | null;
}
