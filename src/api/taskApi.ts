/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import axiosInstance from "./axiosInstance";

export interface Task {
  id: string;
  taskTargetType: string;
  targetId: string;
  status: string;
  // ...other fields as needed
}

export interface TaskListResponse {
  value?: { data?: Task[] };
  data?: Task[];
}

export const getTasks = async (params?: Record<string, any>): Promise<Task[]> => {
  const res = await axiosInstance.get("/api/tasks", {
    params: {
      PageNumber: 1,
      PageSize: 10000,
      ...params,
    },
  });
  const data = res.data?.value?.data ?? res.data?.data ?? [];
  return data as Task[];
};
