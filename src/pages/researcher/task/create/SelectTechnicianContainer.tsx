import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CreateTaskStepper from "./CreateTaskStepper";
import { useCreateTask } from "../../../../context/CreateTaskContext";
import axiosInstance from "../../../../api/axiosInstance";

interface TechnicianApi {
  id: string;
  name: string;
  role: string;
  roleID?: number;
}

const SelectTechnicianContainer: React.FC = () => {
  const [technicians, setTechnicians] = useState<TechnicianApi[]>([]);
  const [selectedTech, setSelectedTech] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { state, setState } = useCreateTask();

  useEffect(() => {
    if (state.taskMode === "template") {
      void navigate("/researcher/create-task/step-3", { replace: true });
    }
  }, [state.taskMode, navigate]);

  useEffect(() => {
    setLoading(true);
    axiosInstance.get("/api/user?PageNumber=1&PageSize=100")
      .then((res) => {
        const raw = res.data as { data?: TechnicianApi[]; value?: { data?: TechnicianApi[] }; };
        const data = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw?.value?.data) ? raw.value.data : [];
        const techs = data.filter((u) => (typeof u.role === "string" && u.role.toLowerCase().includes("technician")) || String(u.roleID) === "3");
        setTechnicians(techs);

        if (state.assigneeId && techs.find((t) => t.id === state.assigneeId)) {
          setSelectedTech(String(state.assigneeId));
        }
      })
      .catch(() => setTechnicians([]))
      .finally(() => setLoading(false));
  }, [state.assigneeId]);

  const handleNext = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (selectedTech) {
      const techObj = technicians.find((u) => u.id === selectedTech);
      setState((prev) => ({
        ...prev,
        assigneeId: selectedTech,
        technician: techObj ? { id: techObj.id, name: techObj.name } : null,
      }));
      void navigate("/researcher/create-task/step-3");
    }
  };

  const handleBack = (): void => {
    void navigate("/researcher/create-task/step-1");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <CreateTaskStepper currentStep={2} />

      <form onSubmit={handleNext} className="mt-8 bg-white shadow-sm border border-slate-200 rounded-2xl p-6 md:p-8">
        <h2 className="text-xl font-bold text-slate-800 mb-6 pb-4 border-b border-slate-100">
          {t("task.technician")}
        </h2>
        <p className="text-sm text-slate-500 mb-8">
          {t("task.selectTechSubtitle")}
        </p>

        {loading ? (
          <div className="text-blue-600 animate-pulse text-sm font-medium py-8 text-center">{t("task.loadingTechnicians")}</div>
        ) : technicians.length === 0 ? (
          <div className="text-slate-500 italic p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">{t("task.noTechniciansFound")}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {technicians.map((tech) => (
              <div
                key={tech.id}
                onClick={() => setSelectedTech(tech.id)}
                className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedTech === tech.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 hover:border-blue-300 hover:shadow-md bg-white"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-lg shadow-sm ${selectedTech === tech.id ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                    {tech.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className={`font-bold ${selectedTech === tech.id ? "text-blue-800" : "text-slate-800"}`}>{tech.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{tech.role}</p>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${selectedTech === tech.id ? "border-blue-600 bg-blue-600" : "border-slate-300"}`}>
                  {selectedTech === tech.id && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
          <button type="button" onClick={handleBack} className="px-6 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors shadow-sm">
            {t("common.back")}
          </button>
          <button type="submit" disabled={selectedTech === null} className="px-8 py-2.5 rounded-xl text-base font-semibold transition-colors bg-blue-600 text-white hover:bg-blue-700 shadow-sm disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed">
            {t("common.next")} →
          </button>
        </div>
      </form>
    </div>
  );
};

export default SelectTechnicianContainer;