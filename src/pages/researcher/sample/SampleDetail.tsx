import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axiosInstance from "../../../api/axiosInstance";
import { useSnackbar } from "notistack";
import { useTranslation } from "react-i18next";
import type {
  ExperimentLogApiResponse,
  SampleDetail,
  SampleLogDetail,
  SampleStageDetail,
  SampleStatus,
  AnalysisResponse,
} from "../../../types/Sample";
import { SampleStatus as SampleStatusValue } from "../../../types/Sample";
import type { UserApiResponse } from "../../../types/Auth";

type PredefinedStage = {
  order: number;
  nameKey: string;
  minDurationDays: number;
  maxDurationDays: number;
  descriptionKey: string;
  keywords: string[];
};

const STATUS_COLOR_MAP: Record<SampleStatus, string> = {
  [SampleStatusValue.Created]: "bg-blue-100 text-blue-800",
  [SampleStatusValue.InProgressed]: "bg-yellow-100 text-yellow-800",
  [SampleStatusValue.Completed]: "bg-green-100 text-green-800",
  [SampleStatusValue.ExecutedBecauseOfDisease]: "bg-red-100 text-red-800",
  [SampleStatusValue.ConvertedToSeedling]: "bg-purple-100 text-purple-800",
};

const PREDEFINED_STAGES: PredefinedStage[] = [
  {
    order: 1,
    nameKey: "sample.stageTemplates.stage1Name",
    minDurationDays: 14,
    maxDurationDays: 30,
    descriptionKey: "sample.stageTemplates.stage1Description",
    keywords: ["giai doan mam", "mam", "tissue"],
  },
  {
    order: 2,
    nameKey: "sample.stageTemplates.stage2Name",
    minDurationDays: 21,
    maxDurationDays: 45,
    descriptionKey: "sample.stageTemplates.stage2Description",
    keywords: ["giai doan choi", "choi", "coppice"],
  },
  {
    order: 3,
    nameKey: "sample.stageTemplates.stage3Name",
    minDurationDays: 21,
    maxDurationDays: 35,
    descriptionKey: "sample.stageTemplates.stage3Description",
    keywords: ["giai doan cay hoan chinh", "cay hoan chinh", "tree"],
  },
];

const formatDate = (value?: string | null): string => {
  if (!value) return "";
  return new Date(value).toLocaleDateString("vi-VN");
};

const normalizeStageList = (
  sampleStageDto: SampleDetail["sampleStageDto"]
): SampleStageDetail[] => {
  if (!sampleStageDto) return [];
  if (Array.isArray(sampleStageDto)) return sampleStageDto;
  return [sampleStageDto];
};

const resolveImageUrl = (imageUrl?: string | null): string => {
  if (!imageUrl) return "";
  if (/^https?:\/\//i.test(imageUrl) || imageUrl.startsWith("data:")) {
    return imageUrl;
  }

  const baseUrl = axiosInstance.defaults.baseURL ?? "";
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const normalizedImageUrl = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
  return `${normalizedBaseUrl}${normalizedImageUrl}`;
};

const normalizeText = (value?: string | null): string => {
  if (!value) return "";
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
};

const isStageMatched = (stage: SampleStageDetail, predefinedStage: PredefinedStage): boolean => {
  if (stage.sampleStageDefinition?.order === predefinedStage.order) {
    return true;
  }

  const stageDefinitionName = normalizeText(stage.sampleStageDefinition?.name);
  const currentSampleStage = normalizeText(stage.currentSampleStage);

  return predefinedStage.keywords.some(
    (keyword) =>
      stageDefinitionName.includes(keyword) || currentSampleStage.includes(keyword)
  );
};

