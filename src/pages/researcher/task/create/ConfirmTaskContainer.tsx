import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CreateTaskStepper from "./CreateTaskStepper";
import { useCreateTask } from "../../../../context/CreateTaskContext";
import axiosInstance from "../../../../api/axiosInstance";
import { useSnackbar } from "notistack";

const ConfirmTaskContainer: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { state } = useCreateTask();
  const { enqueueSnackbar } = useSnackbar();

  const isTemplate = state.taskMode === "template";

  const handleBack = (): void => {
    void navigate(isTemplate ? "/create-task/step-1" : "/create-task/step-2");
  };

  const handleCreate = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();

    // Build createTaskAttribute
    const createTaskAttribute = state.attributes
      .filter((a) => a.itemId > 0)
      .map((a) => ({
        chemicalId: a.type === "chemical" ? a.itemId : null,
        materialId: a.type === "material" ? a.itemId : null,
        unit: a.unit,
        value: a.value,
      }));

    // Build createTaskCheckListItemDtos
    const createTaskCheckListItemDtos = state.checklistItems.map((item, i) => ({
      name: item.name,
      description: item.description,
      order: i + 1,
      expectedUnit: item.expectedUnit,
      expectedMinValue: item.expectedMinValue ?? 0,
      expectedMaxValue: item.expectedMaxValue ?? 0,
    }));

    // Build createTaskAssignment (null for template)
    let createTaskAssignment = null;
    if (!isTemplate && state.technician) {
      const targetId =
        state.targetType === "ExperimentLog"
          ? state.selectedEL?.id
          : state.selectedSample?.id;

      createTaskAssignment = {
        technicianId: state.technician.id,
        targetType: state.targetType,
        targetId: targetId ?? "",
        expectedEndDate: state.expectedEndDate
          ? new Date(state.expectedEndDate).toISOString()
          : new Date().toISOString(),
      };
    }

    // stageId: only for template, from templateEL's currentStageOrder
    const stageId = isTemplate ? (state.templateEL?.currentStageOrder ?? 0) : 0;

    const body = {
      name: state.name,
      description: state.description,
      createTaskAssignment,
      stageId,
      createTaskAttribute,
      createTaskCheckListItemDtos,
    };

    try {
      await axiosInstance.post("/api/tasks", body);
      enqueueSnackbar(t("task.createTaskSuccess"), { variant: "success" });
      void navigate("/researcher/tasks");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      enqueueSnackbar(
        t("task.createTaskFailed") +
          " " +
          (error?.response?.data?.message ??
            JSON.stringify(error?.response?.data) ??
            ""),
        { variant: "error" },
      );
    }
  };

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 flex flex-col items-center py-10 px-6">
      <CreateTaskStepper currentStep={3} />
      <form
        className="bg-white rounded-2xl px-10 pt-8 pb-10 shadow-md w-full max-w-4xl mt-6"
        onSubmit={(e) => {
          void handleCreate(e);
        }}
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {t("task.confirmTaskTitle")}
        </h2>
        <p className="text-sm text-gray-400 mb-8">
          {t("task.confirmTaskSubtitle")}
        </p>

        {/* ── Basic info ── */}
        <div className="mb-8">
          <h3 className="font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200">
            {t("task.stepBasicInfo")}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-gray-400 mb-1">
                {t("task.taskName")}
              </p>
              <p className="text-gray-800 font-medium">{state.name}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 mb-1">
                {t("common.status")}
              </p>
              <span
                className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${
                  isTemplate
                    ? "bg-purple-100 text-purple-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {isTemplate
                  ? t("task.taskModeTemplate")
                  : t("task.taskModeRegular")}
              </span>
            </div>
            {state.description && (
              <div className="col-span-2">
                <p className="text-xs font-medium text-gray-400 mb-1">
                  {t("common.description")}
                </p>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {state.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Assignment info ── */}
        {!isTemplate && (
          <div className="mb-8">
            <h3 className="font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200">
              {t("task.sectionAssignment")}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-400 mb-1">
                  {t("task.targetType")}
                </p>
                <p className="text-gray-800">
                  {state.targetType === "ExperimentLog"
                    ? t("task.experimentLog")
                    : t("task.targetTypeSample")}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 mb-1">
                  {t("task.targetObject")}
                </p>
                <p className="text-gray-800">
                  {state.targetType === "ExperimentLog"
                    ? (state.selectedEL?.name ?? "-")
                    : (state.selectedSample?.name ?? "-")}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 mb-1">
                  {t("task.technician")}
                </p>
                <p className="text-gray-800 font-medium">
                  {state.technician?.name ?? "-"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 mb-1">
                  {t("task.expectedEndDate")}
                </p>
                <p className="text-gray-800">
                  {state.expectedEndDate
                    ? new Date(state.expectedEndDate).toLocaleDateString(
                        "vi-VN",
                      )
                    : "-"}
                </p>
              </div>
            </div>
          </div>
        )}

        {isTemplate && state.templateEL && (
          <div className="mb-8">
            <h3 className="font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200">
              {t("task.sectionTemplate")}
            </h3>
            <div>
              <p className="text-xs font-medium text-gray-400 mb-1">
                {t("task.experimentLog")} / StageId
              </p>
              <p className="text-gray-800">
                {state.templateEL.name} — Stage{" "}
                {state.templateEL.currentStageOrder ?? 0}
              </p>
            </div>
          </div>
        )}

        {/* ── Attributes ── */}
        {state.attributes.filter((a) => a.itemId > 0).length > 0 && (
          <div className="mb-8">
            <h3 className="font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200">
              {t("task.taskAttributesTitle")}
            </h3>
            <div className="space-y-2">
              {state.attributes
                .filter((a) => a.itemId > 0)
                .map((a) => (
                  <div
                    key={`attr-${a.type}-${a.itemId}`}
                    className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3"
                  >
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        a.type === "chemical"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {a.type === "chemical"
                        ? t("element.chemical")
                        : t("element.material")}
                    </span>
                    <span className="flex-1 text-gray-800 font-medium">
                      {a.itemName}
                    </span>
                    <span className="text-gray-500 text-sm bg-white border border-gray-200 px-3 py-1 rounded-lg">
                      {a.value} {a.unit}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ── Checklist ── */}
        {state.checklistItems.length > 0 && (
          <div className="mb-8">
            <h3 className="font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200">
              {t("task.taskChecklist")}
            </h3>
            <div className="space-y-2">
              {state.checklistItems.map((item) => (
                <div
                  key={`cl-${item.order}-${item.name}`}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {item.order}
                    </span>
                    <span className="font-semibold text-gray-800 flex-1">
                      {item.name}
                    </span>
                    {item.expectedUnit && (
                      <span className="text-xs text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-lg">
                        {item.expectedUnit}
                      </span>
                    )}
                    {(item.expectedMinValue != null ||
                      item.expectedMaxValue != null) && (
                      <span className="text-xs text-gray-500">
                        {item.expectedMinValue ?? "–"} →{" "}
                        {item.expectedMaxValue ?? "–"}
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-xs text-gray-400 mt-1.5 ml-9">
                      {item.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            className="px-6 py-2.5 rounded-lg text-base font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
            onClick={handleBack}
          >
            {t("common.back")}
          </button>
          <button
            type="submit"
            className="px-8 py-2.5 rounded-lg text-base font-semibold bg-green-700 text-white hover:bg-green-800 transition-colors"
          >
            {t("task.confirmCreateTask")}
          </button>
        </div>
      </form>
    </main>
  );
};

export default ConfirmTaskContainer;
