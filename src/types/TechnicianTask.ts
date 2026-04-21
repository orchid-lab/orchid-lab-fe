
export type TaskStatus =
  | "Assigned"
  | "InProgress"
  | "WaitingForApproval"
  | "CompletedInTime"
  | "CompletedOutTime"
  | "Deleted"
  | "DeclinedByTechnician"
  | "ReworkRequired";


export type TargetType = "Sample" | "ExperimentLog";
export type CheckListItemStatus = "Pending" | "InProgress" | "Complete" | "Failed";
export type TaskStatusType =
  | "Assigned"
  | "InProgress"
  | "WaitingForApproval"
  | "CompletedInTime"
  | "CompletedOutTime"
  | "Deleted"
  | "DeclinedByTechnician"
  | "ReworkRequired"
  | "Unknown";
export interface TaskAttribute {
  chemicalName: string | null;
  materialName: string | null;
  unit: string;
  value: number;
}

export interface TaskAssignment {
  taskId: string;
  technicianName: string;
  targetType: TargetType;
  targetId: string;
  startDate: string;
  endDate: string;
  expectedEndDate: string;
}

export interface CheckListItem {
  id: string;
  name: string;
  description: string;
  order: number;
  expectedUnit: string | null;
  expectedMinValue: number | null;
  expectedMaxValue: number | null;
  status: CheckListItemStatus;
  measurementUnit: string | null;
  mesuredValue: number | null;
  isPass: boolean | null;
  evaluated: string;
}

export interface TaskCheckList {
  id: string;
  checkListItemDtos: CheckListItem[];
}

export interface TaskData {
  id: string;
  name: string;
  description: string;
  stageId: number | null;
  researcherId: string;
  status: TaskStatus;
  createdDate: string;
  createdBy: string;
  updatedDate: string | null;
  updatedBy: string | null;
  deletedDate: string | null;
  deletedBy: string | null;
  taskAttributes: TaskAttribute[];
  taskAssignments: TaskAssignment;
  taskCheckList: TaskCheckList | null;
}

export interface TaskItem {
  id: string;
  name: string;
  description?: string;
  stageId?: number;
  taskTargetType?: string;
  targetId?: string;
  researcherId: string;
  technicianId: string;
  status: TaskStatusType;
  expectedEndDate: string;
  createdDate?: string;
  targetName?: string;
}

export interface TaskListApiResponse {
  totalCount?: number;
  pageCount?: number;
  pageSize?: number;
  pageNumber?: number;
  data?: TaskItem[];
}