export default function SampleDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation();

  // Get navigation source from location state
  const navigationSource = location.state as { from?: 'researcherExperimentLogDetail'; experimentLogId?: string } | null;

  const [sample, setSample] = useState<SampleDetail | null>(null);
  const [experimentLogMap, setExperimentLogMap] = useState<Record<string, string>>(
    {}
  );
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [showDestroyForm, setShowDestroyForm] = useState(false);
  const [destroyReason, setDestroyReason] = useState("");
  const [isDestroying, setIsDestroying] = useState(false);

  const stageNameMap: Record<string, string> = {
    "coppice": "Chồi",
    "tissue": "Mầm",
    "tree": "Cây hoàn chỉnh"
  };

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);

      try {
        const [sampleResponse, experimentLogsResponse, usersResponse] = await Promise.all([
          axiosInstance.get(`/api/samples/${id}`),
          axiosInstance.get<ExperimentLogApiResponse>(
            "/api/experiment-logs?PageNo=1&PageSize=1000"
          ),
          axiosInstance.get<UserApiResponse>(
            "/api/user?PageNumber=1&PageSize=1000"
          ),
        ]);

        const sampleData = (sampleResponse?.data?.value ??
          sampleResponse?.data) as SampleDetail;

        const logs = experimentLogsResponse.data.data ?? [];
        const mapping: Record<string, string> = {};
        logs.forEach((log) => {
          mapping[log.id] = log.name;
        });

        const users = usersResponse.data.data ?? [];
        const userMapping: Record<string, string> = {};
        users.forEach((user) => {
          userMapping[user.id] = user.name;
        });

        setExperimentLogMap(mapping);
        setUserMap(userMapping);
        setSample(sampleData);
      } catch {
        setError("Không thể tải chi tiết mẫu thí nghiệm");
        enqueueSnackbar("Lỗi khi tải dữ liệu", { variant: "error" });
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [id, enqueueSnackbar]);

  const handleBack = () => {
    // Navigate back to researcher experiment log detail
    if (navigationSource?.from === 'researcherExperimentLogDetail' && navigationSource.experimentLogId) {
      navigate(`/experiment-log/${navigationSource.experimentLogId}`);
    } else {
      // Default fallback to experiment logs list
      navigate("/experiment-log");
    }
  };

  const handleAnalyzeDisease = async () => {
    setShowImageModal(true);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadAndAnalyze = async () => {
    if (!id || !selectedImage) return;

    setAnalyzing(true);
    try {
      // Perform analysis
      const analysisFormData = new FormData();
      analysisFormData.append("image", selectedImage);

      const analysisStart = performance.now();
      const result = await axiosInstance.post<AnalysisResponse>(
        "/api/monitoring-log/analysis",
        analysisFormData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      const analysisEnd = performance.now();
      const analysisTime = Math.round(analysisEnd - analysisStart);
      console.log(`Analysis took ${analysisTime}ms`);

      setAnalysisResult(result.data);
      setShowAnalysisModal(true);
      setShowImageModal(false);
      setSelectedImage(null);
      setImagePreview("");
      enqueueSnackbar(t("common.success"), { variant: "success" });
    } catch (err) {
      console.error("Error analyzing disease:", err);
      enqueueSnackbar(t("common.error"), { variant: "error" });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCancelImageModal = () => {
    setShowImageModal(false);
    setSelectedImage(null);
    setImagePreview("");
  };

  const isHealthyAnalysis = useMemo(() => {
    if (!analysisResult) return true;

    const diseaseCode = analysisResult.disease?.code?.toLowerCase() ?? "";
    const diseaseName = analysisResult.disease?.name?.toLowerCase() ?? "";

    if (diseaseCode.includes("healthy") || diseaseName.includes("healthy") || diseaseName.includes("khỏe")) {
      return true;
    }

    const values = Object.entries(analysisResult.analyticResult)
      .filter(([key]) => key !== "healthy")
      .map(([, value]) => value as number);
    const maxNonHealthy = values.length > 0 ? Math.max(...values) : 0;

    return analysisResult.analyticResult.healthy >= maxNonHealthy;
  }, [analysisResult]);

  const handleDestroySample = async () => {
    if (!id || !analysisResult || isDestroying) return;

    const finalReason = destroyReason.trim() || `Mẫu vật nhiễm ${analysisResult.disease.name}`;
    setIsDestroying(true);

    try {
      await axiosInstance.delete(`/api/samples/${id}`, {
        data: { reason: finalReason },
      });

      enqueueSnackbar("Tiêu hủy mẫu vật thành công", { variant: "success" });
      setShowDestroyForm(false);
      setDestroyReason("");
      setShowAnalysisModal(false);
      handleBack();
    } catch {
      enqueueSnackbar("Không thể tiêu hủy mẫu vật", { variant: "error" });
    } finally {
      setIsDestroying(false);
    }
  };

  const getStatusLabel = (status: SampleStatus): string => {
    const statusMap: Record<SampleStatus, string> = {
      [SampleStatusValue.Created]: t("sample.statusCreated"),
      [SampleStatusValue.InProgressed]: t("sample.statusInProgressed"),
      [SampleStatusValue.Completed]: t("sample.statusCompleted"),
      [SampleStatusValue.ExecutedBecauseOfDisease]: t(
        "sample.statusExecutedBecauseOfDisease"
      ),
      [SampleStatusValue.ConvertedToSeedling]: t("sample.statusConvertedToSeedling"),
    };
    return statusMap[status] || status;
  };

  const metadataRows = useMemo(() => {
    if (!sample) return [];

    return [
      { label: t("sample.createdBy"), value: userMap[sample.createdBy ?? ""] || sample.createdBy || "" },
      { label: t("sample.createdDate"), value: formatDate(sample.createdDate) },
      { label: t("sample.updatedBy"), value: userMap[sample.updatedBy ?? ""] || sample.updatedBy || "" },
      { label: t("sample.updatedDate"), value: formatDate(sample.updatedDate) },
      { label: t("sample.executionDate"), value: formatDate(sample.executionDate) },
    ].filter((item) => item.value);
  }, [sample, userMap, t]);

  const sampleStages = useMemo(
    () => normalizeStageList(sample?.sampleStageDto ?? null),
    [sample?.sampleStageDto]
  );

  const latestStage = useMemo(() => {
    if (sampleStages.length === 0) return null;

    return [...sampleStages].sort(
      (a, b) => new Date(b.startAt ?? "").getTime() - new Date(a.startAt ?? "").getTime()
    )[0];
  }, [sampleStages]);

  const currentStageLabel = latestStage?.currentSampleStage || "-";
  const latestImageUrl = resolveImageUrl(latestStage?.latestImageUrl);
  const reportRows: SampleLogDetail[] = latestStage?.logDetailDtos ?? [];

  const stageProgressRows = useMemo(() => {
    const currentStageOrder = latestStage?.sampleStageDefinition?.order ?? null;

    return PREDEFINED_STAGES.map((predefinedStage) => {
      const matchedStage = sampleStages.find((stage) =>
        isStageMatched(stage, predefinedStage)
      );
      const hasReport = (matchedStage?.logDetailDtos?.length ?? 0) > 0;
      const stageImageUrl = resolveImageUrl(matchedStage?.latestImageUrl);
      const hasImage = Boolean(stageImageUrl);

      let progressLabel = t("sample.stageProgress.future");
      let progressClass = "bg-blue-100 text-blue-800";

      if (matchedStage) {
        progressLabel = t("sample.stageProgress.hasData");
        progressClass = "bg-green-100 text-green-800";
      }

      if (currentStageOrder != null) {
        if (predefinedStage.order < currentStageOrder) {
          progressLabel = t("sample.stageProgress.passed");
          progressClass = "bg-emerald-100 text-emerald-800";
        } else if (predefinedStage.order === currentStageOrder) {
          progressLabel = t("sample.stageProgress.current");
          progressClass = "bg-yellow-100 text-yellow-800";
        }
      }

      return {
        predefinedStage,
        matchedStage,
        hasReport,
        hasImage,
        stageImageUrl,
        progressLabel,
        progressClass,
      };
    });
  }, [sampleStages, latestStage, t]);

  if (loading) {
    return (
      <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </main>
    );
  }

  if (error || !sample) {
    return (
      <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Không tìm thấy dữ liệu"}</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
          >
            Quay lại
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 flex flex-col items-center py-10 px-6 lg:px-8">
      <div className="bg-white rounded-xl px-8 pt-8 pb-8 shadow-[0_2px_8px_rgba(0,0,0,0.06)] w-full max-w-[1200px] mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Chi tiết mẫu thí nghiệm: {sample.name}</h2>
          <div className="flex gap-3">
            {sample.status !== SampleStatusValue.ExecutedBecauseOfDisease && (
              <button
                onClick={handleAnalyzeDisease}
                disabled={analyzing}
                className={`px-4 py-2 rounded-lg transition-colors font-medium text-white ${
                  analyzing
                    ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {analyzing ? t("sample.analyzing") : t("sample.analyzeDisease")}
              </button>
            )}
            <span
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                STATUS_COLOR_MAP[sample.status] || "bg-gray-100 text-gray-800"
              }`}
            >
              {getStatusLabel(sample.status)}
            </span>
          </div>
        </div>

        <section className="mb-6 border border-gray-200 rounded-lg p-5">
          <h3 className="text-lg font-semibold mb-4">Thông tin người làm</h3>
          {metadataRows.length === 0 ? (
            <p className="text-sm text-gray-500">Không có thông tin hiển thị</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {metadataRows.map((row) => (
                <div key={row.label} className="flex flex-col">
                  <label className="font-medium mb-1.5">{row.label}</label>
                  <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                    {row.value}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mb-6 border border-gray-200 rounded-lg p-5">
          <h3 className="text-lg font-semibold mb-4">Thông tin cơ bản</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="font-medium mb-1.5">Tên mẫu</label>
              <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                {sample.name}
              </div>
            </div>
            <div className="flex flex-col">
              <label className="font-medium mb-1.5">Thí nghiệm</label>
              <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                {experimentLogMap[sample.experimentLogId] || sample.experimentLogId}
              </div>
            </div>
            <div className="flex flex-col">
              <label className="font-medium mb-1.5">Giai đoạn phát triển hiện tại</label>
              <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                {currentStageLabel}
              </div>
            </div>
            <div className="flex flex-col">
              <label className="font-medium mb-1.5">Ghi chú</label>
              <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                {sample.notes || "-"}
              </div>
            </div>
          </div>
        </section>

        <section className="mb-6 border border-gray-200 rounded-lg p-5">
          <h3 className="text-lg font-semibold mb-4">{t("sample.stageProgress.title")}</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {stageProgressRows.map((row) => {
              const {
                predefinedStage,
                matchedStage,
                hasReport,
                hasImage,
                stageImageUrl,
                progressLabel,
                progressClass,
              } = row;
              return (
                <article key={predefinedStage.order} className="border border-gray-200 rounded-lg p-4 bg-white h-full">
                  <div className="flex items-start justify-between gap-2 mb-2 min-h-[64px]">
                    <h4 className="font-semibold text-gray-900 leading-6 pr-2 min-h-[48px]">
                      {predefinedStage.order}. {t(predefinedStage.nameKey)}
                    </h4>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium text-center leading-4 min-w-[112px] ${progressClass}`}
                    >
                      {progressLabel}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-3 min-h-[56px]">{t(predefinedStage.descriptionKey)}</p>

                  <div className="mb-3 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
                    {hasImage ? (
                      <img
                        src={stageImageUrl}
                        alt={`${t(predefinedStage.nameKey)} image`}
                        className="w-full h-32 object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-32 flex items-center justify-center text-sm text-gray-500">
                        {t("sample.stageProgress.noImage")}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">{t("sample.stageProgress.standardDuration")}</span>
                      <span className="text-gray-800 font-medium">
                        {predefinedStage.minDurationDays} - {predefinedStage.maxDurationDays} {t("common.days")}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">{t("sample.stageProgress.actualStartDate")}</span>
                      <span className="text-gray-800 font-medium">
                        {formatDate(matchedStage?.startAt) || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">{t("sample.stageProgress.report")}</span>
                      <span className={`font-medium ${hasReport ? "text-green-700" : "text-gray-500"}`}>
                        {hasReport ? t("sample.stageProgress.available") : t("sample.stageProgress.notAvailable")}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">{t("sample.stageProgress.stageImage")}</span>
                      <span className={`font-medium ${hasImage ? "text-green-700" : "text-gray-500"}`}>
                        {hasImage ? t("sample.stageProgress.available") : t("sample.stageProgress.notAvailable")}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">{t("sample.stageProgress.systemStatus")}</span>
                      <span className="text-gray-800 font-medium">
                        {matchedStage?.status ? getStatusLabel(matchedStage.status) : "-"}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mb-6 border border-gray-200 rounded-lg p-5">
          <h3 className="text-lg font-semibold mb-4">{t("sample.latestImageTitle")}</h3>
          {!latestImageUrl ? (
            <p className="text-sm text-gray-500">{t("sample.noLatestImage")}</p>
          ) : (
            <div className="w-full max-w-xl rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
              <img
                src={latestImageUrl}
                alt={`Latest sample stage of ${sample.name}`}
                className="w-full h-auto object-cover"
                loading="lazy"
                onError={(event) => {
                  const target = event.currentTarget;
                  target.style.display = "none";
                }}
              />
            </div>
          )}
        </section>

        <section className="mb-6 border border-gray-200 rounded-lg p-5">
          <h3 className="text-lg font-semibold mb-4">{t("sample.currentStageReportTitle")}</h3>
          {reportRows.length === 0 ? (
            <p className="text-sm text-gray-500">Không có dữ liệu báo cáo</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-3 text-sm font-semibold text-gray-900">STT</th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-900">Chỉ số</th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-900">Giá trị đo</th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-900">Kỳ vọng</th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-900">Khoảng chuẩn</th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-900">Đơn vị</th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-900">Kết quả</th>
                  </tr>
                </thead>
                <tbody>
                  {reportRows.map((row, index) => {
                    const req = row.stageRequirementDefinitionDto;
                    const sampleReq = req.sampleRequirementDefinitionDto;

                    return (
                      <tr key={row.id} className="border-b">
                        <td className="p-3 text-sm text-gray-800">{index + 1}</td>
                        <td className="p-3 text-sm text-gray-800">{sampleReq.name}</td>
                        <td className="p-3 text-sm text-gray-800">{row.measuredValue}</td>
                        <td className="p-3 text-sm text-gray-800">{req.expectedValue}</td>
                        <td className="p-3 text-sm text-gray-800">
                          {req.minValue} - {req.maxValue}
                        </td>
                        <td className="p-3 text-sm text-gray-800">{sampleReq.unit || "-"}</td>
                        <td className="p-3 text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              row.isMatch
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {row.isMatch ? "Đạt" : "Không đạt"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="flex justify-end pt-4 border-t">
          <button
            type="button"
            className="min-w-[90px] px-5 py-2 rounded-lg border-none text-base font-semibold cursor-pointer transition-colors duration-200 bg-gray-300 text-gray-800 hover:bg-gray-400"
            onClick={handleBack}
          >
            Quay lại
          </button>
        </div>
      </div>

      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="border-b p-6 flex justify-between items-center">
              <h3 className="text-lg font-semibold">{t("sample.selectImage")}</h3>
              <button
                onClick={handleCancelImageModal}
                disabled={analyzing}
                className="text-gray-500 hover:text-gray-700 text-2xl disabled:cursor-not-allowed"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              {imagePreview ? (
                <div className="space-y-4">
                  <div className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedImage(null);
                        setImagePreview("");
                      }}
                      disabled={analyzing}
                      className="w-full px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                    >
                      {t("common.change")}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <label className="flex flex-col items-center justify-center cursor-pointer gap-2">
                    <svg
                      className="w-12 h-12 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    <span className="text-sm text-gray-600">{t("common.uploadImage")}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      disabled={analyzing}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="border-t p-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCancelImageModal}
                disabled={analyzing}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={handleUploadAndAnalyze}
                disabled={!selectedImage || analyzing}
                className={`px-4 py-2 text-sm rounded-lg text-white font-medium transition-colors ${
                  selectedImage && !analyzing
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
              >
                {analyzing ? t("sample.analyzing") : t("common.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAnalysisModal && analysisResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
              <h3 className="text-xl font-semibold">{t("sample.analysisResults")}</h3>
              <button
                onClick={() => {
                  setShowAnalysisModal(false);
                  setShowDestroyForm(false);
                  setDestroyReason("");
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-medium text-sm text-gray-600">Giai đoạn</label>
                  <p className="mt-1 text-gray-900">{stageNameMap[analysisResult.stageName] || analysisResult.stageName}</p>
                </div>
                <div>
                  <label className="font-medium text-sm text-gray-600">Tên bệnh</label>
                  <p className="mt-1 text-gray-900">{analysisResult.disease.name}</p>
                </div>
              </div>

              <div>
                <label className="font-medium text-sm text-gray-600">Mô tả bệnh</label>
                <p className="mt-1 text-gray-900">{analysisResult.disease.description}</p>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Kết quả phân tích chi tiết</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { key: "healthy", label: t("sample.healthy") },
                    { key: "anthracnose", label: t("sample.anthracnose") },
                    { key: "bacterialWilt", label: t("sample.bacterialWilt") },
                    { key: "blackrot", label: t("sample.blackrot") },
                    { key: "brownspots", label: t("sample.brownspots") },
                    { key: "moldBacterial", label: t("sample.moldBacterial") },
                    { key: "moldFungus", label: t("sample.moldFungus") },
                    { key: "softRot", label: t("sample.softRot") },
                    { key: "stemRot", label: t("sample.stemRot") },
                    { key: "witheredYellowRoot", label: t("sample.witheredYellowRoot") },
                    { key: "oxidation", label: t("sample.oxidation") },
                    { key: "virus", label: t("sample.virus") },
                  ].map((item) => (
                    <div key={item.key} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-800">{item.label}</span>
                      <span className="font-semibold text-blue-600">
                        {((analysisResult.analyticResult[item.key as keyof typeof analysisResult.analyticResult] as number) * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {!isHealthyAnalysis && (
                <div className="border border-red-200 bg-red-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-red-700 font-medium">
                      Mẫu vật có dấu hiệu bệnh. Bạn có thể tiêu hủy mẫu vật này.
                    </p>
                    {!showDestroyForm && (
                      <button
                        type="button"
                        onClick={() => setShowDestroyForm(true)}
                        className="px-3 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                      >
                        Tiêu hủy mẫu vật
                      </button>
                    )}
                  </div>

                  {showDestroyForm && (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Lý do tiêu hủy (có thể để trống)</label>
                        <textarea
                          value={destroyReason}
                          onChange={(e) => setDestroyReason(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
                          placeholder={`Mặc định: Mẫu vật nhiễm ${analysisResult.disease.name}`}
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowDestroyForm(false);
                            setDestroyReason("");
                          }}
                          disabled={isDestroying}
                          className="px-3 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDestroySample()}
                          disabled={isDestroying}
                          className="px-3 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                        >
                          {isDestroying ? "Đang xử lý..." : "Xác nhận tiêu hủy"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="border-t p-6 flex justify-end">
              <button
                onClick={() => {
                  setShowAnalysisModal(false);
                  setShowDestroyForm(false);
                  setDestroyReason("");
                }}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors"
              >
                {t("common.close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
