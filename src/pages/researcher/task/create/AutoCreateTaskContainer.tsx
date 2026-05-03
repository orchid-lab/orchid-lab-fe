/* eslint-disable no-empty-pattern */
/* eslint-disable @typescript-eslint/prefer-for-of */
/* eslint-disable react-x/no-array-index-key */
/* eslint-disable react-dom/no-missing-button-type */
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axiosInstance from "../../../../api/axiosInstance";
import { useSnackbar } from "notistack";
import { useTranslation } from "react-i18next";

interface TaskTemplate {
  id: string;
  name: string;
  stageID: string;
  stageName: string;
  description: string;
  status: boolean;
  details: TemplateDetail[];
}

interface Method {
  id: string;
  name: string;
  description: string;
  type: string;
  status: boolean;
  stages: Stage[];
}

interface Stage {
  id: string;
  name: string;
  description: string;
  dateOfProcessing: number;
  step: number;
  status: boolean;
}

interface TemplateDetail {
  id: string;
  element: string;
  name: string;
  description: string;
  expectedValue: number;
  unit: string;
  isRequired: boolean;
  status: boolean;
}

interface Technician {
  id: string;
  name: string;
  email: string;
  roleID: number;
}

interface ApiTaskTemplateResponse {
  value?: { data?: TaskTemplate[]; totalCount?: number; };
}

function isApiTaskTemplateResponse(obj: unknown): obj is ApiTaskTemplateResponse {
  return typeof obj === "object" && obj !== null && "value" in obj && typeof (obj as { value: unknown }).value === "object";
}

