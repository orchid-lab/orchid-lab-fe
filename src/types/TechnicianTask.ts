/**
 * =============================================================================
 * TECHNICIAN TASK TYPES
 * =============================================================================
 * Centralized types for technician task management
 */

/**
 * Task Status - Status values for tasks
 * 0: Assigned - Task vừa được tạo xong
 * 1: InProgress - Technician nhận task để làm
 * 2: WaitingForApproval - Technician hoàn thành, chờ approval từ researcher
 * 3: CompletedInTime - Researcher đã approve, hoàn thành đúng hạn
 * 4: CompletedOutTime - Hoàn thành trễ hạn
 * 5: Deleted - Researcher xóa task
 * 6: DeclinedByTechnician - Technician từ chối nhận task
 * 7: ReworkRequired - Researcher yêu cầu làm lại
 */
export type TaskStatus =
  | "Assigned"
  | "InProgress"
  | "WaitingForApproval"
  | "CompletedInTime"
  | "CompletedOutTime"
  | "Deleted"
  | "DeclinedByTechnician"
  | "ReworkRequired";

/**
 * Target Type - Types of targets for tasks
 */
export type TargetType = "Sample" | "ExperimentLog";

/**
 * Check List Item Status - Status values for checklist items
 */
export type CheckListItemStatus = "Pending" | "InProgress" | "Complete" | "Failed";

/**
 * Task Status Type - Status values for tasks in technician view (with Unknown)
 */
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

/**
 * Task Attribute - Attributes/properties of a task
 */
export interface TaskAttribute {
  chemicalName: string | null;
  materialName: string | null;
  unit: string;
  value: number;
}

/**
 * Task Assignment - Assignment details for a task
 */
export interface TaskAssignment {
  taskId: string;
  technicianName: string;
  targetType: TargetType;
  targetId: string;
  startDate: string;
  endDate: string;
  expectedEndDate: string;
}

/**
 * Check List Item - Individual item in a checklist
 */
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

/**
 * Task Check List - Collection of checklist items
 */
export interface TaskCheckList {
  id: string;
  checkListItemDtos: CheckListItem[];
}

/**
 * Task Data - Complete task information with all details
 */
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

/**
 * Task Item - Task information for list view
 */
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

/**
 * Task List API Response
 */
export interface TaskListApiResponse {
  totalCount?: number;
  pageCount?: number;
  pageSize?: number;
  pageNumber?: number;
  data?: TaskItem[];
}
