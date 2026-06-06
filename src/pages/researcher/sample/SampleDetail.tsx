/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable react-dom/no-missing-button-type */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/consistent-type-definitions */
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Loader2, Microscope, X } from "lucide-react";
import { useDiseaseMap } from "../../../utils/useDiseaseMap";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axiosInstance from "../../../api/axiosInstance";
import { useSnackbar } from "notistack";
import { useTranslation } from "react-i18next";
import "./SampleDetail.css";
import { useAuth } from "../../../context/AuthContext";
import { getApiErrorMessage } from "../../../utils/apiError";
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
  sampleStageDto: SampleDetail["sampleStageDto"],
): SampleStageDetail[] => {
  if (!sampleStageDto) return [];
  if (Array.isArray(sampleStageDto)) return sampleStageDto;
  return [sampleStageDto];
};

const resolveImageUrl = (imageUrl?: string | null): string => {
  if (!imageUrl) return "";
  if (/^https?:\/\//i.test(imageUrl) ?? imageUrl.startsWith("data:")) {
    return imageUrl;
  }

  const baseUrl = axiosInstance.defaults.baseURL ?? "";
  const normalizedBaseUrl = baseUrl.endsWith("/")
    ? baseUrl.slice(0, -1)
    : baseUrl;
  const normalizedImageUrl = imageUrl.startsWith("/")
    ? imageUrl
    : `/${imageUrl}`;
  return `${normalizedBaseUrl}${normalizedImageUrl}`;
};

