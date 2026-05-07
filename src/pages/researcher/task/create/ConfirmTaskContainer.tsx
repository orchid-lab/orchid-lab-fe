/* eslint-disable react-x/no-array-index-key */
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
    void navigate(isTemplate ? "/researcher/create-task/step-1" : "/researcher/create-task/step-2");
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    const createTaskAttribute = state.attributes
      .filter((a) => a.itemId > 0)
      .map((a) => ({
        chemicalId: a.type === "chemical" ? a.itemId : null,
        materialId: a.type === "material" ? a.itemId : null,
        unit: a.unit,
        value: a.value,
      }));

    const createTaskCheckListItemDtos = state.checklistItems.map((item, i) => ({
      name: item.name,
      description: item.description,
      order: i + 1,
      expectedUnit: item.expectedUnit,
      expectedMinValue: item.expectedMinValue ?? 0,
      expectedMaxValue: item.expectedMaxValue ?? 0,
    }));

    let createTaskAssignment = null;
    if (!isTemplate && state.technician) {
      const targetId = state.targetType === "ExperimentLog" ? state.selectedEL?.id : state.selectedSample?.id;

      createTaskAssignment = {
        technicianId: state.technician.id,
        targetType: state.targetType,
        targetId: targetId ?? "",
        expectedEndDate: state.expectedEndDate ? new Date(state.expectedEndDate).toISOString() : new Date().toISOString(),
      };
    }

    const stageId = isTemplate ? (state.templateEL?.currentStageOrder ?? 0) : null;

    const body = {
      name: state.name,
      description: state.description || null,
      createTaskAssignment,
      ...(stageId !== null ? { stageId } : {}),
      createTaskAttribute,
      createTaskCheckListItemDtos,
    };

    try {
      await axiosInstance.post("/api/tasks", body);
      enqueueSnackbar(t("task.createTaskSuccess"), { variant: "success" });
      if (state.taskMode === "template") {
        void navigate("/researcher/task-templates");
      } else {
        void navigate("/researcher/tasks");
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      enqueueSnackbar(
        t("task.createTaskFailed") + " " + (error?.response?.data?.message ?? JSON.stringify(error?.response?.data) ?? ""),
        { variant: "error" }
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <CreateTaskStepper currentStep={3} />

      <form onSubmit={(e) => { void handleCreate(e); }} className="mt-8 bg-white shadow-sm border border-slate-200 rounded-2xl p-6 md:p-8">
        <h2 className="text-xl font-bold text-slate-800 mb-6 pb-4 border-b border-slate-100">
          {t("task.confirmTaskTitle")}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase mb-1">{t("task.taskName")}</p>
            <p className="text-base font-bold text-slate-800">{state.name}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase mb-1">{t("task.creationMode")}</p>
            <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${isTemplate ? "bg-purple-100 text-purple-700 border border-purple-200" : "bg-blue-100 text-blue-700 border border-blue-200"}`}>
              {isTemplate ? t("task.taskModeTemplate") : t("task.taskModeRegular")}
            </span>
          </div>
          {state.description && (
            <div className="md:col-span-2">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">{t("common.description")}</p>
              <p className="text-sm font-medium text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 whitespace-pre-wrap">{state.description || <span className="italic text-slate-400">{t("task.noDescription")}</span>}</p>
            </div>
          )}

          {!isTemplate && (
            <>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">{t("task.targetType")}</p>
                <p className="text-sm font-bold text-slate-800">{state.targetType === "ExperimentLog" ? t("task.experimentLog") : t("task.targetTypeSample")}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">{t("task.targetObject")}</p>
                <p className="text-sm font-medium text-slate-800">{state.targetType === "ExperimentLog" ? (state.selectedEL?.name ?? "-") : (state.selectedSample?.name ?? "-")}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">{t("task.technician")}</p>
                <p className="text-sm font-bold text-blue-800">{state.technician?.name ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">{t("task.expectedEndDate")}</p>
                <p className="text-sm font-medium text-slate-800">{state.expectedEndDate ? new Date(state.expectedEndDate).toLocaleDateString("vi-VN") : "-"}</p>
              </div>
            </>
          )}

          {isTemplate && state.templateEL && (
            <div className="md:col-span-2">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">{t("task.experimentLog")} / StageId</p>
              <p className="text-sm font-medium text-slate-800 bg-slate-50 p-4 rounded-xl border border-slate-100">
                {state.templateEL.name} — Stage {state.templateEL.currentStageOrder ?? 0}
              </p>
            </div>
          )}
        </div>

        {/* Attributes */}
        {state.attributes.filter((a) => a.itemId > 0).length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-bold text-slate-700 uppercase mb-3">{t("task.taskAttributesTitle")}</h3>
            <div className="overflow-hidden border border-slate-200 rounded-xl">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left">{t("task.attrType")}</th>
                    <th className="px-4 py-3 text-left">{t("task.materialChemicalId")}</th>
                    <th className="px-4 py-3 text-right">{t("task.quantity")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {state.attributes.filter((a) => a.itemId > 0).map((a, idx) => (
                    <tr key={`attr-${a.type}-${a.itemId}-${idx}`} className="bg-white">
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {a.type === "chemical" ? t("element.chemical") : t("task.material")}
                      </td>
                      <td className="px-4 py-3 text-slate-600">ID: {a.itemId}</td>
                      <td className="px-4 py-3 text-right font-semibold text-blue-700">
                        {a.value} {a.unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Checklist */}
        {state.checklistItems.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-slate-700 uppercase mb-3">{t("task.taskChecklist")}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {state.checklistItems.map((item, i) => (
                <div key={`cl-${i}-${item.name}`} className="p-4 bg-slate-50 rounded-xl border border-slate-100 relative">
                  <div className="absolute top-4 right-4 text-xs font-bold text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {t("task.stepPrefix")} {i + 1}
                  </div>
                  <div className="flex items-center gap-2 mb-2 pr-12">
                    <span className="font-bold text-slate-800">{item.name}</span>
                    {item.expectedUnit && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md font-semibold border border-blue-200">
                        {item.expectedUnit}
                      </span>
                    )}
                  </div>
                  {(item.expectedMinValue != null || item.expectedMaxValue != null) && (
                    <div className="text-xs font-semibold text-slate-500 mb-2 bg-white w-fit px-2 py-1 rounded border border-slate-200">
                      {t("task.threshold")} {item.expectedMinValue ?? "–"} → {item.expectedMaxValue ?? "–"}
                    </div>
                  )}
                  {item.description && (
                    <p className="text-xs text-slate-600 mt-2 p-2 bg-white rounded border border-slate-100">
                      {item.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-6 mt-8 border-t border-slate-200">
          <button type="button" onClick={handleBack} className="px-6 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors shadow-sm">
            {t("common.back")}
          </button>
          <button type="submit" className="px-8 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors shadow-sm">
            {t("task.confirmCreateTask")}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ConfirmTaskContainer;