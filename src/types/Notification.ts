export type NotificationTargetType = "Task" | "ExperimentLog" | "Report" | "Batch";

export interface Notification {
  id: string;
  userId: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  notificationTargetType: NotificationTargetType;
  targetId: string;
}