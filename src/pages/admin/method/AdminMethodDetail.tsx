/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import axiosInstance from "../../../api/axiosInstance";
import { useTranslation } from "react-i18next";

interface Chemical {
  id: number;
  name: string;
  category: string;
  description: string;
  concentrationUnit: string;
}

interface Material {
  id: number;
  name: string;
  category: string;
  description: string;
  unit: string;
}

interface StageChemical {
  id: string;
  chemical: Chemical;
}

interface StageMaterial {
  id: string;
  material: Material;
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
  stageDefinition: StageDefinition;
  stageMaterials: StageMaterial[];
  stageChemicals: StageChemical[];
}

interface Method {
  id: number;
  name: string;
  description: string;
  totalDurationDays: number;
  status?: boolean;
  methodStages: MethodStage[];
}

export default function AdminMethodDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const page = searchParams.get("page") ?? "1";
  const [method, setMethod] = useState<Method | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMethodDetail = async () => {
      if (!id) {
        setError("No method ID provided");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        console.log("Fetching method:", id);
        const response = await axiosInstance.get(`/api/methods/${id}`);
        console.log("Response:", response.data);
        
        // Handle different response structures
        let methodData: Method | null = null;
        
        if (response.data?.value) {
          methodData = response.data.value;
        } else if (response.data) {
          methodData = response.data;
        }
        
        if (methodData) {
          console.log("Method data:", methodData);
          setMethod(methodData);
        } else {
          setError("Invalid response format");
        }
      } catch (err) {
        console.error("Error loading method:", err);
        setError("Failed to load method details");
      } finally {
        setLoading(false);
      }
    };

    void fetchMethodDetail();
  }, [id]);

  if (loading) {
    return (
      <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-gray-200 rounded w-32" />
            <div className="bg-white rounded-xl p-8 space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="h-20 bg-gray-200 rounded" />
                <div className="h-20 bg-gray-200 rounded" />
                <div className="h-20 bg-gray-200 rounded" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-64 bg-gray-200 rounded-xl" />
              <div className="h-64 bg-gray-200 rounded-xl" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !method) {
    return (
      <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 mb-6 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            onClick={() => void navigate(`/admin/method?page=${page}`)}
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t("common.back")}
          </button>
          <div className="bg-white rounded-xl p-16 text-center border border-gray-200">
            <svg
              className="w-16 h-16 text-gray-300 mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-gray-500 font-medium text-lg mb-2">
              {error ?? t("common.noData")}
            </p>
            <p className="text-gray-400 text-sm">
              Không thể tải thông tin phương pháp
            </p>
          </div>
        </div>
      </main>
    );
  }

  const sortedStages = [...method.methodStages].sort((a, b) => a.order - b.order);

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:shadow-sm transition-all"
            onClick={() => void navigate(`/admin/method?page=${page}`)}
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t("common.back")}
          </button>
        </div>

        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                  {method.name}
                </h1>
                <p className="text-gray-600 text-lg leading-relaxed">
                  {method.description}
                </p>
              </div>
              {method.status !== undefined && (
                <div>
                  {method.status ? (
                    <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                      {t("status.active")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
                      <span className="w-2 h-2 bg-gray-400 rounded-full mr-2" />
                      {t("status.inactive")}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tổng thời gian</p>
                  <p className="text-xl font-bold text-gray-900">
                    {method.totalDurationDays} ngày
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Số giai đoạn</p>
                  <p className="text-xl font-bold text-gray-900">
                    {method.methodStages.length}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Trạng thái</p>
                  <p className="text-xl font-bold text-gray-900">
                    {method.status ? "Hoạt động" : "Không hoạt động"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stages */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Các giai đoạn thực hiện
            </h2>
            <div className="space-y-4">
              {sortedStages.map((stage) => (
                <div
                  key={stage.id}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Stage Header */}
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 border-b border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-green-600 text-white rounded-lg flex items-center justify-center font-bold text-lg flex-shrink-0">
                          {stage.order}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {stage.stageDefinition.name}
                          </h3>
                          <p className="text-gray-600">
                            {stage.stageDefinition.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <div className="inline-flex items-center px-4 py-2 bg-white rounded-lg border border-gray-300">
                          <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-semibold text-gray-900">
                            {stage.durationsDays} ngày
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stage Content */}
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Materials */}
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900">
                            Vật liệu ({stage.stageMaterials.length})
                          </h4>
                        </div>
                        {stage.stageMaterials.length > 0 ? (
                          <div className="space-y-3">
                            {stage.stageMaterials.map((sm) => (
                              <div
                                key={sm.id}
                                className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-orange-200 hover:bg-orange-50/30 transition-colors"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <h5 className="font-medium text-gray-900">
                                    {sm.material.name}
                                  </h5>
                                  <span className="text-xs font-medium px-2 py-1 bg-orange-100 text-orange-700 rounded flex-shrink-0 ml-2">
                                    {sm.material.category}
                                  </span>
                                </div>
                                {sm.material.description && (
                                  <p className="text-sm text-gray-600 mb-2">
                                    {sm.material.description}
                                  </p>
                                )}
                                <div className="flex items-center text-xs text-gray-500">
                                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                                  </svg>
                                  Đơn vị: {sm.material.unit}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-gray-50 rounded-lg p-6 text-center border border-gray-200">
                            <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <p className="text-gray-400 text-sm">Không có vật liệu</p>
                          </div>
                        )}
                      </div>

                      {/* Chemicals */}
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-8 h-8 bg-pink-50 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900">
                            Hóa chất ({stage.stageChemicals.length})
                          </h4>
                        </div>
                        {stage.stageChemicals.length > 0 ? (
                          <div className="space-y-3">
                            {stage.stageChemicals.map((sc) => (
                              <div
                                key={sc.id}
                                className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-pink-200 hover:bg-pink-50/30 transition-colors"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <h5 className="font-medium text-gray-900">
                                    {sc.chemical.name}
                                  </h5>
                                  <span className="text-xs font-medium px-2 py-1 bg-pink-100 text-pink-700 rounded flex-shrink-0 ml-2">
                                    {sc.chemical.category}
                                  </span>
                                </div>
                                {sc.chemical.description && (
                                  <p className="text-sm text-gray-600 mb-2">
                                    {sc.chemical.description}
                                  </p>
                                )}
                                <div className="flex items-center text-xs text-gray-500">
                                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                  </svg>
                                  Nồng độ: {sc.chemical.concentrationUnit}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-gray-50 rounded-lg p-6 text-center border border-gray-200">
                            <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                            <p className="text-gray-400 text-sm">Không có hóa chất</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}