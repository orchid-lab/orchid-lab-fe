import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import axiosInstance from "../../../api/axiosInstance";

interface Material {
  id: number;
  name: string;
  category: string;
  description: string | null;
  unit: string;
}

interface Chemical {
  id: number;
  name: string;
  category: string;
  description: string | null;
  concentrationUnit: string;
}

interface StageMaterial {
  id: string;
  material: Material;
}

interface StageChemical {
  id: string;
  chemical: Chemical;
}

interface StageDefinition {
  id: number;
  name: string;
  description: string;
}

interface MethodStage {
  id: number;
  durationsDays: number;
  order: number;
  isSampleGenerated: boolean;
  stageDefinition: StageDefinition;
  stageMaterials: StageMaterial[];
  stageChemicals: StageChemical[];
}

interface MethodDetail {
  id: number;
  name: string;
  description: string;
  totalDurationDays: number;
  methodStages: MethodStage[];
}

interface MethodDetailApiResponse {
  id?: number;
  name?: string;
  description?: string;
  totalDurationDays?: number;
  methodStages?: MethodStage[];
}

export default function MethodDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();

  const [data, setData] = useState<MethodDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        return;
      }
      setLoading(true);
      try {
        const res = await axiosInstance.get(`/api/methods/${id}`);
        const json = res.data as MethodDetailApiResponse;
        
        if (json.id && json.name) {
          setData({
            id: json.id,
            name: json.name,
            description: json.description ?? "",
            totalDurationDays: json.totalDurationDays ?? 0,
            methodStages: json.methodStages ?? [],
          });
        }
      } catch (error) {
        const apiError = error as { response?: { data?: string }; message?: string };
        enqueueSnackbar(
          apiError.response?.data ?? apiError.message ?? t("method.fetchFailed"),
          { variant: "error" }
        );
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, [id, t, enqueueSnackbar]);

  if (loading) {
    return (
      <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-6"></div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-6">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-3"></div>
                <div className="h-4 bg-gray-100 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 p-6">
        <div className="bg-white rounded-lg p-8 text-center">
          <p className="text-gray-500">{t("common.noData")}</p>
          <button
            type="button"
            className="mt-4 bg-green-800 text-white px-6 py-2 rounded-full hover:bg-green-900 transition"
            onClick={() => navigate("/researcher/method")}
          >
            {t("common.back")}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          type="button"
          className="text-green-800 hover:text-green-900 font-medium mb-3 flex items-center gap-1"
          onClick={() => navigate("/researcher/method")}
        >
          ← {t("common.back")}
        </button>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{data.name}</h1>
        <p className="text-gray-600">{data.description}</p>
      </div>

      {/* Method Info Card */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-500 mb-1">{t("method.methodName")}</div>
            <div className="font-semibold text-gray-900">{data.name}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">{t("common.duration")}</div>
            <div className="font-semibold text-gray-900">
              {data.totalDurationDays} {t("common.days")}
            </div>
          </div>
        </div>
      </div>

      {/* Stages Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {t("experimentLog.stages")} ({data.methodStages.length})
        </h2>

        {data.methodStages.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center text-gray-400">
            {t("common.noData")}
          </div>
        ) : (
          data.methodStages.map((stage) => (
            <div key={stage.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Stage Header */}
              <div className="bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-700 text-white font-bold text-sm">
                        {stage.order}
                      </span>
                      <h3 className="text-lg font-bold text-gray-900">
                        {stage.stageDefinition.name}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-700 ml-11">{stage.stageDefinition.description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 ml-4">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                      {stage.durationsDays} {t("common.days")}
                    </span>
                    {stage.isSampleGenerated && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                        {t("experimentLog.canGenerateSample")}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Stage Content */}
              <div className="p-6 space-y-6">
                {/* Materials Section */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    {t("task.materialName")} ({stage.stageMaterials.length})
                  </h4>
                  {stage.stageMaterials.length === 0 ? (
                    <p className="text-sm text-gray-400 ml-7">{t("experimentLog.noMaterials")}</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {stage.stageMaterials.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start gap-2 p-3 rounded-lg bg-gray-50 border border-gray-200"
                        >
                          <span className="inline-block w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {item.material.name}
                            </div>
                            <div className="text-xs text-gray-500">{item.material.category}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Chemicals Section */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                    {t("task.chemicalName")} ({stage.stageChemicals.length})
                  </h4>
                  {stage.stageChemicals.length === 0 ? (
                    <p className="text-sm text-gray-400 ml-7">{t("experimentLog.noChemicals")}</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {stage.stageChemicals.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start gap-2 p-3 rounded-lg bg-indigo-50 border border-indigo-200"
                        >
                          <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0"></span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {item.chemical.name}
                            </div>
                            <div className="text-xs text-gray-500">{item.chemical.category}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