export default function SampleDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation();
  const { user } = useAuth();

  // Get navigation source from location state
  const navigationSource = location.state as {
    from?: "researcherExperimentLogDetail";
    experimentLogId?: string;
  } | null;

  const [sample, setSample] = useState<SampleDetail | null>(null);
  const [experimentLogMap, setExperimentLogMap] = useState<
    Record<string, string>
  >({});
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(
    null,
  );
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [showDestroyForm, setShowDestroyForm] = useState(false);
  const [destroyReason, setDestroyReason] = useState("");
  const [isDestroying, setIsDestroying] = useState(false);
  const [isChangingStage, setIsChangingStage] = useState(false);

  // Thêm state cho tính năng chuyển đổi thành cây giống
  const [showConvertForm, setShowConvertForm] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [convertFormData, setConvertFormData] = useState({
    localName: "",
    scientificName: "",
    description: "",
  });

  const loadSampleDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    try {
      const [sampleResponse, experimentLogsResponse, usersResponse] =
        await Promise.all([
          axiosInstance.get(`/api/samples/${id}`),
          axiosInstance.get<ExperimentLogApiResponse>(
            "/api/experiment-logs?PageNo=1&PageSize=1000",
          ),
          axiosInstance.get<UserApiResponse>(
            "/api/user?PageNumber=1&PageSize=1000",
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
  }, [id, enqueueSnackbar]);

  useEffect(() => {
    void loadSampleDetail();
  }, [loadSampleDetail]);

  const handleBack = () => {
    // Navigate back to researcher experiment log detail
    if (
      navigationSource?.from === "researcherExperimentLogDetail" &&
      navigationSource.experimentLogId
    ) {
      navigate(
        `/researcher/experiment-log/${navigationSource.experimentLogId}`,
      );
    } else {
      // Default fallback to experiment logs list
      navigate("/researcher/experiment-log");
    }
  };

  const handleAnalyzeDisease = () => {
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
        },
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

  // Kiểm tra kết quả healthy: topDisease là "healthy", hoặc unknown nhưng rawTopDisease cũng là healthy
  const isHealthyAnalysis = useMemo(() => {
    if (!analysisResult) return true;
    const topDisease = String(analysisResult.analyticResult.topDisease ?? "").toLowerCase();
    if (topDisease === "healthy") return true;
    // Nếu topDisease là "unknown" do bệnh inactive, kiểm tra rawTopDisease
    if (topDisease === "unknown") {
      const rawTop = String(analysisResult.rawTopDisease ?? "").toLowerCase();
      if (rawTop === "healthy") return true;
    }
    return false;
  }, [analysisResult]);

  // Kiểm tra trường hợp bệnh phát hiện nhưng chưa active trong hệ thống
  const isInactiveDisease = useMemo(() => {
    if (!analysisResult) return false;
    return (
      analysisResult.isRawTopDiseaseActive === false &&
      String(analysisResult.analyticResult.topDisease ?? "").toLowerCase() === "unknown"
    );
  }, [analysisResult]);

  // Tính confidence hiển thị: nếu confidence = 0 do bệnh inactive, lấy từ predictions
  const displayConfidence = useMemo(() => {
    if (!analysisResult) return 0;
    if (analysisResult.analyticResult.confidence > 0) {
      return analysisResult.analyticResult.confidence;
    }
    // Confidence = 0 có thể do bệnh inactive — tìm giá trị từ predictions theo rawTopDisease
    if (analysisResult.rawTopDisease) {
      const rawNormalized = analysisResult.rawTopDisease
        .replace(/_/g, "")
        .toLowerCase();
      const matchedKey = Object.keys(
        analysisResult.analyticResult.predictions ?? {},
      ).find((k) =>
        k.replace(/\s*\(inactive\)\s*/gi, "").replace(/_/g, "").toLowerCase() ===
        rawNormalized,
      );
      if (matchedKey) {
        return analysisResult.analyticResult.predictions[matchedKey] ?? 0;
      }
    }
    return 0;
  }, [analysisResult]);

  const onnxNameMap = useDiseaseMap();

  const handleDestroySample = async () => {
    if (!id || !analysisResult || isDestroying) return;

    const finalReason =
      destroyReason.trim() ?? `Mẫu vật nhiễm ${analysisResult.disease.name}`;
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

  // Hàm xử lý chuyển đổi thành cây giống
  const handleConvertToSeedling = async () => {
    if (!id || isConverting) return;

    if (
      !convertFormData.localName.trim() ||
      !convertFormData.scientificName.trim()
    ) {
      enqueueSnackbar("Vui lòng nhập đầy đủ Tên địa phương và Tên khoa học", {
        variant: "warning",
      });
      return;
    }

    setIsConverting(true);
    try {
      await axiosInstance.put(`/api/samples/${id}/convert-to-seedling`, {
        localName: convertFormData.localName.trim(),
        scientificName: convertFormData.scientificName.trim(),
        description: convertFormData.description.trim() || undefined,
      });

      enqueueSnackbar("Chuyển mẫu vật thành cây giống thành công", {
        variant: "success",
      });
      setShowConvertForm(false);

      // Reset form
      setConvertFormData({
        localName: "",
        scientificName: "",
        description: "",
      });

      // Reload để cập nhật trạng thái mới
      await loadSampleDetail();
    } catch (error) {
      enqueueSnackbar(
        getApiErrorMessage(error, "Không thể chuyển đổi thành cây giống"),
        { variant: "error" },
      );
    } finally {
      setIsConverting(false);
    }
  };

  const getStatusLabel = (status: SampleStatus): string => {
    const statusMap: Record<SampleStatus, string> = {
      [SampleStatusValue.Created]: t("sample.statusCreated"),
      [SampleStatusValue.InProgressed]: t("sample.statusInProgressed"),
      [SampleStatusValue.Completed]: t("sample.statusCompleted"),
      [SampleStatusValue.ExecutedBecauseOfDisease]: t(
        "sample.statusExecutedBecauseOfDisease",
      ),
      [SampleStatusValue.ConvertedToSeedling]: t(
        "sample.statusConvertedToSeedling",
      ),
    };
    return statusMap[status] ?? status;
  };

  const metadataRows = useMemo(() => {
    if (!sample) return [];

    return [
      {
        label: t("sample.createdBy"),
        value: userMap[sample.createdBy ?? ""] ?? sample.createdBy ?? "",
      },
      { label: t("sample.createdDate"), value: formatDate(sample.createdDate) },
      {
        label: t("sample.updatedBy"),
        value: userMap[sample.updatedBy ?? ""] ?? sample.updatedBy ?? "",
      },
      { label: t("sample.updatedDate"), value: formatDate(sample.updatedDate) },
      {
        label: t("sample.executionDate"),
        value: formatDate(sample.executionDate),
      },
    ].filter((item) => item.value);
  }, [sample, userMap, t]);

  const sampleStages = useMemo(
    () => normalizeStageList(sample?.sampleStageDto ?? null),
    [sample?.sampleStageDto],
  );

  const latestStage = useMemo(() => {
    if (sampleStages.length === 0) return null;
    const inProgressStage = sampleStages.find(
      (stage) => stage.status === SampleStatusValue.InProgressed,
    );
    if (inProgressStage) return inProgressStage;
    return sampleStages[sampleStages.length - 1];
  }, [sampleStages]);

  // Lấy currentStageLabel từ sample.currentSampleStage
  const currentStageLabel = sample?.currentSampleStage ?? "-";
  const latestImageUrl = resolveImageUrl(latestStage?.latestImageUrl);
  const reportRows: SampleLogDetail[] = latestStage?.logDetailDtos ?? [];
  const hasApprovedLogForCurrentStage = reportRows.length > 0;
  const isLastStage =
    latestStage?.sampleStageDefinition?.order ===
    Math.max(...PREDEFINED_STAGES.map((s) => s.order));
  const lastStageOrder = Math.max(...PREDEFINED_STAGES.map((s) => s.order));
  const lastStage = sampleStages.find(
    (stage) => stage.sampleStageDefinition?.order === lastStageOrder,
  );
  const hasReportForLastStage = (lastStage?.logDetailDtos?.length ?? 0) > 0;
  const allStagesCompleted = PREDEFINED_STAGES.every((pre) => {
    const stage = sampleStages.find(
      (s) =>
        s.sampleStageDefinition?.order === pre.order &&
        s.status === SampleStatusValue.Completed,
    );
    return stage && (stage.logDetailDtos?.length ?? 0) > 0;
  });
  const canChangeStage =
    user?.roleId === 2 &&
    sample?.status !== SampleStatusValue.ConvertedToSeedling &&
    sample?.status !== SampleStatusValue.ExecutedBecauseOfDisease &&
    hasApprovedLogForCurrentStage;
  const canConvertToSeedling =
    user?.roleId === 2 &&
    allStagesCompleted &&
    sample?.status !== SampleStatusValue.ConvertedToSeedling &&
    sample?.status !== SampleStatusValue.ExecutedBecauseOfDisease;

  // Tiến trình giai đoạn nuôi cấy: không sort, lấy đúng thứ tự sampleStages từ API
  const stageProgressRows = useMemo(() => {
    return sampleStages.map((stage) => {
      const predefinedStage = PREDEFINED_STAGES.find(
        (pre) => pre.order === stage.sampleStageDefinition?.order,
      );
      const hasReport = (stage.logDetailDtos?.length ?? 0) > 0;
      const stageImageUrl = resolveImageUrl(stage.latestImageUrl);
      const hasImage = Boolean(stageImageUrl);
      // Status lấy trực tiếp từ stage.status
      let progressLabel = t("sample.stageProgress.future");
      let progressClass = "bg-blue-100 text-blue-800";
      if (stage.status === SampleStatusValue.Completed) {
        progressLabel = t("sample.stageProgress.passed");
        progressClass = "bg-emerald-100 text-emerald-800";
      } else if (stage.status === SampleStatusValue.InProgressed) {
        progressLabel = t("sample.stageProgress.current");
        progressClass = "bg-yellow-100 text-yellow-800";
      } else if (hasReport) {
        progressLabel = t("sample.stageProgress.hasData");
        progressClass = "bg-green-100 text-green-800";
      }
      return {
        predefinedStage,
        matchedStage: stage,
        hasReport,
        hasImage,
        stageImageUrl,
        progressLabel,
        progressClass,
      };
    });
  }, [sampleStages, t]);

  const handleChangeStage = async () => {
    if (!id || !canChangeStage || isChangingStage) return;

    setIsChangingStage(true);
    try {
      await axiosInstance.put(`/api/samples/${id}/stage`);
      enqueueSnackbar("Chuyển giai đoạn mẫu thành công", {
        variant: "success",
      });
      await loadSampleDetail();
    } catch (error) {
      enqueueSnackbar(
        getApiErrorMessage(error, "Không thể chuyển giai đoạn mẫu"),
        { variant: "error" },
      );
    } finally {
      setIsChangingStage(false);
    }
  };

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

  if (error ?? !sample) {
    return (
      <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">
            {error ?? "Không tìm thấy dữ liệu"}
          </p>
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
    <main className="sample-detail-page ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 flex flex-col items-center py-10 px-6 lg:px-8">
      <div className="bg-white rounded-xl px-8 pt-8 pb-8 shadow-[0_2px_8px_rgba(0,0,0,0.06)] w-full max-w-[1200px] mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">
            Chi tiết mẫu thí nghiệm: {sample.name}
          </h2>
          <div className="flex gap-3">
            {/* Ẩn CHỈ nút chuyển giai đoạn/hoàn thành mẫu vật nếu giai đoạn cuối đã hoàn thành */}
            {canConvertToSeedling && (
              <button
                type="button"
                onClick={() => setShowConvertForm(true)}
                disabled={isConverting}
                className="px-4 py-2 rounded-lg transition-colors font-medium text-white bg-purple-600 hover:bg-purple-700"
              >
                Chuyển thành cây giống
              </button>
            )}
            {!(
              isLastStage && latestStage?.status === SampleStatusValue.Completed
            ) && (
              <button
                type="button"
                onClick={() => void handleChangeStage()}
                disabled={!canChangeStage || isChangingStage}
                className={`px-4 py-2 rounded-lg transition-colors font-medium text-white ${
                  canChangeStage && !isChangingStage
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
              >
                {isChangingStage
                  ? "Đang chuyển..."
                  : isLastStage && hasReportForLastStage
                    ? "Hoàn thành mẫu vật"
                    : "Chuyển giai đoạn"}
              </button>
            )}
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
              className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                STATUS_COLOR_MAP[sample.status] ?? "bg-gray-100 text-gray-800"
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
                {experimentLogMap[sample.experimentLogId] ??
                  sample.experimentLogId}
              </div>
            </div>
            <div className="flex flex-col">
              <label className="font-medium mb-1.5">
                Giai đoạn phát triển hiện tại
              </label>
              <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                {currentStageLabel}
              </div>
            </div>
            <div className="flex flex-col">
              <label className="font-medium mb-1.5">Ghi chú</label>
              <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                {sample.notes ?? "-"}
              </div>
            </div>
          </div>
        </section>

        <section className="mb-6 border border-gray-200 rounded-lg p-5">
          <h3 className="text-lg font-semibold mb-4">
            {t("sample.stageProgress.title")}
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {stageProgressRows.map((row, idx) => {
              const {
                predefinedStage,
                matchedStage,
                hasReport,
                hasImage,
                stageImageUrl,
                progressLabel,
                progressClass,
              } = row;
              if (!predefinedStage) return null;
              return (
                <article
                  key={predefinedStage.order ?? idx}
                  className="border border-gray-200 rounded-lg p-4 bg-white h-full"
                >
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

                  <p className="text-sm text-gray-600 mb-3 min-h-[56px]">
                    {t(predefinedStage.descriptionKey)}
                  </p>

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
                      <span className="text-gray-500">
                        {t("sample.stageProgress.standardDuration")}
                      </span>
                      <span className="text-gray-800 font-medium">
                        {predefinedStage.minDurationDays} -{" "}
                        {predefinedStage.maxDurationDays} {t("common.days")}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">
                        {t("sample.stageProgress.actualStartDate")}
                      </span>
                      <span className="text-gray-800 font-medium">
                        {formatDate(matchedStage?.startAt) ?? "-"}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">
                        {t("sample.stageProgress.report")}
                      </span>
                      <span
                        className={`font-medium ${hasReport ? "text-green-700" : "text-gray-500"}`}
                      >
                        {hasReport
                          ? t("sample.stageProgress.available")
                          : t("sample.stageProgress.notAvailable")}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">
                        {t("sample.stageProgress.stageImage")}
                      </span>
                      <span
                        className={`font-medium ${hasImage ? "text-green-700" : "text-gray-500"}`}
                      >
                        {hasImage
                          ? t("sample.stageProgress.available")
                          : t("sample.stageProgress.notAvailable")}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">
                        {t("sample.stageProgress.systemStatus")}
                      </span>
                      <span className="text-gray-800 font-medium">
                        {matchedStage?.status
                          ? getStatusLabel(matchedStage.status)
                          : "-"}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mb-6 border border-gray-200 rounded-lg p-5">
          <h3 className="text-lg font-semibold mb-4">
            {t("sample.latestImageTitle")}
          </h3>
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
          <h3 className="text-lg font-semibold mb-4">
            {t("sample.currentStageReportTitle")}
          </h3>
          {reportRows.length === 0 ? (
            <p className="text-sm text-gray-500">Không có dữ liệu báo cáo</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-3 text-sm font-semibold text-gray-900">
                      STT
                    </th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-900">
                      Chỉ số
                    </th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-900">
                      Giá trị đo
                    </th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-900">
                      Kỳ vọng
                    </th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-900">
                      Khoảng chuẩn
                    </th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-900">
                      Đơn vị
                    </th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-900">
                      Kết quả
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reportRows.map((row, index) => {
                    const req = row.stageRequirementDefinitionDto;
                    const sampleReq = req.sampleRequirementDefinitionDto;

                    return (
                      <tr key={row.id} className="border-b">
                        <td className="p-3 text-sm text-gray-800">
                          {index + 1}
                        </td>
                        <td className="p-3 text-sm text-gray-800">
                          {sampleReq.name}
                        </td>
                        <td className="p-3 text-sm text-gray-800">
                          {row.measuredValue}
                        </td>
                        <td className="p-3 text-sm text-gray-800">
                          {req.expectedValue}
                        </td>
                        <td className="p-3 text-sm text-gray-800">
                          {req.minValue} - {req.maxValue}
                        </td>
                        <td className="p-3 text-sm text-gray-800">
                          {sampleReq.unit ?? "-"}
                        </td>
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

      {/* MODAL: Form chuyển đổi thành cây giống */}
      {showConvertForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="border-b p-6 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Chuyển thành cây giống</h3>
              <button
                onClick={() => setShowConvertForm(false)}
                disabled={isConverting}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Tên địa phương <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={convertFormData.localName}
                  onChange={(e) =>
                    setConvertFormData({
                      ...convertFormData,
                      localName: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="VD: Lan hồ điệp trắng F1"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Tên khoa học <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={convertFormData.scientificName}
                  onChange={(e) =>
                    setConvertFormData({
                      ...convertFormData,
                      scientificName: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="VD: Phalaenopsis amabilis var. F1"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Mô tả
                </label>
                <textarea
                  value={convertFormData.description}
                  onChange={(e) =>
                    setConvertFormData({
                      ...convertFormData,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Mô tả cây giống..."
                />
              </div>
            </div>

            <div className="border-t p-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConvertForm(false)}
                disabled={isConverting}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:bg-gray-100"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConvertToSeedling}
                disabled={
                  isConverting ||
                  !convertFormData.localName.trim() ||
                  !convertFormData.scientificName.trim()
                }
                className={`px-4 py-2 text-sm rounded-lg text-white font-medium transition-colors ${
                  !convertFormData.localName.trim() ||
                  !convertFormData.scientificName.trim() ||
                  isConverting
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-purple-600 hover:bg-purple-700"
                }`}
              >
                {isConverting ? "Đang chuyển..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Phân tích bệnh */}
      {showImageModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-[#DDEEE0]">
            <div className="border-b p-6 flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                {t("sample.selectImage")}
              </h3>
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
                    <span className="text-sm text-gray-600">
                      {t("common.uploadImage")}
                    </span>
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

      {/* MODAL: Kết quả phân tích */}
      {showAnalysisModal && analysisResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => !isDestroying && setShowAnalysisModal(false)}
          />
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto relative z-10 border border-[#DDEEE0]">
            {/* Header */}
            <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-[#DDEEE0] px-6 py-5 flex justify-between items-center z-20">
              <h3 className="text-xl font-bold text-[#1e3e1c] flex items-center gap-2">
                <Microscope className="w-6 h-6" /> Kết quả AI
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAnalysisModal(false);
                  setShowDestroyForm(false);
                  setDestroyReason("");
                }}
                className="text-slate-400 hover:text-rose-600 p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Result Summary */}
              <div
                className={`p-5 rounded-xl border ${
                  isHealthyAnalysis
                    ? "bg-[#E4F0E8] border-[#DDEEE0]"
                    : isInactiveDisease
                      ? "bg-amber-50 border-amber-200"
                      : "bg-rose-50 border-rose-200"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <div>
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Giai đoạn
                      </span>
                      <p className="text-base font-bold text-[#1e3e1c] mt-0.5">
                        {(
                          {
                            Tissue: "Giai đoạn mầm",
                            Coppice: "Giai đoạn chồi",
                            Tree: "Giai đoạn cây hoàn chỉnh",
                          } as Record<string, string>
                        )[analysisResult.stageName] ??
                          analysisResult.stageName ??
                          "—"}
                      </p>
                    </div>
                    <div>
                      <span
                        className={`text-xs font-semibold uppercase tracking-wide ${
                          isHealthyAnalysis
                            ? "text-[#2D5A27]"
                            : isInactiveDisease
                              ? "text-amber-700"
                              : "text-rose-600"
                        }`}
                      >
                        Kết quả phân tích
                      </span>
                      <p
                        className={`text-xl font-black mt-0.5 ${
                          isHealthyAnalysis
                            ? "text-[#1e3e1c]"
                            : isInactiveDisease
                              ? "text-amber-900"
                              : "text-rose-800"
                        }`}
                      >
                        {/* Hiển thị tên bệnh: nếu inactive thì dùng rawTopDisease thay vì "Unknown" */}
                        {isInactiveDisease && analysisResult.rawTopDisease
                          ? analysisResult.rawTopDisease.replace(/_/g, " ")
                          : analysisResult.disease.name}
                      </p>
                      {/* Badge chưa kích hoạt */}
                      {isInactiveDisease && (
                        <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-300">
                          Chưa kích hoạt trong hệ thống
                        </span>
                      )}
                    </div>
                  </div>
                  <div
                    className={`w-24 h-24 rounded-full border-4 flex flex-col items-center justify-center shadow-sm flex-shrink-0 bg-white ${
                      isHealthyAnalysis
                        ? "border-[#C9E7D2]"
                        : isInactiveDisease
                          ? "border-amber-200"
                          : "border-rose-200"
                    }`}
                  >
                    <span
                      className={`text-xl font-black leading-none ${
                        isHealthyAnalysis
                          ? "text-[#2D5A27]"
                          : isInactiveDisease
                            ? "text-amber-600"
                            : "text-rose-600"
                      }`}
                    >
                      {(displayConfidence * 100).toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1">
                      độ tin cậy
                    </span>
                  </div>
                </div>
              </div>

              {/* Predictions Breakdown */}
              {Object.keys(analysisResult.analyticResult.predictions ?? {})
                .length > 0 && (
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                    <Microscope className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Phân bố xác suất bệnh
                    </span>
                  </div>
                  {/* Rows */}
                  <div className="divide-y divide-slate-100">
                    {Object.entries(analysisResult.analyticResult.predictions)
                      .sort(([, a], [, b]) => b - a)
                      .map(([onnxKey, prob]) => {
                        // Chuẩn hóa key: bỏ hậu tố "(inactive)" để tra cứu tên hiển thị
                        const baseKey = onnxKey
                          .replace(/\s*\(inactive\)\s*/gi, "")
                          .trim();
                        const name =
                          onnxNameMap[onnxKey] ??
                          onnxNameMap[baseKey] ??
                          baseKey;

                        // Xác định đây có phải kết quả top không:
                        // So khớp với topDisease (active) hoặc rawTopDisease (inactive)
                        const rawNormalized = String(
                          analysisResult.rawTopDisease ?? "",
                        )
                          .replace(/_/g, "")
                          .toLowerCase();
                        const keyNormalized = baseKey
                          .replace(/_/g, "")
                          .toLowerCase();
                        const isTop =
                          onnxKey ===
                            analysisResult.analyticResult.topDisease ||
                          keyNormalized === rawNormalized;

                        const isInactiveKey =
                          /\(inactive\)/i.test(onnxKey);
                        const pct = prob * 100;

                        return (
                          <div
                            key={onnxKey}
                            className={`flex items-center gap-3 px-4 py-3 ${
                              isTop
                                ? isHealthyAnalysis
                                  ? "bg-[#f0f8f2]"
                                  : isInactiveDisease
                                    ? "bg-amber-50/60"
                                    : "bg-rose-50/60"
                                : ""
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                isTop
                                  ? isHealthyAnalysis
                                    ? "bg-[#2D5A27]"
                                    : isInactiveDisease
                                      ? "bg-amber-500"
                                      : "bg-rose-500"
                                  : "bg-slate-300"
                              }`}
                            />
                            <span
                              className={`flex-1 text-sm truncate ${
                                isTop
                                  ? isHealthyAnalysis
                                    ? "font-semibold text-[#1e3e1c]"
                                    : isInactiveDisease
                                      ? "font-semibold text-amber-800"
                                      : "font-semibold text-rose-800"
                                  : "font-medium text-slate-500"
                              }`}
                              title={name}
                            >
                              {name}
                              {isInactiveKey && (
                                <span className="ml-1.5 text-[10px] font-normal text-amber-500 border border-amber-300 rounded px-1 py-0.5">
                                  inactive
                                </span>
                              )}
                            </span>
                            <div className="flex items-center gap-2 w-44 flex-shrink-0">
                              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  style={{ width: `${pct.toFixed(1)}%` }}
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    isTop
                                      ? isHealthyAnalysis
                                        ? "bg-[#2D5A27]"
                                        : isInactiveDisease
                                          ? "bg-amber-500"
                                          : "bg-rose-500"
                                      : "bg-slate-200"
                                  }`}
                                />
                              </div>
                              <span
                                className={`text-xs font-bold w-11 text-right ${
                                  isTop
                                    ? isHealthyAnalysis
                                      ? "text-[#2D5A27]"
                                      : isInactiveDisease
                                        ? "text-amber-600"
                                        : "text-rose-600"
                                    : "text-slate-400"
                                }`}
                              >
                                {pct.toFixed(1) === "0.0"
                                  ? "~0.0"
                                  : pct.toFixed(1)}
                                %
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Warning: bệnh inactive — chưa kích hoạt, không cho tiêu hủy */}
              {isInactiveDisease && (
                <div className="p-5 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-amber-800">
                        Phát hiện dấu hiệu bệnh nhưng chưa thể xác nhận
                      </p>
                      <p className="text-sm text-amber-700">
                        Bệnh{" "}
                        <span className="font-semibold">
                          {analysisResult.rawTopDisease?.replace(/_/g, " ")}
                        </span>{" "}
                        hiện chưa được kích hoạt trong hệ thống. Vui lòng liên
                        hệ quản trị viên để xem xét và kích hoạt bệnh này trước
                        khi tiến hành tiêu hủy.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Destroy Warning — chỉ hiển thị khi bệnh active và không healthy */}
              {!isHealthyAnalysis && !isInactiveDisease && (
                <div className="p-5 bg-rose-50 border border-rose-200 rounded-xl space-y-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-6 h-6 text-rose-600 flex-shrink-0" />
                    <p className="text-sm font-bold text-rose-800">
                      Phát hiện bệnh lây nhiễm. Yêu cầu xử lý tiêu hủy mẫu
                      ngay lập tức!
                    </p>
                  </div>
                  {!showDestroyForm ? (
                    <button
                      type="button"
                      onClick={() => setShowDestroyForm(true)}
                      className="w-full py-2.5 bg-rose-600 text-white rounded-xl font-bold shadow-sm hover:bg-rose-700 transition-colors"
                    >
                      Tiến hành Tiêu Hủy
                    </button>
                  ) : (
                    <div className="bg-white p-4 rounded-xl border border-rose-100 shadow-sm">
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        Lý do tiêu hủy:
                      </label>
                      <textarea
                        value={destroyReason}
                        onChange={(e) => setDestroyReason(e.target.value)}
                        rows={2}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                        placeholder={`Mặc định: Mẫu vật nhiễm ${analysisResult.disease.name}`}
                      />
                      <div className="flex justify-end gap-2 mt-3">
                        <button
                          type="button"
                          onClick={() => {
                            setShowDestroyForm(false);
                            setDestroyReason("");
                          }}
                          disabled={isDestroying}
                          className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDestroySample()}
                          disabled={isDestroying}
                          className="px-5 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg disabled:opacity-50 flex items-center gap-2"
                        >
                          {isDestroying && (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          )}
                          {isDestroying ? "Đang xử lý..." : "Xác nhận Tiêu hủy"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}