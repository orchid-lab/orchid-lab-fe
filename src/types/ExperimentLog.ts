import type { Sample } from "./Sample";
import type { Seedling } from "./Seedling";

/**
 * =============================================================================
 * EXPERIMENT LOG TYPES
 * =============================================================================
 * Centralized types for experiment logging and management
 */

// ─────────────────────────────────────────────────────────────────────────
// STAGE & CHEMICALS & MATERIALS
// ─────────────────────────────────────────────────────────────────────────

/**
 * Stage Definition - Basic info about a stage in a method
 */
export interface StageDefinition {
  id: number;
  name: string;
  description?: string;
}

/**
 * Material - Equipment/tools used in stages
 */
export interface Material {
  id: number;
  name: string;
  category?: string;
  description?: string;
  unit?: string;
}

/**
 * Chemical - Chemicals used in stages
 */
export interface Chemical {
  id: number;
  name: string;
  category?: string;
  description?: string;
  concentrationUnit?: string;
}

/**
 * Stage Material - Junction table item linking stage materials
 */
export interface StageMaterial {
  id: string;
  material: Material;
}

/**
 * Stage Chemical - Junction table item linking stage chemicals
 */
export interface StageChemical {
  id: string;
  chemical: Chemical;
}

// ─────────────────────────────────────────────────────────────────────────
// METHOD STRUCTURES
// ─────────────────────────────────────────────────────────────────────────

/**
 * Method Stage - Individual stage within a method with materials and chemicals
 */
export interface MethodStage {
  id: number;
  durationsDays: number;
  order: number;
  stageDefinition: StageDefinition;
  stageMaterials?: StageMaterial[];
  stageChemicals?: StageChemical[];
  isSampleGenerated?: boolean; // Determines if protocorm creation is allowed at this stage
}

/**
 * Method - Experiment method with associated stages
 */
export interface Method {
  id: number;
  name: string;
  description?: string;
  totalDurationDays?: number;
  methodStages?: MethodStage[];
}

// ─────────────────────────────────────────────────────────────────────────
// TISSUE CULTURE BATCH
// ─────────────────────────────────────────────────────────────────────────

/**
 * Batch - Tissue culture batch information
 */
export interface Batch {
  id: number;
  labRoomId?: number;
  labRoomName?: string;
  batchName?: string;
  batchSizeWidth?: number;
  batchSizeHeight?: number;
  widthUnit?: string;
  heightUnit?: string;
  status?: string;
}

// ─────────────────────────────────────────────────────────────────────────
// EXPERIMENT LOG DETAIL
// ─────────────────────────────────────────────────────────────────────────

/**
 * Experiment Log Detail - Complete experiment log information for detail pages
 */
export interface ExperimentLogDetail {
  id: string;
  name: string;
  seedling?: Seedling;
  method?: Method;
  batch?: Batch;
  expectedSampleCount?: number;
  currentStageOrder?: number;
  assignedTo?: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
  reason?: string;
  status?: string;
  createdDate?: string;
  createdBy?: string;
  updatedDate?: string;
  updatedBy?: string;
  samples?: Sample[];
  // Legacy fields for backward compatibility
  methodName?: string;
  tissueCultureBatchName?: string;
  create_date?: string;
  create_by?: string;
  // Tissue culture batch fields
  tissueCultureBatchId?: string;
  tissueCultureBatchID?: string;
}

// ─────────────────────────────────────────────────────────────────────────
// API RESPONSES
// ─────────────────────────────────────────────────────────────────────────

export interface ExperimentLogApiResponse {
  value?: ExperimentLogDetail;
  data?: ExperimentLogDetail;
}

// ─────────────────────────────────────────────────────────────────────────
// EXPERIMENT LOG LIST VIEW TYPES
// ─────────────────────────────────────────────────────────────────────────

/**
 * Experiment Status - Status values for experiment logs
 */
export type ExperimentStatus = "Created" | "InProcess" | "Done" | "Cancel" | "WaitingForChangeStage";

/**
 * Stage - Stage information for list views
 */
export interface StageList {
  id: string;
  name: string;
  description?: string;
  dateOfProcessing?: number;
  step: number;
  status: boolean;
  elementDTO?: unknown[];
}

/**
 * Sample - Sample information for list views
 */
export interface SampleList {
  id: string;
  name: string;
  description?: string;
  dob?: string;
  status?: boolean;
}

/**
 * Experiment Log Entry - Experiment log for list view
 */
export interface ExperimentLogEntryList {
  id: string;
  name: string;
  description?: string;
  tissueCultureBatchName?: string;
  batchName?: string;
  createdDate?: string;
  status?: number | string;
  samples?: SampleList[];
  stages?: StageList[];
  currentStageName?: string;
  currentStageOrder?: number;
  expectedSampleCount?: number;
  methodName: string;
}

/**
 * Experiment Log List API Response
 */
export interface ExperimentLogListApiResponse {
  totalCount: number;
  pageCount: number;
  pageSize: number;
  pageNumber: number;
  data: ExperimentLogEntryList[];
}

/**
 * Method Option - Simple method option for dropdowns
 */
export interface MethodOption {
  id: string;
  name: string;
}

/**
 * Sample List API Response
 */
export interface SampleListApiResponse {
  totalCount: number;
  pageCount: number;
  pageSize: number;
  pageNumber: number;
  data: unknown[];
}
