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

  // If template mode, skip this step
  useEffect(() => {
    if (state.taskMode === "template") {
      void navigate("/create-task/step-3", { replace: true });
    }
  }, [state.taskMode, navigate]);

  useEffect(() => {
    setLoading(true);
    axiosInstance
      .get("/api/user?PageNumber=1&PageSize=100")
      .then((res) => {
        const raw = res.data as {
          data?: TechnicianApi[];
          value?: { data?: TechnicianApi[] };
        };
        const data = Array.isArray(raw?.data)
          ? raw.data
          : Array.isArray(raw?.value?.data)
            ? raw.value.data
            : [];
        // Filter technicians: role = "Technician" or roleID = 3
        const techs = data.filter(
          (t) =>
            (typeof t.role === "string" &&
              t.role.toLowerCase().includes("technician")) ||
            String(t.roleID) === "3",
        );
        setTechnicians(techs);
      })
      .catch(() => setTechnicians([]))
      .finally(() => setLoading(false));
  }, []);

  const handleNext = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (selectedTech) {
      const techObj = technicians.find((t) => t.id === selectedTech);
      setState((prev) => ({
        ...prev,
        technician: techObj ? { id: techObj.id, name: techObj.name } : null,
      }));
      void navigate("/create-task/step-3");
    }
  };

  const handleBack = (): void => {
    void navigate("/create-task/step-1");
  };

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 flex flex-col items-center py-10 px-6">
      <CreateTaskStepper currentStep={2} />
      <form
        className="bg-white rounded-2xl px-10 pt-8 pb-10 shadow-md w-full max-w-4xl mt-6"
        onSubmit={handleNext}
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Chọn kỹ thuật viên
        </h2>
        <p className="text-sm text-gray-400 mb-8">
          Chọn kỹ thuật viên sẽ thực hiện nhiệm vụ này
        </p>

        <div className="flex flex-col gap-3 mb-8">
          {loading && (
            <div className="flex items-center gap-3 text-gray-500 py-8 justify-center">
              <svg
                className="animate-spin w-5 h-5 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
              Đang tải danh sách kỹ thuật viên...
            </div>
          )}
          {!loading && technicians.length === 0 && (
            <div className="text-center py-10 text-red-400 font-medium">
              {t("task.noTechniciansAvailable")}
            </div>
          )}
          {technicians.map((tech) => (
            <div
              key={tech.id}
              className={`flex items-center gap-4 rounded-xl py-4 px-5 cursor-pointer border-2 transition-all duration-150 ${
                selectedTech === tech.id
                  ? "border-green-600 bg-green-50 shadow-sm"
                  : "border-gray-200 bg-white hover:border-green-300 hover:bg-gray-50"
              }`}
              onClick={() => setSelectedTech(tech.id)}
            >
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-base text-white flex-shrink-0 ${
                  selectedTech === tech.id ? "bg-green-600" : "bg-gray-400"
                }`}
              >
                {tech.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800">{tech.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{tech.role}</p>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  selectedTech === tech.id
                    ? "border-green-600 bg-green-600"
                    : "border-gray-300"
                }`}
              >
                {selectedTech === tech.id && (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={3}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
            </div>
          ))}
        </div>

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
            className="px-8 py-2.5 rounded-lg text-base font-semibold transition-colors bg-green-700 text-white hover:bg-green-800 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
            disabled={selectedTech === null}
          >
            {t("common.next")} →
          </button>
        </div>
      </form>
    </main>
  );
};

export default SelectTechnicianContainer;
