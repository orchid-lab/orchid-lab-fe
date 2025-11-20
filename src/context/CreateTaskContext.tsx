import React, { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

// Định nghĩa kiểu dữ liệu cho từng trường của task
export interface Attribute {
  elementId: string; // Thay đổi từ name thành elementId
  elementName: string; // Thêm elementName để lưu tên hiển thị
  measurementUnit: string;
  value: number;
  description: string;
}

export interface Element {
  id: string;
  name: string;
  description: string;
}

export interface ExperimentLog {
  id: string;
  name: string;
}

export interface Stage {
  id: string;
  name: string;
}

export interface Sample {
  id: string;
  name: string;
}

export interface Technician {
  id: string;
  name: string;
}

export interface AssignCommandItem {
  technicianId: string;
  technicianName?: string;
}

export interface CreateTaskState {
  name: string;
  experimentLog: ExperimentLog | null;
  stage: Stage | null;
  sample: Sample | null;
  description: string;
  start_date: string;
  end_date: string;
  isDaily: boolean;
  attribute: Attribute[];
  assignCommand: AssignCommandItem[];
}

const defaultState: CreateTaskState = {
  name: "",
  experimentLog: null,
  stage: null,
  sample: null,
  description: "",
  start_date: "",
  end_date: "",
  isDaily: false,
  attribute: [],
  assignCommand: [],
};

export const CreateTaskContext = createContext<{
  state: CreateTaskState;
  setState: React.Dispatch<React.SetStateAction<CreateTaskState>>;
}>({
  state: defaultState,
  setState: () => {
    // no-op
  },
});

export const useCreateTask = () => useContext(CreateTaskContext);

export const CreateTaskProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<CreateTaskState>(defaultState);
  return (
    <CreateTaskContext.Provider value={{ state, setState }}>
      {children}
    </CreateTaskContext.Provider>
  );
};
