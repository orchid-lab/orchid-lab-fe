// Shared mapping for sample status badges used by both Researcher and Technician pages.
// Each entry provides the Tailwind colour classes and the translation key for the label.
// The colour classes follow the same pattern as the Technician component.

// The researcher page originally used a base class `status-badge` with a modifier
// (e.g. `created`, `in-progress`, `waiting`, `completed`, `destroyed`).
// To keep that styling while still providing translation keys, the map now
// stores the **class suffix** instead of full Tailwind utility classes.
export interface SampleStatusEntry {
  classSuffix: string; // suffix added to the base `status-badge` class
  labelKey: string; // i18n key used with t(labelKey)
}

export const SAMPLE_STATUS_MAP: Record<string, SampleStatusEntry> = {
  Created: {
    classSuffix: "created",
    labelKey: "status.created",
  },
  InProgress: {
    classSuffix: "in-progress",
    labelKey: "experimentLog.inProgress",
  },
  InProgressed: {
    // Technician‑specific status – reuse the same style as InProgress
    classSuffix: "in-progress",
    labelKey: "experimentLog.inProgress",
  },
  WaitingForChangeStage: {
    classSuffix: "waiting",
    labelKey: "experimentLog.waitingForStageChange",
  },
  Completed: {
    classSuffix: "completed",
    labelKey: "experimentLog.completed",
  },
  Destroyed: {
    classSuffix: "destroyed",
    labelKey: "experimentLog.destroyed",
  },
  ExecutedBecauseOfDisease: {
    // Use same style as Destroyed
    classSuffix: "destroyed",
    labelKey: "sample.executedBecauseOfDisease",
  },
  ConvertedToSeedling: {
    classSuffix: "converted",
    labelKey: "sample.convertedToSeedling",
  },
};
