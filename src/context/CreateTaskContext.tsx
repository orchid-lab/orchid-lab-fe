import React, { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

export interface Chemical {
  id: number;
  name: string;
  category: string;
  concentrationUnit: string;
}

export interface Material {
  id: number;
  name: string;
  category: string;
  unit: string;
}

export interface ExperimentLog {
  id: string;
  name: string;
  currentStageOrder?: number;
}

export interface Sample {
  id: string;
  name: string;
}

export interface Technician {
  id: string;
  name: string;
}

export type TaskMode = "regular" | "template";
export type TargetType = "ExperimentLog" | "Sample";

export interface TaskAttribute {
  type: "chemical" | "material";
  itemId: number;
  itemName: string;
  unit: string;
  value: number;
}

export interface ChecklistItem {
  name: string;
  description: string;
  order: number;
  sourceType: "chemical" | "material" | "none";
  sourceId: number | null;
  sourceName: string;
  expectedUnit: string;
  expectedMinValue: number | null;
  expectedMaxValue: number | null;
}

// Keep legacy types for backward compat
export interface Attribute {
  elementId: string;
  elementName: string;
  measurementUnit: string;
  value: number;
  description: string;
}

export interface Element {
  id: string;
  name: string;
  description: string;
}

export interface Stage {
  id: string;
  name: string;
}

export interface CreateTaskState {
  name: string;
  description: string;
  taskMode: TaskMode;
  // Regular task
  targetType: TargetType | "";
  selectedEL: ExperimentLog | null;
  selectedSample: Sample | null;
  expectedEndDate: string;
  technician: Technician | null;
  // Template
  templateEL: ExperimentLog | null;
  // Attributes & checklist
  attributes: TaskAttribute[];
  checklistItems: ChecklistItem[];
}

const defaultState: CreateTaskState = {
  name: "",
  description: "",
  taskMode: "regular",
  targetType: "",
  selectedEL: null,
  selectedSample: null,
  expectedEndDate: "",
  technician: null,
  templateEL: null,
  attributes: [],
  checklistItems: [],
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