const AutoCreateTaskContainer: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();

  const experimentLogId = searchParams.get("experimentLogId");
  const stageId = searchParams.get("stageId");
  const autoCreate = searchParams.get("autoCreate") === "true";

  const [loading, setLoading] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [loadingTechnicians, setLoadingTechnicians] = useState(false);
  const [loadingMethod, setLoadingMethod] = useState(false);

  const [taskTemplates, setTaskTemplates] = useState<TaskTemplate[]>([]);
  const [] = useState<Stage[]>([]);
  const [method, setMethod] = useState<Method | null>(null);

  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [selectedTechnician, setSelectedTechnician] = useState<string>("");
  
  const [error, setError] = useState<string | null>(null);
  const [startDateIso, setStartDateIso] = useState<string>("");
  const [endDateIso, setEndDateIso] = useState<string>("");

  useEffect(() => {
    if (!experimentLogId) { setError(t("task.auto.noLogInfo")); return; }
    setLoadingMethod(true);
    axiosInstance.get(`/api/experimentlog/${experimentLogId}`)
      .then((res) => {
        const methodData = (res.data as { value?: Method })?.value;
        if (methodData) setMethod(methodData);
      })
      .catch(() => { setError(t("task.auto.noMethodInfo")); enqueueSnackbar(t("common.errorLoading"), { variant: "error" }); })
      .finally(() => setLoadingMethod(false));
  }, [experimentLogId, enqueueSnackbar, t]);

  useEffect(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    tomorrow.setHours(7, 0, 0, 0);
    setStartDateIso(tomorrow.toISOString());

    let durationDays = 0;
    if (method && stageId) {
      const st = method.stages?.find((s) => s.id === stageId);
      if (st && typeof st.dateOfProcessing === "number") durationDays = st.dateOfProcessing;
    }
    const end = new Date(tomorrow);
    if (durationDays > 0) end.setDate(end.getDate() + durationDays);
    else end.setDate(end.getDate());
    
    end.setHours(7, 0, 0, 0);
    setEndDateIso(end.toISOString());
  }, [method, stageId]);

  useEffect(() => {
    if (!stageId) { setError(t("task.auto.noStageInfo")); return; }
    setLoadingTemplates(true);
    axiosInstance.get(`/api/tasktemplate?pageNumber=1&pageSize=100&filter=${stageId}`)
      .then((res) => {
        if (isApiTaskTemplateResponse(res.data)) {
          const data = Array.isArray(res.data.value?.data) ? res.data.value.data : [];
          const filteredTemplates = data.filter((template) => template.stageID === stageId);
          setTaskTemplates(filteredTemplates);
          if (filteredTemplates.length === 0) setError(t("task.auto.noTemplatesForStage"));
        }
      })
      .catch(() => { setError(t("task.auto.loadTemplatesFailed")); enqueueSnackbar(t("common.errorLoading"), { variant: "error" }); })
      .finally(() => setLoadingTemplates(false));
  }, [stageId, enqueueSnackbar, t]);

  useEffect(() => {
    setLoadingTechnicians(true);
    axiosInstance.get("/api/user?pageNumber=1&pageSize=100")
      .then((res) => {
        const responseData = res.data as { data?: Technician[] };
        const data = Array.isArray(responseData?.data) ? responseData.data : [];
        const filteredTechnicians = data.filter((tc) => String(tc.roleID) === "3");
        setTechnicians(filteredTechnicians);
      })
      .catch(() => { setError(t("task.auto.loadTechsFailed")); enqueueSnackbar(t("common.errorLoading"), { variant: "error" }); })
      .finally(() => setLoadingTechnicians(false));
  }, [enqueueSnackbar, t]);

  const generateTaskFromTemplate = (template: TaskTemplate) => {
    return {
      experimentLogID: experimentLogId,
      stageID: stageId,
      sampleID: null,
      name: template.name,
      description: template.description,
      start_date: startDateIso,
      end_date: endDateIso,
      isDaily: true,
      attribute: template.details.map((detail) => ({
        elementId: detail.element,
        name: detail.name,
        measurementUnit: detail.unit,
        value: detail.expectedValue,
        description: detail.description,
      })),
      assignCommand: selectedTechnician ? [{ technicianId: selectedTechnician }] : [],
    };
  };

  const handleCreateTasks = async () => {
    if (!selectedTechnician) { enqueueSnackbar(t("task.auto.pleaseSelectTech"), { variant: "error" }); return; }
    if (taskTemplates.length === 0) { enqueueSnackbar(t("task.auto.noTemplatesToCreate"), { variant: "error" }); return; }
    if (!experimentLogId || !stageId) { enqueueSnackbar(t("task.auto.missingInfo"), { variant: "error" }); return; }

    setLoading(true);
    try {
      const tasks = taskTemplates.map((template) => generateTaskFromTemplate(template));
      const results = [];
      for (let i = 0; i < tasks.length; i++) {
        const response = await axiosInstance.post("/api/tasks", tasks[i]);
        results.push(response.data);
      }
      enqueueSnackbar(t("task.auto.createSuccess", { count: results.length }), { variant: "success" });
      void navigate("/researcher/tasks");
    } catch (error: unknown) {
      const errorObj = error as { response?: { data?: { message?: string } } };
      enqueueSnackbar(`${t("task.auto.createError")} ${errorObj.response?.data?.message ?? "N/A"}`, { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (!autoCreate) {
    return (
      <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#f8fafc] flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 text-center max-w-lg w-full">
          <h2 className="text-xl font-bold text-rose-600 mb-2">{t("task.auto.invalidAccess")}</h2>
          <p className="text-slate-500 mb-6">{t("task.auto.invalidAccessDesc")}</p>
          <button className="bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 font-semibold transition-colors" onClick={() => void navigate("/researcher/experiment-logs")}>
            {t("task.auto.backToList")}
          </button>
        </div>
      </main>
    );
  }

  if (loadingTemplates || loadingTechnicians || loadingMethod) {
    return (
      <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#f8fafc] flex flex-col items-center justify-center p-6">
        <div className="text-blue-600 flex flex-col items-center gap-3 animate-pulse">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          <span className="font-semibold">{t("common.loadingData")}</span>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#f8fafc] flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 text-center max-w-lg w-full">
          <h2 className="text-xl font-bold text-rose-600 mb-2">{t("common.errorOccurred")}</h2>
          <p className="text-slate-500 mb-6">{error}</p>
          <button className="bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 font-semibold transition-colors" onClick={() => void navigate("/researcher/experiment-logs")}>
            {t("common.back")}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#f8fafc] flex flex-col items-center py-10 px-6">
      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 w-full max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">{t("task.auto.title")}</h2>
          <button className="px-5 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors font-semibold shadow-sm text-sm" onClick={() => void navigate("/researcher/create-task/step-1")}>
            {t("task.auto.manualCreateBtn")}
          </button>
        </div>

        <div className="mb-8 p-5 bg-blue-50 rounded-xl border border-blue-100">
          <h3 className="font-bold text-blue-800 mb-3">{t("task.auto.autoInfo")}</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="font-semibold text-slate-500 uppercase">{t("task.auto.method")}</span> <span className="font-medium text-slate-800 ml-1">{method?.name ?? t("common.loadingData")}</span></div>
            <div><span className="font-semibold text-slate-500 uppercase">{t("task.auto.stage")}</span> <span className="font-bold text-blue-700 ml-1">{method?.stages?.find((s) => s.id === stageId)?.name ?? t("common.loadingData")}</span></div>
            <div><span className="font-semibold text-slate-500 uppercase">{t("task.auto.start")}</span> <span className="font-medium text-slate-800 ml-1">{startDateIso ? new Date(startDateIso).toLocaleDateString("vi-VN") : t("task.auto.calculating")}</span></div>
            <div><span className="font-semibold text-slate-500 uppercase">{t("task.auto.end")}</span> <span className="font-medium text-slate-800 ml-1">{endDateIso ? new Date(endDateIso).toLocaleDateString("vi-VN") : t("task.auto.calculating")}</span></div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-sm font-bold text-slate-700 uppercase mb-4">{t("task.auto.templatesToBeCreated")} ({taskTemplates.length})</h3>
          {taskTemplates.length > 0 ? (
            <div className="flex flex-col gap-3">
              {taskTemplates.map((template, index) => (
                <div key={template.id} className="p-5 border border-slate-200 rounded-xl bg-slate-50 relative">
                  <span className="absolute top-5 right-5 text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">{t("task.auto.templateNumber")} {index + 1}</span>
                  <div>
                    <h4 className="font-bold text-slate-800 pr-16">{template.name}</h4>
                    <p className="text-slate-500 text-sm mt-1">{template.description}</p>
                  </div>

                  {template.details && template.details.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-2">{t("task.auto.materials")}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {template.details.map((detail, idx) => (
                          <div key={idx} className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                            <p className="font-bold text-slate-800 text-sm">{detail.name}</p>
                            <p className="text-blue-700 font-semibold text-xs mt-1">{t("task.auto.quantity")} {detail.expectedValue} {detail.unit}</p>
                            {detail.description && <p className="text-slate-500 text-xs mt-1 italic">{detail.description}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 italic">{t("task.auto.noTemplatesAvailable")}</p>
          )}
        </div>

        <div className="mb-8 bg-blue-50/50 p-5 rounded-xl border border-blue-100">
          <label className="block text-sm font-bold text-slate-700 mb-2">
            {t("task.auto.assignToTech")} <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-3">
            <select
              value={selectedTechnician}
              onChange={(e) => setSelectedTechnician(e.target.value)}
              className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
              required
            >
              <option value="">{t("task.selectTechSubtitle")}</option>
              {technicians.map((tech) => (
                <option key={tech.id} value={tech.id}>
                  {tech.name}
                </option>
              ))}
            </select>
            {loadingTechnicians && (
              <span className="text-xs text-blue-600 font-medium">{t("common.loading")}</span>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
          <button
            type="button"
            className="px-6 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors shadow-sm"
            onClick={() => void navigate("/researcher/experiment-logs")}
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            className="px-8 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed shadow-sm"
            onClick={() => void handleCreateTasks()}
            disabled={loading || !selectedTechnician || taskTemplates.length === 0}
          >
            {loading ? t("common.processing") : t("task.auto.startAutoCreateBtn")}
          </button>
        </div>
      </div>
    </main>
  );
};

export default AutoCreateTaskContainer;