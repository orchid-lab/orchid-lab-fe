/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable react-dom/no-missing-button-type */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/consistent-type-definitions */
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axiosInstance from "../../../api/axiosInstance";
import { useSnackbar } from "notistack";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  ArrowLeft,
  Leaf,
  Beaker,
  ClipboardList,
  Activity,
  Camera,
  Microscope,
  ShieldAlert,
  Trash2,
  X,
  Info,
  CheckCircle2,
  AlertTriangle,
  User,
  CalendarClock,
  Loader2,
  Save,
  Pencil,
} from "lucide-react";
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
import {
  getDiseaseIncidents,
  reviewDiseaseIncident,
} from "../../../api/diseaseIncidentApi";
import type { DiseaseIncident } from "../../../types/DiseaseIncident";
import { DiseaseIncidentStatus } from "../../../types/DiseaseIncident";

type PredefinedStage = {
  order: number;
  nameKey: string;
  minDurationDays: number;
  maxDurationDays: number;
  descriptionKey: string;
  keywords: string[];
};

const STATUS_COLOR_MAP: Record<SampleStatus, string> = {
  [SampleStatusValue.Created]: "bg-slate-100 text-slate-700 border-slate-200",
  [SampleStatusValue.InProgressed]:
    "bg-amber-100 text-amber-800 border-amber-200",
  [SampleStatusValue.Completed]:
    "bg-emerald-100 text-emerald-800 border-emerald-200",
  [SampleStatusValue.ExecutedBecauseOfDisease]:
    "bg-rose-100 text-rose-800 border-rose-200",
  [SampleStatusValue.ConvertedToSeedling]:
    "bg-purple-100 text-purple-800 border-purple-200",
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
  if (!value) return "—";
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
  if (/^https?:\/\//i.test(imageUrl) || imageUrl.startsWith("data:"))
    return imageUrl;
  const baseUrl = axiosInstance.defaults.baseURL ?? "";
  const normalizedBaseUrl = baseUrl.endsWith("/")
    ? baseUrl.slice(0, -1)
    : baseUrl;
  const normalizedImageUrl = imageUrl.startsWith("/")
    ? imageUrl
    : `/${imageUrl}`;
  return `${normalizedBaseUrl}${normalizedImageUrl}`;
};

/**
 * Lấy value từ analyticResult theo disease.code
 * API trả về code dạng "disease_anthracnose", key trong analyticResult là "anthracnose"
 * → Strip prefix "disease_" rồi tìm case-insensitive
 */
const getAnalyticValueByDiseaseCode = (
  analyticResult: AnalysisResponse["analyticResult"],
  diseaseCode: string,
): number => {
  const stripped = diseaseCode.replace(/^disease_/i, "").toLowerCase();
  const entry = Object.entries(analyticResult).find(
    ([k]) => k.toLowerCase() === stripped,
  );
  return Number(entry?.[1] ?? 0);
};

/* ─── Animation Variants ─── */
const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

// Label map for analyticResult keys → Vietnamese display names
const ANALYTIC_KEY_LABEL: Record<string, string> = {
  anthracnose: "Thán thư",
  bacterialWilt: "Héo rũ do vi khuẩn",
  blackrot: "Thối đen",
  brownspots: "Đốm nâu",
  moldBacterial: "Mốc vi khuẩn",
  moldFungus: "Mốc nấm",
  softRot: "Thối mềm",
  stemRot: "Thối thân",
  witheredYellowRoot: "Vàng héo rễ",
  healthy: "Khỏe mạnh",
  oxidation: "Oxy hoá",
  virus: "Virus",
};

export default function TechDetailSample() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation();

  const navigationSource = location.state as {
    from?: "experimentLogDetail" | "sampleList";
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

  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editInitialCondition, setEditInitialCondition] = useState("");

  const [incidents, setIncidents] = useState<DiseaseIncident[]>([]);
  const [incidentsLoading, setIncidentsLoading] = useState(false);
  const [incidentsError, setIncidentsError] = useState<string | null>(null);
  const [incidentStatusFilter, setIncidentStatusFilter] = useState<
    DiseaseIncidentStatus | undefined
  >(undefined);
  const [reviewingIncident, setReviewingIncident] =
    useState<DiseaseIncident | null>(null);
  const [reviewIsConfirmed, setReviewIsConfirmed] = useState(true);
  const [reviewNote, setReviewNote] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [, setReviewError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
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
        users.forEach((u) => {
          userMapping[u.id] = u.name;
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

  useEffect(() => {
    const expLogId = sample?.experimentLogId;
    if (!expLogId) return;
    setIncidentsLoading(true);
    setIncidentsError(null);

    const stageIdSet = new Set(
      normalizeStageList(sample?.sampleStageDto).map(
        (stage: SampleStageDetail) => stage.id,
      ),
    );

    getDiseaseIncidents({
      experimentLogId: expLogId,
      status: incidentStatusFilter,
    })
      .then((data) => {
        const filteredIncidents =
          data.data?.filter((incident) =>
            stageIdSet.has(incident.sampleStageId),
          ) ?? [];
        setIncidents(filteredIncidents);
      })
      .catch(() => setIncidentsError(t("diseaseIncident.loadError")))
      .finally(() => setIncidentsLoading(false));
  }, [
    sample?.experimentLogId,
    incidentStatusFilter,
    sample?.sampleStageDto,
    t,
  ]);

  const openReviewModal = (incident: DiseaseIncident) => {
    setReviewingIncident(incident);
    setReviewIsConfirmed(true);
    setReviewNote("");
    setReviewError(null);
  };
  const closeReviewModal = () => {
    if (!reviewSubmitting) setReviewingIncident(null);
  };

  const handleSubmitReview = async () => {
    if (!reviewingIncident) return;
    setReviewSubmitting(true);
    setReviewError(null);
    try {
      await reviewDiseaseIncident(reviewingIncident.id, {
        isConfirmed: reviewIsConfirmed,
        note: reviewNote.trim() || undefined,
      });
      setReviewingIncident(null);
      const expLogId = sample?.experimentLogId;
      if (expLogId) {
        const data = await getDiseaseIncidents({
          experimentLogId: expLogId,
          status: incidentStatusFilter,
        });
        setIncidents(data.data ?? []);
      }
    } catch {
      setReviewError(t("common.error"));
    } finally {
      setReviewSubmitting(false);
    }
  };

  const getIncidentStatusLabel = (status: DiseaseIncidentStatus): string => {
    switch (status) {
      case DiseaseIncidentStatus.AIDetected:
        return t("diseaseIncident.statusAIDetected");
      case DiseaseIncidentStatus.UnderReview:
        return t("diseaseIncident.statusUnderReview");
      case DiseaseIncidentStatus.Confirmed:
        return t("diseaseIncident.statusConfirmed");
      case DiseaseIncidentStatus.Dismissed:
        return t("diseaseIncident.statusDismissed");
      default:
        return String(status);
    }
  };

  const getIncidentStatusClass = (status: DiseaseIncidentStatus): string => {
    switch (status) {
      case DiseaseIncidentStatus.AIDetected:
        return "bg-rose-100 text-rose-700 border-rose-200";
      case DiseaseIncidentStatus.UnderReview:
        return "bg-amber-100 text-amber-800 border-amber-200";
      case DiseaseIncidentStatus.Confirmed:
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case DiseaseIncidentStatus.Dismissed:
        return "bg-slate-100 text-slate-700 border-slate-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const handleBack = () => {
    if (
      navigationSource?.from === "experimentLogDetail" &&
      navigationSource.experimentLogId
    ) {
      navigate(
        `/technician/experiment-log/${navigationSource.experimentLogId}`,
      );
    } else {
      navigate("/technician/samples");
    }
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
      const analysisFormData = new FormData();
      analysisFormData.append("image", selectedImage);
      const result = await axiosInstance.post<AnalysisResponse>(
        "/api/monitoring-log/analysis",
        analysisFormData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      setAnalysisResult(result.data);
      setShowAnalysisModal(true);
      setShowImageModal(false);
      setSelectedImage(null);
      setImagePreview("");
      enqueueSnackbar(t("common.success"), { variant: "success" });
    } catch (err) {
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
    if (
      diseaseCode.includes("healthy") ||
      diseaseName.includes("healthy") ||
      diseaseName.includes("khỏe")
    )
      return true;
    const values = Object.entries(analysisResult.analyticResult)
      .filter(([key]) => key !== "healthy" && key !== "id")
      .map(([, value]) => value as number);
    const maxNonHealthy = values.length > 0 ? Math.max(...values) : 0;
    return analysisResult.analyticResult.healthy >= maxNonHealthy;
  }, [analysisResult]);

  const handleDestroySample = async () => {
    if (!id || !analysisResult || isDestroying) return;
    const finalReason =
      destroyReason.trim() || `Mẫu vật nhiễm ${analysisResult.disease.name}`;
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

  const handleConfirmDeleteSample = async () => {
    if (!sample?.id) return;
    setIsDeleting(true);
    try {
      await axiosInstance.delete(`/api/samples/${sample.id}`, {
        data: { reason: deleteReason },
      });
      enqueueSnackbar(t("common.success") ?? "Xóa thành công", {
        variant: "success",
      });
      handleBack();
    } catch {
      enqueueSnackbar(t("common.error") ?? "Lỗi khi xóa", { variant: "error" });
    } finally {
      setIsDeleting(false);
      setShowConfirmDeleteModal(false);
      setDeleteReason("");
    }
  };

  const handleOpenEditModal = () => {
    if (!sample) return;
    setEditName(sample.name);
    setEditNotes(sample.notes ?? "");
    setEditInitialCondition(String(sample.initialCondition ?? ""));
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!sample?.id || isEditing) return;
    setIsEditing(true);
    try {
      await axiosInstance.put(`/api/samples/${sample.id}`, {
        name: editName.trim(),
        notes: editNotes.trim(),
        initialCondition: editInitialCondition.trim(),
      });
      setSample((prev) =>
        prev
          ? {
              ...prev,
              name: editName.trim(),
              notes: editNotes.trim(),
              initialCondition: editInitialCondition.trim(),
            }
          : prev,
      );
      enqueueSnackbar(t("common.success"), { variant: "success" });
      setShowEditModal(false);
    } catch {
      enqueueSnackbar(t("common.error"), { variant: "error" });
    } finally {
      setIsEditing(false);
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
    return statusMap[status] || status;
  };

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

  const currentStageLabel = sample?.currentSampleStage ?? "-";
  const latestImageUrl = resolveImageUrl(latestStage?.latestImageUrl);
  const reportRows: SampleLogDetail[] = latestStage?.logDetailDtos ?? [];

  const stageProgressRows = useMemo(() => {
    return sampleStages.map((stage) => {
      const predefinedStage = PREDEFINED_STAGES.find(
        (pre) => pre.order === stage.sampleStageDefinition?.order,
      );
      const hasReport = (stage.logDetailDtos?.length ?? 0) > 0;
      const stageImageUrl = resolveImageUrl(stage.latestImageUrl);
      const hasImage = Boolean(stageImageUrl);
      let progressLabel = t("sample.stageProgress.future");
      let progressClass = "bg-slate-100 text-slate-600 border-slate-200";
      if (stage.status === SampleStatusValue.Completed) {
        progressLabel = t("sample.stageProgress.passed");
        progressClass = "bg-emerald-100 text-emerald-800 border-emerald-200";
      } else if (stage.status === SampleStatusValue.InProgressed) {
        progressLabel = t("sample.stageProgress.current");
        progressClass = "bg-amber-100 text-amber-800 border-amber-200";
      } else if (hasReport) {
        progressLabel = t("sample.stageProgress.hasData");
        progressClass = "bg-emerald-50 text-emerald-700 border-emerald-100";
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

  // Prepare sorted analytic rows (exclude "id" field), sorted descending by value
  const analyticRows = useMemo(() => {
    if (!analysisResult) return [];
    const diseaseCodeKey = analysisResult.disease.code
      .replace(/^disease_/i, "")
      .toLowerCase();
    return Object.entries(analysisResult.analyticResult)
      .filter(([k]) => k !== "id")
      .map(([key, value]) => ({
        key,
        label: ANALYTIC_KEY_LABEL[key] ?? key,
        value: Number(value),
        isTopDisease: key.toLowerCase() === diseaseCodeKey,
        isHealthy: key === "healthy",
      }))
      .sort((a, b) => b.value - a.value);
  }, [analysisResult]);

  if (loading) {
    return (
      <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center text-emerald-600 animate-pulse">
          <Leaf className="w-12 h-12 mb-4 animate-bounce" />
          <p className="font-medium text-lg">Đang tải dữ liệu mẫu...</p>
        </div>
      </main>
    );
  }

  if (error || !sample) {
    return (
      <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-slate-50 p-8 flex items-center justify-center">
        <div className="text-center max-w-md bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <AlertTriangle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <p className="text-rose-600 font-semibold text-lg mb-6">
            {error ?? "Không tìm thấy dữ liệu"}
          </p>
          <button
            onClick={handleBack}
            className="px-6 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium"
          >
            Quay lại danh sách
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#F4F7F4] p-6 lg:p-8 text-slate-800">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="max-w-6xl mx-auto space-y-6"
      >
        {/* Nút Quay Lại */}
        <motion.button
          variants={fadeInUp}
          onClick={handleBack}
          className="flex items-center gap-2 text-slate-500 hover:text-emerald-700 transition-colors mb-2 font-medium w-fit"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </motion.button>

        {/* Header & Actions */}
        <motion.div
          variants={fadeInUp}
          className="bg-white rounded-2xl p-6 shadow-sm border border-[#DDEEE0] flex flex-col lg:flex-row lg:items-center justify-between gap-6"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#E4F0E8] text-[#2D5A27] rounded-xl shadow-inner">
              <Leaf className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-[#1e3e1c]">
                {sample.name}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`px-2.5 py-1 rounded-md text-xs font-bold border ${STATUS_COLOR_MAP[sample.status] || "bg-slate-100 text-slate-700"}`}
                >
                  {getStatusLabel(sample.status)}
                </span>
                <span className="text-sm text-slate-500 font-medium">
                  ID: {sample.id.split("-")[0]}...
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleOpenEditModal}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#2D5A27] text-[#2D5A27] bg-white hover:bg-[#E4F0E8] transition-colors font-semibold shadow-sm"
            >
              <Pencil className="w-4 h-4" /> Sửa
            </button>
            {sample.status !== SampleStatusValue.ExecutedBecauseOfDisease &&
              incidents.some(
                (inc) => inc.status === DiseaseIncidentStatus.Confirmed,
              ) && (
                <button
                  onClick={() => setShowConfirmDeleteModal(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-colors font-semibold shadow-sm"
                >
                  <Trash2 className="w-4 h-4" />{" "}
                  {t("sample.destroySample") ?? "Hủy mẫu"}
                </button>
              )}
            {sample.status !== SampleStatusValue.ExecutedBecauseOfDisease && (
              <button
                onClick={() => setShowImageModal(true)}
                disabled={analyzing}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-colors shadow-sm ${analyzing ? "bg-slate-300 text-slate-500 cursor-not-allowed" : "bg-[#2D5A27] hover:bg-[#1e3e1c] text-white"}`}
              >
                <Microscope className="w-4 h-4" />
                {analyzing ? t("sample.analyzing") : t("sample.analyzeDisease")}
              </button>
            )}
          </div>
        </motion.div>

        {/* Grid Thông Tin Cơ Bản */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            variants={fadeInUp}
            className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-[#DDEEE0] overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-[#DDEEE0] bg-[#F4F7F4] flex items-center gap-3">
              <Info className="w-5 h-5 text-[#2D5A27]" />
              <h3 className="text-lg font-bold text-[#1e3e1c]">
                Thông tin mẫu
              </h3>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  Thí nghiệm
                </span>
                <div className="text-base font-medium text-slate-800 flex items-center gap-2">
                  <Beaker className="w-4 h-4 text-emerald-600" />
                  {experimentLogMap[sample.experimentLogId] ||
                    sample.experimentLogId}
                </div>
              </div>
              <div>
                <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  Giai đoạn hiện tại
                </span>
                <div className="text-base font-medium text-slate-800 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-500" />
                  {currentStageLabel}
                </div>
              </div>
              <div className="sm:col-span-2">
                <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  Ghi chú mẫu
                </span>
                <div className="text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {sample.notes ?? (
                    <span className="italic text-slate-400">
                      Không có ghi chú
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            className="bg-white rounded-2xl shadow-sm border border-[#DDEEE0] overflow-hidden h-fit"
          >
            <div className="px-6 py-4 border-b border-[#DDEEE0] bg-[#F4F7F4] flex items-center gap-3">
              <User className="w-5 h-5 text-[#2D5A27]" />
              <h3 className="text-lg font-bold text-[#1e3e1c]">
                Người thực hiện
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  Người tạo
                </span>
                <div className="text-sm font-bold text-[#2D5A27]">
                  {userMap[sample.createdBy ?? ""] ?? sample.createdBy ?? "—"}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {formatDate(sample.createdDate)}
                </div>
              </div>
              <div className="pt-3 border-t border-[#DDEEE0]">
                <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  Cập nhật lần cuối
                </span>
                <div className="text-sm font-bold text-[#1e3e1c]">
                  {userMap[sample.updatedBy ?? ""] ?? sample.updatedBy ?? "—"}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {formatDate(sample.updatedDate)}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tiến Trình Giai Đoạn */}
        <motion.div
          variants={fadeInUp}
          className="bg-white rounded-2xl shadow-sm border border-[#DDEEE0] overflow-hidden"
        >
          <div className="px-6 py-5 border-b border-[#DDEEE0] bg-[#F4F7F4] flex items-center gap-3">
            <CalendarClock className="w-5 h-5 text-[#2D5A27]" />
            <h3 className="text-lg font-bold text-[#1e3e1c]">
              {t("sample.stageProgress.title") ?? "Tiến trình nuôi cấy"}
            </h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
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
                <div
                  key={predefinedStage.order ?? idx}
                  className="border border-[#DDEEE0] rounded-xl p-5 bg-white hover:border-[#2D5A27]/40 hover:shadow-md transition-all flex flex-col h-full"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h4 className="font-bold text-[#1e3e1c] leading-tight">
                      Giai đoạn {predefinedStage.order}:<br />
                      <span className="text-[#2D5A27]">
                        {t(predefinedStage.nameKey)}
                      </span>
                    </h4>
                    <span
                      className={`px-2.5 py-1 rounded-md text-xs font-bold border text-center ${progressClass}`}
                    >
                      {progressLabel}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mb-4 flex-1">
                    {t(predefinedStage.descriptionKey)}
                  </p>

                  <div className="mb-4 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 aspect-video flex items-center justify-center">
                    {hasImage ? (
                      <img
                        src={stageImageUrl}
                        alt="stage"
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="text-slate-400 text-xs flex flex-col items-center gap-1">
                        <Camera className="w-6 h-6 opacity-50" />
                        {t("sample.stageProgress.noImage")}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Chuẩn (ngày):</span>
                      <span className="font-semibold text-slate-700">
                        {predefinedStage.minDurationDays} -{" "}
                        {predefinedStage.maxDurationDays}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Ngày bắt đầu:</span>
                      <span className="font-semibold text-slate-700">
                        {formatDate(matchedStage?.startAt)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Báo cáo:</span>
                      <span
                        className={`font-semibold ${hasReport ? "text-[#2D5A27]" : "text-slate-400"}`}
                      >
                        {hasReport ? "Có dữ liệu" : "Chưa có"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Khu Vực Hình Ảnh và Báo cáo */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            variants={fadeInUp}
            className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-[#DDEEE0] overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-[#DDEEE0] bg-[#F4F7F4] flex items-center gap-3">
              <Camera className="w-5 h-5 text-[#2D5A27]" />
              <h3 className="text-lg font-bold text-[#1e3e1c]">
                Hình ảnh mới nhất
              </h3>
            </div>
            <div className="p-6">
              {!latestImageUrl ? (
                <div className="h-48 bg-slate-50 rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
                  <Camera className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">
                    {t("sample.noLatestImage") ?? "Chưa có ảnh"}
                  </p>
                </div>
              ) : (
                <img
                  src={latestImageUrl}
                  alt="Latest"
                  className="w-full rounded-xl object-cover border border-slate-200 shadow-sm"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}
            </div>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-[#DDEEE0] overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-[#DDEEE0] bg-[#F4F7F4] flex items-center gap-3">
              <ClipboardList className="w-5 h-5 text-[#2D5A27]" />
              <h3 className="text-lg font-bold text-[#1e3e1c]">
                Báo cáo giai đoạn hiện tại
              </h3>
            </div>
            <div className="p-0">
              {reportRows.length === 0 ? (
                <div className="p-8 text-center text-slate-500 italic">
                  Chưa có dữ liệu đo đạc cho giai đoạn này.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3">Chỉ số</th>
                        <th className="px-6 py-3">Đo được</th>
                        <th className="px-6 py-3">Chuẩn (Min-Max)</th>
                        <th className="px-6 py-3 text-center">Kết quả</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportRows.map((row) => {
                        const req = row.stageRequirementDefinitionDto;
                        const sampleReq = req.sampleRequirementDefinitionDto;
                        return (
                          <tr
                            key={row.id}
                            className="border-b border-slate-100 hover:bg-[#F4F7F4] transition-colors"
                          >
                            <td className="px-6 py-4 font-medium text-[#1e3e1c]">
                              {sampleReq.name}
                            </td>
                            <td className="px-6 py-4 font-bold text-[#2D5A27]">
                              {row.measuredValue}{" "}
                              <span className="text-xs text-slate-500 font-normal">
                                {sampleReq.unit}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-600">
                              {req.minValue} - {req.maxValue} {sampleReq.unit}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span
                                className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-bold border ${row.isMatch ? "bg-[#E4F0E8] text-[#2D5A27] border-[#C9E7D2]" : "bg-rose-100 text-rose-700 border-rose-200"}`}
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
            </div>
          </motion.div>
        </div>

        {/* Disease Incidents Panel */}
        {sample?.experimentLogId && (
          <motion.div
            variants={fadeInUp}
            className="bg-white rounded-2xl shadow-sm border border-[#DDEEE0] overflow-hidden"
          >
            <div className="px-6 py-5 border-b border-[#DDEEE0] bg-[#F4F7F4] flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <h3 className="text-lg font-bold text-[#1e3e1c]">
                  {t("diseaseIncident.title") ?? "Cảnh báo Bệnh AI"}
                </h3>
                {incidents.some(
                  (inc) => inc.status === DiseaseIncidentStatus.AIDetected,
                ) && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />{" "}
                    Mới phát hiện
                  </span>
                )}
              </div>
              <select
                value={incidentStatusFilter ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setIncidentStatusFilter(
                    val === "" ? undefined : (val as DiseaseIncidentStatus),
                  );
                }}
                className="border border-[#DDEEE0] bg-white rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/50"
              >
                <option value="">
                  {t("diseaseIncident.filterAll") ?? "Tất cả trạng thái"}
                </option>
                <option value={DiseaseIncidentStatus.AIDetected}>
                  {t("diseaseIncident.statusAIDetected")}
                </option>
                <option value={DiseaseIncidentStatus.UnderReview}>
                  {t("diseaseIncident.statusUnderReview")}
                </option>
                <option value={DiseaseIncidentStatus.Confirmed}>
                  {t("diseaseIncident.statusConfirmed")}
                </option>
                <option value={DiseaseIncidentStatus.Dismissed}>
                  {t("diseaseIncident.statusDismissed")}
                </option>
              </select>
            </div>

            <div className="p-0">
              {incidentsError && (
                <div className="p-4 text-sm text-rose-600 bg-rose-50">
                  {incidentsError}
                </div>
              )}
              {incidentsLoading ? (
                <div className="p-8 flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2D5A27]"></div>
                </div>
              ) : incidents.length === 0 ? (
                <div className="p-8 text-center text-[#4B6C54] italic flex flex-col items-center gap-2">
                  <CheckCircle2 className="w-8 h-8 text-[#DDEEE0]" />
                  Mẫu hiện không có cảnh báo bệnh nào.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm text-left">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4">Tên Bệnh (AI)</th>
                        <th className="px-6 py-4">Độ tự tin</th>
                        <th className="px-6 py-4">Trạng thái</th>
                        <th className="px-6 py-4 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {incidents.map((inc) => (
                        <tr
                          key={inc.id}
                          className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-6 py-4 font-bold text-rose-700">
                            {inc.diseaseName}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`font-bold ${inc.aiConfidence >= 0.8 ? "text-rose-600" : inc.aiConfidence >= 0.5 ? "text-amber-600" : "text-slate-500"}`}
                            >
                              {(inc.aiConfidence * 100).toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold border ${getIncidentStatusClass(inc.status)}`}
                            >
                              {getIncidentStatusLabel(inc.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {(inc.status === DiseaseIncidentStatus.AIDetected ||
                              inc.status ===
                                DiseaseIncidentStatus.UnderReview) && (
                              <button
                                onClick={() => openReviewModal(inc)}
                                className="px-4 py-1.5 rounded-lg bg-[#2D5A27] text-white hover:bg-[#1e3e1c] font-semibold shadow-sm transition-colors"
                              >
                                {t("diseaseIncident.review") ?? "Đánh giá"}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* --- Modals --- */}
      <AnimatePresence>
        {/* Upload Image Modal */}
        {showImageModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={handleCancelImageModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10 border border-[#DDEEE0]"
            >
              <div className="px-6 py-5 border-b border-[#DDEEE0] bg-[#F4F7F4] flex justify-between items-center rounded-t-2xl">
                <h3 className="text-lg font-bold text-[#1e3e1c]">
                  {t("sample.selectImage") ?? "Chọn ảnh phân tích"}
                </h3>
                <button
                  onClick={handleCancelImageModal}
                  disabled={analyzing}
                  className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                {imagePreview ? (
                  <div className="space-y-4">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-xl border border-slate-200 shadow-sm"
                    />
                    <button
                      onClick={() => {
                        setSelectedImage(null);
                        setImagePreview("");
                      }}
                      disabled={analyzing}
                      className="w-full py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
                    >
                      Chọn ảnh khác
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-[#2D5A27]/30 rounded-xl bg-[#F4F7F4] hover:bg-[#E4F0E8] cursor-pointer transition-colors text-[#2D5A27]">
                    <Camera className="w-10 h-10 mb-3 opacity-70" />
                    <span className="font-semibold">
                      {t("common.uploadImage") ?? "Tải ảnh lên"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      disabled={analyzing}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 rounded-b-2xl flex justify-end gap-3">
                <button
                  onClick={handleCancelImageModal}
                  disabled={analyzing}
                  className="px-5 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-100 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleUploadAndAnalyze}
                  disabled={!selectedImage || analyzing}
                  className={`px-6 py-2 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm ${selectedImage && !analyzing ? "bg-[#2D5A27] hover:bg-[#1e3e1c]" : "bg-slate-300 cursor-not-allowed"}`}
                >
                  {analyzing ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Microscope className="w-4 h-4" />
                  )}
                  {analyzing ? t("sample.analyzing") : t("common.confirm")}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* ── AI Analysis Result Modal ── */}
        {showAnalysisModal && analysisResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => !isDestroying && setShowAnalysisModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto relative z-10 border border-[#DDEEE0]"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-[#DDEEE0] px-6 py-5 flex justify-between items-center z-20">
                <h3 className="text-xl font-bold text-[#1e3e1c] flex items-center gap-2">
                  <Microscope className="w-6 h-6" /> Kết quả AI
                </h3>
                <button
                  onClick={() => {
                    setShowAnalysisModal(false);
                    setShowDestroyForm(false);
                  }}
                  className="text-slate-400 hover:text-rose-600 p-1"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* ── Top Disease Banner ── */}
                <div
                  className={`flex items-center justify-between p-5 rounded-xl border ${isHealthyAnalysis ? "bg-[#E4F0E8] border-[#DDEEE0]" : "bg-rose-50 border-rose-200"}`}
                >
                  <div>
                    <span
                      className={`text-xs font-bold uppercase tracking-wider ${isHealthyAnalysis ? "text-[#2D5A27]" : "text-rose-600"}`}
                    >
                      Dự đoán bệnh cao nhất
                    </span>
                    <h4
                      className={`text-2xl font-black mt-1 ${isHealthyAnalysis ? "text-[#1e3e1c]" : "text-rose-800"}`}
                    >
                      {analysisResult.disease.name}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs">
                      {analysisResult.disease.description}
                    </p>
                  </div>
                  {/* ── Fixed: use getAnalyticValueByDiseaseCode instead of direct key lookup ── */}
                  <div
                    className={`w-20 h-20 rounded-full border-4 flex flex-col items-center justify-center shadow-sm flex-shrink-0 ${isHealthyAnalysis ? "bg-white border-[#C9E7D2]" : "bg-white border-rose-200"}`}
                  >
                    <span
                      className={`text-lg font-black leading-none ${isHealthyAnalysis ? "text-[#2D5A27]" : "text-rose-600"}`}
                    >
                      {(
                        getAnalyticValueByDiseaseCode(
                          analysisResult.analyticResult,
                          analysisResult.disease.code,
                        ) * 100
                      ).toFixed(0)}
                      %
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      độ tin
                    </span>
                  </div>
                </div>

                {/* ── Analytic Result Table ── */}
                <div>
                  <h5 className="font-bold text-slate-700 mb-3 text-sm uppercase tracking-wide">
                    Xác suất tất cả các bệnh
                  </h5>
                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-4 py-3 text-left font-semibold text-slate-600">
                            Loại bệnh
                          </th>
                          <th className="px-4 py-3 text-right font-semibold text-slate-600 w-20">
                            Xác suất
                          </th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-600">
                            Mức độ
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {analyticRows.map(
                          ({ key, label, value, isTopDisease, isHealthy }) => {
                            const pct = value * 100;
                            // Bar color logic
                            const barColor =
                              isTopDisease && !isHealthy
                                ? "bg-rose-500"
                                : isHealthy
                                  ? "bg-emerald-500"
                                  : pct >= 5
                                    ? "bg-amber-400"
                                    : "bg-slate-300";
                            const rowBg =
                              isTopDisease && !isHealthy
                                ? "bg-rose-50"
                                : isTopDisease && isHealthy
                                  ? "bg-emerald-50"
                                  : "hover:bg-slate-50";
                            return (
                              <tr
                                key={key}
                                className={`border-b border-slate-100 transition-colors ${rowBg}`}
                              >
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    {isTopDisease && !isHealthy && (
                                      <AlertTriangle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                                    )}
                                    {isHealthy && (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                                    )}
                                    <span
                                      className={`font-medium ${isTopDisease && !isHealthy ? "text-rose-700 font-bold" : isHealthy ? "text-emerald-700" : "text-slate-700"}`}
                                    >
                                      {label}
                                    </span>
                                    {isTopDisease && (
                                      <span
                                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isHealthy ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-600"}`}
                                      >
                                        Cao nhất
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <span
                                    className={`font-bold tabular-nums ${isTopDisease && !isHealthy ? "text-rose-600" : isHealthy ? "text-emerald-600" : pct >= 5 ? "text-amber-600" : "text-slate-500"}`}
                                  >
                                    {pct.toFixed(1)}%
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                    <div
                                      className={`h-2 rounded-full transition-all ${barColor}`}
                                      style={{
                                        width: `${Math.min(pct, 100)}%`,
                                      }}
                                    />
                                  </div>
                                </td>
                              </tr>
                            );
                          },
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ── Destroy Warning ── */}
                {!isHealthyAnalysis && (
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
                            onClick={() => setShowDestroyForm(false)}
                            disabled={isDestroying}
                            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                          >
                            Hủy
                          </button>
                          <button
                            onClick={handleDestroySample}
                            disabled={isDestroying}
                            className="px-5 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg disabled:opacity-50 flex items-center gap-2"
                          >
                            {isDestroying && (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            )}
                            {isDestroying
                              ? "Đang xử lý..."
                              : "Xác nhận Tiêu hủy"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* Review Incident Modal */}
        {reviewingIncident && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={closeReviewModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10 border border-[#DDEEE0]"
            >
              <div className="px-6 py-5 border-b border-[#DDEEE0] bg-[#F4F7F4] flex justify-between items-center rounded-t-2xl">
                <h3 className="text-lg font-bold text-[#1e3e1c]">
                  {t("diseaseIncident.reviewModalTitle") ??
                    "Đánh giá cảnh báo AI"}
                </h3>
                <button
                  onClick={closeReviewModal}
                  disabled={reviewSubmitting}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-5">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mẫu:</span>
                    <span className="font-bold text-[#1e3e1c]">
                      {reviewingIncident.sampleName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Bệnh phát hiện:</span>
                    <span className="font-bold text-rose-600">
                      {reviewingIncident.diseaseName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">AI Tự tin:</span>
                    <span className="font-bold text-amber-600">
                      {(reviewingIncident.aiConfidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3">
                    Quyết định của Kỹ thuật viên:
                  </label>
                  <div className="flex gap-4">
                    <label
                      className={`flex-1 flex flex-col items-center gap-2 p-3 border-2 rounded-xl cursor-pointer transition-all ${reviewIsConfirmed ? "border-[#2D5A27] bg-[#E4F0E8]" : "border-slate-200 bg-white"}`}
                    >
                      <input
                        type="radio"
                        name="tech-review"
                        className="hidden"
                        checked={reviewIsConfirmed}
                        onChange={() => setReviewIsConfirmed(true)}
                        disabled={reviewSubmitting}
                      />
                      <CheckCircle2
                        className={`w-6 h-6 ${reviewIsConfirmed ? "text-[#2D5A27]" : "text-slate-300"}`}
                      />
                      <span
                        className={`text-sm font-bold ${reviewIsConfirmed ? "text-[#2D5A27]" : "text-slate-500"}`}
                      >
                        Xác nhận Bệnh
                      </span>
                    </label>
                    <label
                      className={`flex-1 flex flex-col items-center gap-2 p-3 border-2 rounded-xl cursor-pointer transition-all ${!reviewIsConfirmed ? "border-slate-500 bg-slate-100" : "border-slate-200 bg-white"}`}
                    >
                      <input
                        type="radio"
                        name="tech-review"
                        className="hidden"
                        checked={!reviewIsConfirmed}
                        onChange={() => setReviewIsConfirmed(false)}
                        disabled={reviewSubmitting}
                      />
                      <X
                        className={`w-6 h-6 ${!reviewIsConfirmed ? "text-slate-600" : "text-slate-300"}`}
                      />
                      <span
                        className={`text-sm font-bold ${!reviewIsConfirmed ? "text-slate-700" : "text-slate-500"}`}
                      >
                        Bác bỏ AI
                      </span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Ghi chú thêm:
                  </label>
                  <textarea
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    rows={3}
                    disabled={reviewSubmitting}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/50 shadow-sm"
                    placeholder="Nhập ghi chú hoặc lý do đánh giá..."
                  />
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 rounded-b-2xl flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeReviewModal}
                  disabled={reviewSubmitting}
                  className="px-5 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-100 shadow-sm disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => void handleSubmitReview()}
                  disabled={reviewSubmitting}
                  className="px-6 py-2 bg-[#2D5A27] text-white rounded-xl font-bold hover:bg-[#1e3e1c] shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {reviewSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}{" "}
                  Lên báo cáo
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Edit Sample Modal */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => !isEditing && setShowEditModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg relative z-10 border border-[#DDEEE0]"
            >
              <div className="px-6 py-5 border-b border-[#DDEEE0] bg-[#F4F7F4] flex justify-between items-center rounded-t-2xl">
                <h3 className="text-lg font-bold text-[#1e3e1c] flex items-center gap-2">
                  <Pencil className="w-5 h-5 text-[#2D5A27]" /> Chỉnh sửa mẫu
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  disabled={isEditing}
                  className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Tên mẫu
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    disabled={isEditing}
                    className="w-full px-4 py-2.5 bg-white border border-[#DDEEE0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/50 disabled:opacity-60"
                    placeholder="Nhập tên mẫu..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Ghi chú
                  </label>
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    disabled={isEditing}
                    rows={2}
                    className="w-full px-4 py-2.5 bg-white border border-[#DDEEE0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/50 resize-none disabled:opacity-60"
                    placeholder="Nhập ghi chú..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Điều kiện ban đầu
                  </label>
                  <textarea
                    value={editInitialCondition}
                    onChange={(e) => setEditInitialCondition(e.target.value)}
                    disabled={isEditing}
                    rows={2}
                    className="w-full px-4 py-2.5 bg-white border border-[#DDEEE0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/50 resize-none disabled:opacity-60"
                    placeholder="Nhập điều kiện ban đầu của mẫu..."
                  />
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 rounded-b-2xl flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  disabled={isEditing}
                  className="px-5 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-100 shadow-sm disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => void handleSaveEdit()}
                  disabled={isEditing || !editName.trim()}
                  className="px-6 py-2 bg-[#2D5A27] text-white rounded-xl font-bold hover:bg-[#1e3e1c] shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {isEditing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isEditing ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showConfirmDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => !isDeleting && setShowConfirmDeleteModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10 border border-rose-100"
            >
              <div className="px-6 py-5 border-b border-rose-50 flex justify-between items-center bg-rose-50/30 rounded-t-2xl">
                <h3 className="text-lg font-bold text-rose-800 flex items-center gap-2">
                  <Trash2 className="w-5 h-5" /> Xác nhận hủy mẫu
                </h3>
                <button
                  onClick={() => setShowConfirmDeleteModal(false)}
                  disabled={isDeleting}
                  className="text-slate-400 hover:text-rose-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 text-sm text-rose-700 font-medium">
                  Hành động này không thể hoàn tác. Mẫu sẽ bị đánh dấu là đã
                  tiêu hủy vĩnh viễn.
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Lý do hủy (bắt buộc):
                  </label>
                  <textarea
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    rows={3}
                    disabled={isDeleting}
                    className="w-full px-4 py-3 bg-white border border-rose-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-sm"
                    placeholder="VD: Mẫu bị nhiễm khuẩn nặng..."
                  />
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 rounded-b-2xl flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmDeleteModal(false)}
                  disabled={isDeleting}
                  className="px-5 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-100 shadow-sm"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => void handleConfirmDeleteSample()}
                  disabled={isDeleting || !deleteReason.trim()}
                  className="px-6 py-2 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isDeleting ? "Đang xóa..." : "Xác nhận Hủy"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
