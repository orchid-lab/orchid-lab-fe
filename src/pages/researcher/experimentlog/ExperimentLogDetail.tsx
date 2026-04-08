/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { useEffect, useState, useLayoutEffect, useRef } from "react";
import { useSnackbar } from "notistack";
import "./ExperimentLogDetail.css";
import { useNavigate, useParams } from "react-router-dom";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import type { AxiosError } from "axios";
import type { User } from "../../../types/Auth";
import { SampleStatus } from "../../../types/Sample";
import { SAMPLE_STATUS_MAP } from "../../../utils/sampleStatus";
import { FaSeedling } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import axiosInstance from "../../../api/axiosInstance";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  getDiseaseIncidents,
  reviewDiseaseIncident,
} from "../../../api/diseaseIncidentApi";
import type { DiseaseIncident } from "../../../types/DiseaseIncident";
import { DiseaseIncidentStatus } from "../../../types/DiseaseIncident";
import { useAuth } from "../../../context/AuthContext";
import { getTasks } from "../../../api/taskApi";
import type { Task } from "../../../api/taskApi";

Chart.register(ArcElement, Tooltip, Legend);
gsap.registerPlugin(ScrollTrigger);

interface Sample {
  id: string;
  name: string;
  experimentLogId?: string;
  currentSampleStage?: string;
  notes?: string;
  reason?: string;
  executionDate?: string;
  status?: string;
  description?: string;
  dob?: string;
  statusEnum?: string;
}

interface StageDefinition {
  id: number;
  name: string;
  description?: string;
}

interface Material {
  id: number;
  name: string;
  category?: string;
  description?: string;
  unit?: string;
}

interface Chemical {
  id: number;
  name: string;
  category?: string;
  description?: string;
  concentrationUnit?: string;
}

interface StageMaterial {
  id: string;
  material: Material;
}

interface StageChemical {
  id: string;
  chemical: Chemical;
}

interface MethodStage {
  id: number;
  durationsDays: number;
  order: number;
  stageDefinition: StageDefinition;
  stageMaterials?: StageMaterial[];
  stageChemicals?: StageChemical[];
  isSampleGenerated?: boolean; // Determines if protocorm creation is allowed at this stage
}

interface Method {
  id: number;
  name: string;
  description?: string;
  totalDurationDays?: number;
  methodStages?: MethodStage[];
}

interface Batch {
  id: number;
  labRoomId?: number;
  labRoomName?: string;
  batchName?: string;
  batchSizeWidth?: number;
  batchSizeHeight?: number;
  widthUnit?: string;
  heightUnit?: string;
  status?: string;
}

interface Trait {
  name: string;
  value: number;
  unit: string;
}

interface Seedling {
  id: string;
  localName: string;
  scientificName?: string;
  description?: string;
  parentAId?: string;
  parentALocalName?: string;
  parentAScientificName?: string;
  traits?: Trait[];
  createdDate?: string;
  createdBy?: string;
}

interface ExperimentLogDetailType {
  id: string;
  name: string;
  seedling?: Seedling;
  method?: Method;
  batch?: Batch;
  expectedSampleCount?: number;
  currentStageOrder?: number;
  assignedTo?: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
  reason?: string;
  status?: string;
  createdDate?: string;
  createdBy?: string;
  updatedDate?: string;
  updatedBy?: string;
  samples?: Sample[];
  conclusion?: string;
  issues?: string;
  recommendations?: string;
  // Legacy fields for backward compatibility
  methodName?: string;
  tissueCultureBatchName?: string;
  create_date?: string;
  create_by?: string;
}

interface ApiListResponse<T> {
  value?: {
    data?: T[];
  };
  data?: T[];
}

interface ApiErrorResponse {
  title?: string;
  detail?: string;
  status?: number;
}

interface StageDistribution {
  stageName: string;
  sampleCount: number;
  percentage: number;
}

interface ExperimentLogSummary {
  experimentLogId: string;
  experimentLogName: string;
  totalSamples: number;
  expectedSamples: number;
  aliveSamples: number;
  infectedSamples: number;
  survivalRate: number;
  progressRate: number;
  stageDistribution: StageDistribution[];
  totalMonitoringLogs: number;
  pendingApprovalLogs: number;
  rejectedLogs: number;
}

const ExperimentLogDetail = () => {
  const {user} = useAuth();
  const isResearcher = user?.roleId === 2;
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [log, setLog] = useState<ExperimentLogDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [labName, setLabName] = useState<string>(
    t("experimentLog.loadingData"),
  );
  const [creator, setCreator] = useState<string>(
    t("experimentLog.loadingData"),
  );
  // Animation refs for researcher detail
  const headerRef = useRef<HTMLDivElement>(null);
  const infoCardRef = useRef<HTMLElement>(null);
  const materialsCardRef = useRef<HTMLElement>(null);
  const stagesCardRef = useRef<HTMLElement>(null);
  const samplesCardRef = useRef<HTMLElement>(null);

  const [changingStage, setChangingStage] = useState(false);
  const [changeStageError, setChangeStageError] = useState<string | null>(null);
  const [isChangeStageModalOpen, setIsChangeStageModalOpen] = useState(false);
  const [readyBatches, setReadyBatches] = useState<Batch[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [batchesError, setBatchesError] = useState<string | null>(null);
  const [currentBatchId, setCurrentBatchId] = useState<number | undefined>(
    undefined,
  );
  const [selectedBatchId, setSelectedBatchId] = useState<number | "">("");
  const [changeReason, setChangeReason] = useState("");

  // --- Disease Incidents state ---
  const [incidents, setIncidents] = useState<DiseaseIncident[]>([]);
  const [incidentsLoading, setIncidentsLoading] = useState(false);
  const [incidentsError, setIncidentsError] = useState<string | null>(null);
  const [incidentStatusFilter, setIncidentStatusFilter] = useState<
    DiseaseIncidentStatus | undefined
  >(undefined);
  // Review modal state
  const [reviewingIncident, setReviewingIncident] =
    useState<DiseaseIncident | null>(null);
  const [reviewIsConfirmed, setReviewIsConfirmed] = useState(true);
  const [reviewNote, setReviewNote] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // --- Summary tab state ---
  const [activeTab, setActiveTab] = useState<"detail" | "summary">("detail");
  const [summary, setSummary] = useState<ExperimentLogSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // --- PDF export state ---
  const [exportingProcess, setExportingProcess] = useState(false);
  const [exportingSummary, setExportingSummary] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // ----- Cancel Experiment state -----
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  
  // ----- Completion Modal state -----
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [completionConclusion, setCompletionConclusion] = useState("");
  const [completionIssues, setCompletionIssues] = useState("");
  const [completionRecommendations, setCompletionRecommendations] = useState("");
  const [isSubmittingCompletion, setIsSubmittingCompletion] = useState(false);
  const [completionError, setCompletionError] = useState<string | null>(null);
  
  const { enqueueSnackbar } = useSnackbar();

  // Xác định giai đoạn cuối cùng của phương pháp
    const lastStageOrder = (() => {
      if (!log?.method?.methodStages?.length) return undefined;
      return Math.max(...log.method.methodStages.map((s) => s.order));
    })();
  // State to track if all related tasks are completed
  const [allTasksCompleted, setAllTasksCompleted] = useState<boolean>(false);

  // Fetch and check tasks for this experiment log
  useEffect(() => {
    const fetchTasks = async () => {
      if (!id) return;
      try {
        const tasks: Task[] = await getTasks();
        const filtered = tasks.filter(
          (task) =>
            task.taskTargetType === "ExperimentLog" &&
            String(task.targetId) === String(id)
        );
        // Status can be "Completed (In Time)" or "Completed (Out Time)"
        const allCompleted =
          filtered.length > 0 &&
          filtered.every((task) =>
            String(task.status).toLowerCase().includes("completed")
          );
        setAllTasksCompleted(allCompleted);
      } catch {
        setAllTasksCompleted(false);
      }
    };
    fetchTasks();
  }, [id]);

    // Kiểm tra có phải đang ở giai đoạn cuối cùng không
    const isLastStage =
      log?.currentStageOrder !== undefined &&
      lastStageOrder !== undefined &&
      log.currentStageOrder === lastStageOrder;

    // Mở modal hoàn thành nhật ký thí nghiệm
    const handleOpenCompletionModal = () => {
      setIsCompletionModalOpen(true);
      setCompletionConclusion("");
      setCompletionIssues("");
      setCompletionRecommendations("");
      setCompletionError(null);
    };

    // Đóng modal hoàn thành
    const closeCompletionModal = () => {
      if (isSubmittingCompletion) return;
      setIsCompletionModalOpen(false);
    };

    // Submit hoàn thành nhật ký thí nghiệm
    const handleSubmitCompletion = async () => {
      if (!id) return;
      setIsSubmittingCompletion(true);
      setCompletionError(null);
      try {
        const payload = {
          status: "Completed",
          conclusion: completionConclusion.trim() || undefined,
          issues: completionIssues.trim() || undefined,
          recommendations: completionRecommendations.trim() || undefined,
        };

        await axiosInstance.put(`/api/experiment-logs/${id}/status`, payload);
        // Update local log status to Completed
        const res = await axiosInstance.get(`/api/experiment-logs/${id}`);
        setLog(res.data.value ?? res.data);
        setIsCompletionModalOpen(false);
        enqueueSnackbar(t("experimentLog.completed") || "Hoàn thành thí nghiệm", { variant: "success" });
      } catch (e) {
        const axiosError = e as AxiosError<ApiErrorResponse>;
        const apiDetail = axiosError.response?.data?.detail?.trim();
        const apiTitle = axiosError.response?.data?.title?.trim();
        const message = apiDetail ?? apiTitle ?? t("common.errorLoading");
        setCompletionError(message);
        enqueueSnackbar(message, {autoHideDuration: 1000, variant: "warning" });
      } finally {
        setIsSubmittingCompletion(false);
      }
    };

  const downloadPdf = async (type: "process" | "summary") => {
    if (!id) return;
    const setExporting =
      type === "process" ? setExportingProcess : setExportingSummary;
    setExporting(true);
    setExportError(null);
    try {
      const res = await axiosInstance.get(
        `/api/experiment-logs/${id}/report?type=${type}`,
        { responseType: "blob" },
      );
      const blob = new Blob([res.data as BlobPart], {
        type: "application/pdf",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `experiment-log-${id}-${type}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setExportError("Không thể xuất PDF. Vui lòng thử lại.");
    } finally {
      setExporting(false);
    }
  };

  const parseBatchId = (value: unknown): number | undefined => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number.parseInt(value, 10);
      if (!Number.isNaN(parsed)) return parsed;
    }
    return undefined;
  };

  const fetchSummary = async () => {
    if (!id) return;
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const res = await axiosInstance.get(`/api/experiment-logs/${id}/summary`);
      setSummary((res.data?.value ?? res.data) as ExperimentLogSummary);
    } catch {
      setSummaryError(t("common.errorLoading"));
    } finally {
      setSummaryLoading(false);
    }
  };

  const fetchIncidents = async () => {
    if (!id) return;
    setIncidentsLoading(true);
    setIncidentsError(null);
    try {
      const data = await getDiseaseIncidents({
        experimentLogId: id,
        status: incidentStatusFilter,
      });
      console.log("Fetched incidents:", data.data);
      setIncidents(data.data ?? []);
    } catch {
      setIncidentsError(t("diseaseIncident.loadError"));
    } finally {
      setIncidentsLoading(false);
    }
  };

  const openReviewModal = (incident: DiseaseIncident) => {
    setReviewingIncident(incident);
    setReviewIsConfirmed(true);
    setReviewNote("");
    setReviewError(null);
  };

  const closeReviewModal = () => {
    if (reviewSubmitting) return;
    setReviewingIncident(null);
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
      void fetchIncidents();
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
        return "incident-status ai-detected";
      case DiseaseIncidentStatus.UnderReview:
        return "incident-status under-review";
      case DiseaseIncidentStatus.Confirmed:
        return "incident-status confirmed";
      case DiseaseIncidentStatus.Dismissed:
        return "incident-status dismissed";
      default:
        return "incident-status";
    }
  };

  const fetchReadyBatches = async (preferredBatchId?: number) => {
    setBatchesLoading(true);
    setBatchesError(null);
    try {
      const res = await axiosInstance.get(
        "/api/batches?pageNo=1&pageSize=1000",
      );
      const raw = res.data as ApiListResponse<Batch> | Batch[];

      let batches: Batch[] = [];
      if ((raw as ApiListResponse<Batch>)?.value?.data) {
        batches = (raw as ApiListResponse<Batch>).value?.data ?? [];
      } else if ((raw as ApiListResponse<Batch>)?.data) {
        batches = (raw as ApiListResponse<Batch>).data ?? [];
      } else if (Array.isArray(raw)) {
        batches = raw;
      }

      const readyOnly = batches.filter(
        (batch) => String(batch.status ?? "").toLowerCase() === "ready",
      );

      if (
        preferredBatchId !== undefined &&
        !readyOnly.some((batch) => batch.id === preferredBatchId)
      ) {
        const currentBatch = batches.find(
          (batch) => batch.id === preferredBatchId,
        );
        if (currentBatch) {
          setReadyBatches([currentBatch, ...readyOnly]);
        } else {
          setReadyBatches(readyOnly);
        }
      } else {
        setReadyBatches(readyOnly);
      }
    } catch (error) {
      console.error("Error loading ready batches:", error);
      setBatchesError(t("common.errorLoading"));
      setReadyBatches([]);
    } finally {
      setBatchesLoading(false);
    }
  };

  const openChangeStageModal = () => {
    setIsChangeStageModalOpen(true);
    setChangeStageError(null);
    setChangeReason("");
    setSelectedBatchId(currentBatchId ?? "");
    void fetchReadyBatches(currentBatchId);
  };

  const closeChangeStageModal = () => {
    if (changingStage) return;
    setIsChangeStageModalOpen(false);
  };

  const handleChangeStage = async () => {
    if (!id || selectedBatchId === "") {
      setChangeStageError("Vui lòng chọn lồng thí nghiệm.");
      return;
    }

    const requestBatchId =
      currentBatchId !== undefined && selectedBatchId === currentBatchId
        ? null
        : selectedBatchId;

    setChangingStage(true);
    setChangeStageError(null);
    try {
      await axiosInstance.put(`/api/experiment-logs/${id}/status`, {
        status: "ConfirmChangeStage",
        batchId: requestBatchId,
        reason: changeReason.trim() || null,
      });

      const res = await axiosInstance.get(`/api/experiment-logs/${id}`);
      const logData = res.data.value ?? res.data;
      setLog(logData as ExperimentLogDetailType);
      setCurrentBatchId(selectedBatchId);
      setIsChangeStageModalOpen(false);
    } catch (e) {
      console.error(e);
      const axiosError = e as AxiosError<ApiErrorResponse>;
      const apiDetail = axiosError.response?.data?.detail?.trim();
      const apiTitle = axiosError.response?.data?.title?.trim();
      setChangeStageError(apiDetail ?? apiTitle ?? t("common.errorLoading"));
    } finally {
      setChangingStage(false);
    }
  };
  // ----- Cancel Experiment handler -----
  const handleCancelExperiment = async () => {
    setCancelLoading(true);
    try {
      // API expects a JSON string body containing the reason
      const payload = cancelReason.trim() ? cancelReason.trim() : '';
      await axiosInstance.delete(`/api/experiment-logs/${id}`, {
        data: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
      });
      enqueueSnackbar(t('common.success') || 'Thí nghiệm đã được hủy', { variant: 'success' });
      // Refresh log data after cancel
      const res = await axiosInstance.get(`/api/experiment-logs/${id}`);
      setLog(res.data.value ?? res.data);
      setIsCancelModalOpen(false);
    } catch (e) {
      enqueueSnackbar(t('common.error') || 'Lỗi khi hủy thí nghiệm', { variant: 'error' });
    } finally {
      setCancelLoading(false);
    }
  };
  const samples = log?.samples ?? [];
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    axiosInstance
      .get(`/api/experiment-logs/${id}`)
      .then((res) => {
        const logData = res.data.value ?? res.data;
        const anyLog = logData as Record<string, unknown>;
        const normalized: Partial<ExperimentLogDetailType> = {
          ...(anyLog as unknown as Partial<ExperimentLogDetailType>),
          createdDate:
            (anyLog.createdDate as string | undefined) ??
            (anyLog.create_date as string | undefined),
        };
        setLog(normalized as ExperimentLogDetailType);
      })
      .catch(() => setError(t("common.errorLoading")))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    void fetchIncidents();
  }, [id, incidentStatusFilter]);

  useEffect(() => {
    if (!id || activeTab !== "summary") return;
    void fetchSummary();
  }, [id, activeTab]);

  useEffect(() => {
    if (!log) return;
    const rawLog = log as unknown as Record<string, unknown>;
    const inferredBatchId =
      parseBatchId(log.batch?.id) ??
      parseBatchId(rawLog.tissueCultureBatchId) ??
      parseBatchId(rawLog.tissueCultureBatchID);

    setCurrentBatchId(inferredBatchId);
    setSelectedBatchId(inferredBatchId ?? "");
  }, [log]);

  useEffect(() => {
    if (!log) return;
    const tcbId =
      ((log as unknown as Record<string, unknown>)
        ?.tissueCultureBatchId as string) ??
      ((log as unknown as Record<string, unknown>)
        ?.tissueCultureBatchID as string);
    if (tcbId) {
      axiosInstance
        .get(`/api/tissue-culture-batch/${tcbId}`)
        .then((res) => {
          const raw = res.data;
          const name =
            (raw?.value?.labName as string) ?? (raw?.labName as string);
          setLabName(name ?? t("experimentLog.notAvailable"));

          const fetchedBatchId = parseBatchId(
            raw?.value?.id ?? raw?.id ?? tcbId,
          );
          if (fetchedBatchId !== undefined) {
            setCurrentBatchId(fetchedBatchId);
            setSelectedBatchId(fetchedBatchId);
          }
        })
        .catch(() => {
          setLabName(t("experimentLog.notAvailable"));
        });
    }
  }, [log]);

  useEffect(() => {
    const creatorId = log?.createdBy ?? log?.create_by;
    if (creatorId) {
      axiosInstance
        .get(`/api/user/${creatorId}`)
        .then((res) => {
          const raw = res.data;
          // API returns either { value: User } or User directly
          const userData: User | undefined = raw?.value ?? raw;
          setCreator(userData?.name ?? t("experimentLog.notAvailable"));
        })
        .catch(() => setCreator(t("experimentLog.notAvailable")));
    }
  }, [log]);

  useLayoutEffect(() => {
    if (!log || loading) return;

    const ctx = gsap.context(() => {
      // Animation đơn giản chỉ fade in - KHÔNG dùng transform để tránh ẩn content
      gsap.from(headerRef.current, {
        opacity: 0,
        duration: 0.5,
        ease: "power2.out",
      });

      gsap.from(infoCardRef.current, {
        opacity: 0,
        duration: 0.5,
        delay: 0.1,
        ease: "power2.out",
      });

      // Materials card - chỉ fade in
      if (materialsCardRef.current) {
        gsap.from(materialsCardRef.current, {
          opacity: 0,
          duration: 0.5,
          delay: 0.2,
          ease: "power2.out",
        });
      }

      // Stages card - chỉ fade in
      if (stagesCardRef.current) {
        gsap.from(stagesCardRef.current, {
          opacity: 0,
          duration: 0.5,
          delay: 0.3,
          ease: "power2.out",
        });
      }

      // Samples card - chỉ fade in
      if (samplesCardRef.current) {
        gsap.from(samplesCardRef.current, {
          opacity: 0,
          duration: 0.5,
          delay: 0.4,
          ease: "power2.out",
        });
      }

      // Hover animations cho cards - nhẹ nhàng hơn
      const allCards = document.querySelectorAll(".stage-card, .sample-card");
      allCards.forEach((card) => {
        card.addEventListener("mouseenter", () => {
          gsap.to(card, {
            y: -3,
            duration: 0.2,
            ease: "power2.out",
          });
        });
        card.addEventListener("mouseleave", () => {
          gsap.to(card, {
            y: 0,
            duration: 0.2,
            ease: "power2.out",
          });
        });
      });
    });

    return () => ctx.revert(); // Cleanup animations
  }, [log, loading]);

  if (loading)
    return (
      <main id="experimentlog-detail">
        <div className="loading-state">{t("experimentLog.loadingData")}</div>
      </main>
    );
  if (error)
    return (
      <main id="experimentlog-detail">
        <div className="error-state">{error}</div>
      </main>
    );
  if (!log)
    return (
      <main id="experimentlog-detail">
        <div className="no-data-state">{t("common.noData")}</div>
      </main>
    );

  // Hiển thị seedling (nếu có) hoặc hybridizations (nếu có)
  const renderSelectedSeedlings = () => {
    // New API structure: seedling is a single object
    if (log.seedling) {
      return (
        <div className="seedling-content">
          <div>
            • {log.seedling.localName || t("experimentLog.notAvailable")}
            {log.seedling.scientificName && (
              <span style={{ color: "#6b7280" }}>
                {" "}
                ({log.seedling.scientificName})
              </span>
            )}
          </div>
          {log.seedling.parentALocalName && (
            <div
              style={{
                fontSize: "0.875rem",
                color: "#6b7280",
                marginLeft: "1rem",
              }}
            >
              {t("experimentLog.parent") || "Cây mẹ"}:{" "}
              {log.seedling.parentALocalName}
              {log.seedling.parentAScientificName && (
                <span> ({log.seedling.parentAScientificName})</span>
              )}
            </div>
          )}
        </div>
      );
    }
    return (
      <div style={{ color: "#6b7280" }}>{t("experimentLog.noSeedlings")}</div>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return t("experimentLog.notAvailable");
    try {
      return new Date(dateString).toLocaleDateString("vi-VN");
    } catch {
      return dateString;
    }
  };

  // Status helpers (matching technician detail)
  const normalizeStatus = (status?: number | string): string => {
    const statusStr = String(status ?? "");
    switch (statusStr) {
      case "Created":
        return "Created";
      case "InProgress":
        return "InProgress";
      case "WaitingForChangeStage":
        return "WaitingForChangeStage";
      case "Completed":
        return "Completed";
      case "Destroyed":
        return "Destroyed";
      case "ExecutedBecauseOfDisease":
        return "ExecutedBecauseOfDisease";
      default:
        return statusStr;
    }
  };
  // Unified badge helper using the shared SAMPLE_STATUS_MAP.
  // Returns the full class name (base + suffix) and translated label.
  const getSampleBadge = (status?: string | number) => {
    const normalized = normalizeStatus(status);
    const entry = SAMPLE_STATUS_MAP[normalized];
    const className = entry
      ? `status-badge ${entry.classSuffix}`
      : "status-badge created"; // fallback to created style
    const label = entry ? t(entry.labelKey) : t("common.none");
    return { className, label };
  };

  // Lấy stage hiện tại từ log (dựa vào currentStageOrder và methodStages)
  const getCurrentStageName = (): string => {
    if (!log?.method?.methodStages || log.currentStageOrder === undefined) {
      return t("experimentLog.notAvailable");
    }
    const currentMethodStage = log.method.methodStages.find(
      (stage) => stage.order === log.currentStageOrder,
    );
    return (
      currentMethodStage?.stageDefinition?.name ??
      t("experimentLog.notAvailable")
    );
  };
  const currentStage = getCurrentStageName();

  // Lấy hóa chất và dụng cụ của giai đoạn hiện tại

  const methodName =
    log?.method?.name ?? log?.methodName ?? t("experimentLog.notAvailable");

  // Helper to get batch/tissue culture batch name
  const batchName =
    log?.batch?.batchName ??
    log?.tissueCultureBatchName ??
    t("experimentLog.notAvailable");

  // Helper to get lab room name
  const labRoomName = log?.batch?.labRoomName ?? labName;
  const getBatchOptionLabel = (batch: Batch): string => {
    const name = batch.batchName ?? `Batch #${batch.id}`;
    const room = batch.labRoomName ? ` - ${batch.labRoomName}` : "";
    const current =
      currentBatchId !== undefined && batch.id === currentBatchId
        ? " (Đang dùng)"
        : "";
    return `${name}${room}${current}`;
  };

  const currentMethodStage = log.method?.methodStages?.find(
    (stage) => stage.order === log.currentStageOrder,
  );
  const stageChemicals = currentMethodStage?.stageChemicals ?? [];
  const stageMaterials = currentMethodStage?.stageMaterials ?? [];
  // Group materials by category
  const materialsByCategory = stageMaterials.reduce(
    (acc, sm) => {
      const category = sm.material?.category ?? t("common.other") ?? "Khác";
      if (!acc[category]) acc[category] = [];
      acc[category].push(sm.material);
      return acc;
    },
    {} as Record<string, Material[]>,
  );
  // Group chemicals by category
  const chemicalsByCategory = stageChemicals.reduce(
    (acc, sc) => {
      const category = sc.chemical?.category ?? t("common.other") ?? "Khác";
      if (!acc[category]) acc[category] = [];
      acc[category].push(sc.chemical);
      return acc;
    },
    {} as Record<string, Chemical[]>,
  );

  return (
    <main id="experimentlog-detail">
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        <div className="detail-header" ref={headerRef}>
          <button
            type="button"
            className="back-button"
            onClick={() => void navigate("/researcher/experiment-log")}
          >
            &larr;
          </button>
          <h1 className="detail-title">
            {t("experimentLog.detailTitle")}{" "}
            <span className="experiment-name">- {log.name}</span>
          </h1>
          <div className="action-buttons">
            {exportError && (
              <span
                style={{
                  color: "#dc2626",
                  fontSize: "0.85rem",
                  alignSelf: "center",
                }}
              >
                {exportError}
              </span>
            )}
            {normalizeStatus(log.status) === "Completed" && (
              <>
                <button
                  type="button"
                  className="btn-start"
                  style={{ minWidth: 160 }}
                  disabled={exportingProcess}
                  onClick={() => void downloadPdf("process")}
                >
                  {exportingProcess ? "Đang xuất..." : "Xuất nhật ký quy trình"}
                </button>
                <button
                  type="button"
                  className="btn-start"
                  style={{ minWidth: 160 }}
                  disabled={exportingSummary}
                  onClick={() => void downloadPdf("summary")}
                >
                  {exportingSummary ? "Đang xuất..." : "Xuất báo cáo tổng kết"}
                </button>
              </>
            )}
            {/* Nút hoàn thành nhật ký thí nghiệm cho researcher */}
            {isResearcher && normalizeStatus(log.status) === "InProgress" && isLastStage && allTasksCompleted && (
              <button
                type="button"
                onClick={handleOpenCompletionModal}
                disabled={isSubmittingCompletion}
                className="btn-start"
                style={{ minWidth: 180 }}
              >
                {isSubmittingCompletion ? (t("common.processing") || "Đang xử lý...") : (t("experimentLog.completeExperiment") || "Hoàn thành thí nghiệm")}
              </button>
            )}
            <button
              type="button"
              className="btn-start"
              style={{ minWidth: 120 }}
              onClick={() => {
                /* Create Task logic here */
              }}
            >
              Tạo công việc
            </button>
            {/* Cancel Experiment button - visible when > 50% samples have status ExecutedBecauseOfDisease and status is InProgress */}
            {(() => {
              const cancelledSamplesCount = samples.filter(
                (s) => s.status === SampleStatus.ExecutedBecauseOfDisease,
              ).length;
              const cancelledPercentage =
                samples.length > 0 ? (cancelledSamplesCount / samples.length) * 100 : 0;
              return (
                samples.length > 0 &&
                cancelledPercentage > 50 &&
                isResearcher &&
                normalizeStatus(log.status) === "InProgress" && (
                  <button
                    type="button"
                    className="btn-start"
                    style={{ minWidth: 140, backgroundColor: '#ef4444', color: '#fff' }}
                    onClick={() => setIsCancelModalOpen(true)}
                  >
                    Hủy thí nghiệm
                  </button>
                )
              );
            })()}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="tab-bar">
        <button
          type="button"
          className={`tab-btn${activeTab === "detail" ? " active" : ""}`}
          onClick={() => {
            setActiveTab("detail");
          }}
        >
          {t("experimentLog.tabDetail")}
        </button>
        <button
          type="button"
          className={`tab-btn${activeTab === "summary" ? " active" : ""}`}
          onClick={() => {
            setActiveTab("summary");
          }}
        >
          {t("experimentLog.tabSummary")}
        </button>
      </div>

      {activeTab === "detail" && (
        <>
          <section className="info-card" ref={infoCardRef}>
            <div className="info-grid">
              <div className="info-column">
                <div className="info-item">
                  <span className="info-label">
                    {t("experimentLog.method")}:{" "}
                  </span>
                  <span className="info-value">{methodName}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">
                    {t("experimentLog.tissueCultureBatch")}:{" "}
                  </span>
                  <span className="info-value">{batchName}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">
                    {t("experimentLog.labRoom")}:{" "}
                  </span>
                  <span className="info-value">{labRoomName}</span>
                </div>
                <div
                  className="info-item"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <span className="info-label">{t("common.status")}: </span>
                  {/* Unified badge for log status */}
                  {(() => {
                    const badge = getSampleBadge(log.status);
                    return (
                      <span className={badge.className}>{badge.label}</span>
                    );
                  })()}
                </div>
                <div className="info-item">
                  <span className="info-label">
                    {t("experimentLog.expectedSampleCount")}:{" "}
                  </span>
                  <span className="info-value">{log.expectedSampleCount}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">
                    {t("experimentLog.dateCreated")}:{" "}
                  </span>
                  <span className="info-value">
                    {formatDate(log.createdDate)}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">
                    {t("experimentLog.creator")}:{" "}
                  </span>
                  <span className="info-value">{creator}</span>
                </div>
                <div
                  className="info-item"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <span className="info-label">
                    {t("experimentLog.currentStage") || "Giai đoạn hiện tại"}:
                  </span>
                  <span className="current-stage">{currentStage}</span>
                  {normalizeStatus(log.status) === "WaitingForChangeStage" && (
                    <button
                      type="button"
                      className="btn-start"
                      style={{ minWidth: 120, marginLeft: 8 }}
                      onClick={openChangeStageModal}
                      disabled={changingStage}
                    >
                      {t("experimentLog.changeStage") || "Chuyển giai đoạn"}
                    </button>
                  )}
                  {changeStageError && (
                    <div
                      style={{ color: "red", marginLeft: 8, fontSize: "0.9em" }}
                    >
                      {changeStageError}
                    </div>
                  )}
                </div>
              </div>
              <div className="info-column">
                {log.notes && (
                  <div className="info-item">
                    <span className="info-label">
                      {t("common.description")}:{" "}
                    </span>
                    <span className="info-value">{log.notes}</span>
                  </div>
                )}
                <div className="seedling-box">
                  <h3 className="seedling-title">
                    {t("experimentLog.selectedSeedlings")}
                  </h3>
                  {renderSelectedSeedlings()}
                </div>
              </div>
            </div>
          </section>

          {/* Completion Details Section - shown when status is Completed */}
          {normalizeStatus(log.status) === "Completed" && (log.conclusion || log.issues || log.recommendations) && (
            <section className="info-card" style={{ marginTop: "1rem" }}>
              <h2 style={{ marginBottom: "1rem", fontSize: "1.125rem", fontWeight: 600 }}>
                {t("experimentLog.completionDetails") || "Thông tin hoàn thành"}
              </h2>
              <div className="info-grid">
                {log.conclusion && (
                  <div className="info-column">
                    <div className="info-item">
                      <span className="info-label">
                        {t("experimentLog.conclusion") || "Kết luận"}:{" "}
                      </span>
                      <span className="info-value" style={{ whiteSpace: "pre-wrap" }}>
                        {log.conclusion}
                      </span>
                    </div>
                  </div>
                )}
                {log.issues && (
                  <div className="info-column">
                    <div className="info-item">
                      <span className="info-label">
                        {t("experimentLog.issues") || "Vấn đề gặp phải"}:{" "}
                      </span>
                      <span className="info-value" style={{ whiteSpace: "pre-wrap" }}>
                        {log.issues}
                      </span>
                    </div>
                  </div>
                )}
                {log.recommendations && (
                  <div className="info-column">
                    <div className="info-item">
                      <span className="info-label">
                        {t("experimentLog.recommendations") || "Đề xuất"}:{" "}
                      </span>
                      <span className="info-value" style={{ whiteSpace: "pre-wrap" }}>
                        {log.recommendations}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          <section className="materials-card" ref={materialsCardRef}>
            <h2 className="materials-title">
              {t("experimentLog.chemicalsAndMaterials") ||
                "Hóa chất và dụng cụ của giai đoạn hiện tại"}
              <span className="stage-indicator">
                ({currentMethodStage?.stageDefinition?.name ?? currentStage})
              </span>
            </h2>
            <div className="materials-grid">
              <div>
                <h3 className="material-section-title">
                  <span className="material-icon chemical-icon">🧪</span>
                  {t("experimentLog.chemicalsUsed") || "Hóa chất sử dụng"}
                  <span className="material-count">
                    ({stageChemicals.length})
                  </span>
                </h3>
                {stageChemicals.length === 0 ? (
                  <p className="no-materials">
                    {t("experimentLog.noChemicals") || "Không có hóa chất"}
                  </p>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                    }}
                  >
                    {Object.entries(chemicalsByCategory).map(
                      ([category, chemicals]) => (
                        <div key={category} className="material-category">
                          <p className="category-name">{category}</p>
                          <ul className="material-list">
                            {chemicals.map((chem) => (
                              <li key={chem.id} className="material-item">
                                <span className="material-bullet chemical">
                                  •
                                </span>
                                <div>
                                  <span className="material-name">
                                    {chem.name}
                                  </span>
                                  {chem.concentrationUnit && (
                                    <span className="material-unit">
                                      ({chem.concentrationUnit})
                                    </span>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </div>
              <div>
                <h3 className="material-section-title">
                  <span className="material-icon equipment-icon">🔧</span>
                  {t("experimentLog.materialsUsed") || "Dụng cụ sử dụng"}
                  <span className="material-count">
                    ({stageMaterials.length})
                  </span>
                </h3>
                {stageMaterials.length === 0 ? (
                  <p className="no-materials">
                    {t("experimentLog.noMaterials") || "Không có dụng cụ"}
                  </p>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                    }}
                  >
                    {Object.entries(materialsByCategory).map(
                      ([category, materials]) => (
                        <div key={category} className="material-category">
                          <p className="category-name">{category}</p>
                          <ul className="material-list">
                            {materials.map((mat) => (
                              <li key={mat.id} className="material-item">
                                <span className="material-bullet equipment">
                                  •
                                </span>
                                <div>
                                  <span className="material-name">
                                    {mat.name}
                                  </span>
                                  {mat.unit && (
                                    <span className="material-unit">
                                      ({mat.unit})
                                    </span>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>
          {/* Stages Section - from method.methodStages */}
          {log.method?.methodStages && log.method.methodStages.length > 0 && (
            <section ref={stagesCardRef} className="stages-card">
              <h2 className="stages-title">
                {t("experimentLog.stages") || "Các giai đoạn"}
              </h2>
              <div className="stages-grid">
                {log.method.methodStages
                  .sort((a, b) => a.order - b.order)
                  .map((stage) => {
                    const isCurrentStage =
                      stage.order === log.currentStageOrder;
                    return (
                      <div
                        key={stage.id}
                        className={`stage-card ${isCurrentStage ? "current" : "normal"}`}
                      >
                        <div className="stage-header">
                          <span
                            className={`stage-number ${isCurrentStage ? "current" : "normal"}`}
                          >
                            {stage.order}
                          </span>
                          <span className="stage-name">
                            {stage.stageDefinition?.name ||
                              t("experimentLog.notAvailable")}
                          </span>
                          {isCurrentStage && (
                            <span className="current-badge">
                              {t("experimentLog.currentStage") || "Hiện tại"}
                            </span>
                          )}
                        </div>
                        {stage.stageDefinition?.description && (
                          <p className="stage-description">
                            {stage.stageDefinition.description}
                          </p>
                        )}
                        <div className="stage-tags">
                          {stage.durationsDays && (
                            <span className="stage-tag">
                              {t("experimentLog.duration") || "Thời gian"}:{" "}
                              {stage.durationsDays} {t("common.days") || "ngày"}
                            </span>
                          )}
                          {/* isSampleGenerated indicator */}
                          <span
                            className={`stage-tag sample-generation ${stage.isSampleGenerated ? "enabled" : "disabled"}`}
                          >
                            <FaSeedling style={{ fontSize: "10px" }} />
                            {stage.isSampleGenerated
                              ? t("experimentLog.canGenerateSample") ||
                                "Sinh chồi"
                              : t("experimentLog.noSampleGeneration") ||
                                "Không sinh chồi"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </section>
          )}

          <section ref={samplesCardRef} className="samples-card">
            <h2 className="samples-title">
              {t("experimentLog.sampleList") || "Danh sách mẫu vật"}
            </h2>
            {samples.length === 0 ? (
              <div className="samples-empty">
                {t("experimentLog.noSamples") || "Chưa có mẫu vật nào"}
              </div>
            ) : (
              <div className="samples-grid">
                {samples.map((sample) => (
                  <div
                    key={sample.id}
                    className="sample-card"
                    onClick={() =>
                      navigate(`/researcher/samples/${sample.id}`, {
                        state: {
                          from: "researcherExperimentLogDetail",
                          experimentLogId: id,
                        },
                      })
                    }
                    style={{ cursor: "pointer" }}
                  >
                    <div className="sample-name">{sample.name}</div>
                    {sample.description && (
                      <div className="sample-description">
                        {sample.description}
                      </div>
                    )}
                    {sample.dob && (
                      <div className="sample-date">
                        {t("experimentLog.dateCreated") || "Ngày tạo"}:{" "}
                        {formatDate(sample.dob)}
                      </div>
                    )}
                    <div className="sample-status">
                      {/* Unified badge for sample status */}
                      {(() => {
                        const badge = getSampleBadge(
                          sample.status ?? sample.statusEnum,
                        );
                        return (
                          <span className={badge.className}>
                            {badge.label}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Disease Incidents Section */}
          <section className="samples-card" style={{ marginTop: "1.5rem" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                marginBottom: "1rem",
                flexWrap: "wrap",
              }}
            >
              <h2 className="samples-title" style={{ margin: 0 }}>
                {t("diseaseIncident.title")}
              </h2>
              {incidents.some(
                (inc) => inc.status === DiseaseIncidentStatus.AIDetected,
              ) && (
                <span
                  style={{
                    background: "#ef4444",
                    color: "#fff",
                    borderRadius: "999px",
                    padding: "2px 10px",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                  }}
                >
                  ● {t("diseaseIncident.badge")}
                </span>
              )}
              <div
                style={{ marginLeft: "auto", display: "flex", gap: "0.5rem" }}
              >
                <select
                  value={incidentStatusFilter ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setIncidentStatusFilter(
                      val === ""
                        ? undefined
                        : (val as DiseaseIncidentStatus),
                    );
                  }}
                  style={{
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    padding: "4px 10px",
                    fontSize: "0.875rem",
                    cursor: "pointer",
                  }}
                >
                  <option value="">{t("diseaseIncident.filterAll")}</option>
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
                <button
                  type="button"
                  className="btn-start"
                  style={{ minWidth: 80 }}
                  onClick={() => void fetchIncidents()}
                  disabled={incidentsLoading}
                >
                  {incidentsLoading ? t("common.loading") : t("common.filter")}
                </button>
              </div>
            </div>

            {incidentsError && (
              <p
                style={{
                  color: "#ef4444",
                  fontSize: "0.875rem",
                  marginBottom: "0.5rem",
                }}
              >
                {incidentsError}
              </p>
            )}

            {incidentsLoading ? (
              <div className="loading-state" style={{ padding: "1.5rem 0" }}>
                {t("common.loadingData")}
              </div>
            ) : incidents.length === 0 ? (
              <div className="samples-empty">
                {t("diseaseIncident.noIncidents")}
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "0.9rem",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background: "#f9fafb",
                        borderBottom: "2px solid #e5e7eb",
                      }}
                    >
                      <th style={{ padding: "10px 12px", textAlign: "left" }}>
                        {t("diseaseIncident.sampleName")}
                      </th>
                      <th style={{ padding: "10px 12px", textAlign: "left" }}>
                        {t("diseaseIncident.diseaseName")}
                      </th>
                      <th style={{ padding: "10px 12px", textAlign: "left" }}>
                        {t("diseaseIncident.aiConfidence")}
                      </th>
                      <th style={{ padding: "10px 12px", textAlign: "left" }}>
                        {t("diseaseIncident.status")}
                      </th>
                      <th style={{ padding: "10px 12px", textAlign: "left" }}>
                        {t("diseaseIncident.action")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {incidents.map((inc) => (
                      <tr
                        key={inc.id}
                        style={{ borderBottom: "1px solid #f3f4f6" }}
                      >
                        <td style={{ padding: "10px 12px" }}>
                          {inc.sampleName}
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          {inc.diseaseName}
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <span
                            style={{
                              fontWeight: 600,
                              color:
                                inc.aiConfidence >= 0.8
                                  ? "#ef4444"
                                  : inc.aiConfidence >= 0.5
                                    ? "#f59e0b"
                                    : "#6b7280",
                            }}
                          >
                            {(inc.aiConfidence * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <span className={getIncidentStatusClass(inc.status)}>
                            {getIncidentStatusLabel(inc.status)}
                          </span>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          {(inc.status === DiseaseIncidentStatus.AIDetected ||
                            inc.status ===
                              DiseaseIncidentStatus.UnderReview) && (
                            <button
                              type="button"
                              className="btn-start"
                              style={{ minWidth: 90, fontSize: "0.82rem" }}
                              onClick={() => openReviewModal(inc)}
                            >
                              {t("diseaseIncident.review")}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {/* Completion Modal */}
      {isCompletionModalOpen && (
        <div className="modal-backdrop" onClick={closeCompletionModal}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h3 className="modal-title">{t("experimentLog.completeExperiment") || "Hoàn thành thí nghiệm"}</h3>
                <button type="button" className="modal-close" onClick={closeCompletionModal} disabled={isSubmittingCompletion}>×</button>
              </div>
              <div className="modal-body">
                <div>
                  <label className="modal-label" htmlFor="completion-conclusion">
                    {t("experimentLog.conclusion") || "Kết luận"}
                  </label>
                  <textarea
                    id="completion-conclusion"
                    className="modal-textarea"
                    value={completionConclusion}
                    onChange={e => setCompletionConclusion(e.target.value)}
                    rows={3}
                    placeholder={t("experimentLog.conclusionPlaceholder") || "Nhập kết luận (tùy chọn)"}
                    disabled={isSubmittingCompletion}
                  />
                </div>
                <div>
                  <label className="modal-label" htmlFor="completion-issues">
                    {t("experimentLog.issues") || "Vấn đề gặp phải"}
                  </label>
                  <textarea
                    id="completion-issues"
                    className="modal-textarea"
                    value={completionIssues}
                    onChange={e => setCompletionIssues(e.target.value)}
                    rows={3}
                    placeholder={t("experimentLog.issuesPlaceholder") || "Nhập các vấn đề gặp phải (tùy chọn)"}
                    disabled={isSubmittingCompletion}
                  />
                </div>
                <div>
                  <label className="modal-label" htmlFor="completion-recommendations">
                    {t("experimentLog.recommendations") || "Đề xuất"}
                  </label>
                  <textarea
                    id="completion-recommendations"
                    className="modal-textarea"
                    value={completionRecommendations}
                    onChange={e => setCompletionRecommendations(e.target.value)}
                    rows={3}
                    placeholder={t("experimentLog.recommendationsPlaceholder") || "Nhập các đề xuất (tùy chọn)"}
                    disabled={isSubmittingCompletion}
                  />
                </div>
                {completionError && (
                  <p className="modal-error" style={{ marginBottom: 0 }}>
                    {completionError}
                  </p>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={closeCompletionModal} disabled={isSubmittingCompletion}>{t("common.cancel") || "Hủy"}</button>
                <button type="button" className="btn-start" onClick={handleSubmitCompletion} disabled={isSubmittingCompletion}>{isSubmittingCompletion ? t("common.loading") : (t("experimentLog.completeExperiment") || "Hoàn thành")}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Experiment Modal */}
      {isCancelModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsCancelModalOpen(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h3 className="modal-title">{t("experimentLog.cancelExperiment") || "Hủy thí nghiệm"}</h3>
                <button type="button" className="modal-close" onClick={() => setIsCancelModalOpen(false)} disabled={cancelLoading}>×</button>
              </div>
              <div className="modal-body">
                <label className="modal-label" htmlFor="cancel-reason">{t("common.reason") || "Lý do"}</label>
                <textarea id="cancel-reason" className="modal-textarea" value={cancelReason} onChange={e => setCancelReason(e.target.value)} rows={3} placeholder={t("common.reason") || "Nhập lý do"} disabled={cancelLoading} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setIsCancelModalOpen(false)} disabled={cancelLoading}>{t("common.cancel") || "Hủy"}</button>
                <button type="button" className="btn-start" onClick={handleCancelExperiment} disabled={cancelLoading}>{cancelLoading ? t("common.loading") : t("experimentLog.cancelExperiment")}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "summary" && (
        <section className="summary-section">
          {summaryLoading && (
            <div
              style={{
                textAlign: "center",
                padding: "40px 0",
                color: "#6b7280",
              }}
            >
              Đang tải tổng quan...
            </div>
          )}
          {summaryError && (
            <div
              style={{
                textAlign: "center",
                padding: "40px 0",
                color: "#dc2626",
              }}
            >
              {summaryError}
            </div>
          )}
          {!summaryLoading && !summaryError && summary && (
            <>
              {/* Stat cards */}
              <div className="summary-stat-cards">
                <div className="summary-stat-card">
                  <span className="summary-stat-label">Tổng số mẫu</span>
                  <span className="summary-stat-value">
                    {summary.totalSamples}
                  </span>
                </div>
                <div className="summary-stat-card green">
                  <span className="summary-stat-label">Còn sống</span>
                  <span className="summary-stat-value">
                    {summary.aliveSamples}
                  </span>
                </div>
                <div className="summary-stat-card red">
                  <span className="summary-stat-label">Nhiễm bệnh</span>
                  <span className="summary-stat-value">
                    {summary.infectedSamples}
                  </span>
                </div>
                <div className="summary-stat-card blue">
                  <span className="summary-stat-label">Tỉ lệ sống</span>
                  <span className="summary-stat-value">
                    {summary.survivalRate.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="summary-progress-section">
                <div className="summary-progress-label">
                  Tiến độ: {summary.progressRate.toFixed(1)}% so với mục tiêu (
                  {summary.expectedSamples} mẫu)
                </div>
                <div className="summary-progress-bar-bg">
                  <div
                    className="summary-progress-bar-fill"
                    style={{ width: `${Math.min(summary.progressRate, 100)}%` }}
                  />
                </div>
              </div>

              {/* Bottom row: stage chart + monitoring log stats */}
              <div className="summary-bottom-row">
                <div className="summary-chart-section">
                  <span className="summary-section-title">
                    Phân bố giai đoạn
                  </span>
                  {summary.stageDistribution.length > 0 ? (
                    <div style={{ width: 260, height: 260 }}>
                      <Doughnut
                        data={{
                          labels: summary.stageDistribution.map(
                            (s) => s.stageName,
                          ),
                          datasets: [
                            {
                              data: summary.stageDistribution.map(
                                (s) => s.sampleCount,
                              ),
                              backgroundColor: [
                                "#16a34a",
                                "#2563eb",
                                "#f59e0b",
                                "#ef4444",
                                "#8b5cf6",
                                "#06b6d4",
                                "#f97316",
                              ],
                              borderWidth: 2,
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          plugins: { legend: { position: "bottom" } },
                        }}
                      />
                    </div>
                  ) : (
                    <p style={{ color: "#6b7280", fontSize: "0.9rem" }}>
                      Không có dữ liệu
                    </p>
                  )}
                </div>

                <div>
                  <h4 className="summary-section-title">Phiếu theo dõi</h4>
                  <div className="summary-monitoring-cards">
                    <div className="summary-monitoring-card">
                      <span className="summary-monitoring-card-label">
                        Tổng phiếu
                      </span>
                      <span className="summary-monitoring-card-value">
                        {summary.totalMonitoringLogs}
                      </span>
                    </div>
                    <div className="summary-monitoring-card">
                      <span className="summary-monitoring-card-label">
                        Chờ duyệt
                      </span>
                      <span
                        className="summary-monitoring-card-value"
                        style={{ color: "#f59e0b" }}
                      >
                        {summary.pendingApprovalLogs}
                      </span>
                    </div>
                    <div className="summary-monitoring-card">
                      <span className="summary-monitoring-card-label">
                        Bị từ chối
                      </span>
                      <span
                        className="summary-monitoring-card-value"
                        style={{ color: "#dc2626" }}
                      >
                        {summary.rejectedLogs}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      )}

      {isChangeStageModalOpen && (
        <div className="modal-backdrop" onClick={closeChangeStageModal}>
          <div
            className="modal-container"
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h3 className="modal-title">Xác nhận chuyển giai đoạn</h3>
                <button
                  type="button"
                  className="modal-close"
                  onClick={closeChangeStageModal}
                  disabled={changingStage}
                >
                  ×
                </button>
              </div>

              <div className="modal-body">
                <div>
                  <label htmlFor="change-stage-batch" className="modal-label">
                    Batch
                    <span className="modal-required">*</span>
                  </label>
                  <select
                    id="change-stage-batch"
                    className="modal-select"
                    value={selectedBatchId}
                    onChange={(event) => {
                      const value = event.target.value;
                      setSelectedBatchId(
                        value === "" ? "" : Number.parseInt(value, 10),
                      );
                    }}
                    disabled={batchesLoading || changingStage}
                  >
                    <option value="">-- Chọn lồng thí nghiệm --</option>
                    {readyBatches.map((batch) => (
                      <option key={batch.id} value={batch.id}>
                        {getBatchOptionLabel(batch)}
                      </option>
                    ))}
                  </select>
                  {batchesLoading && (
                    <p className="modal-helper-text">
                      Đang tải danh sách lồng...
                    </p>
                  )}
                  {batchesError && (
                    <p className="modal-error">{batchesError}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="change-stage-reason" className="modal-label">
                    Lý do (tuỳ chọn)
                  </label>
                  <textarea
                    id="change-stage-reason"
                    className="modal-textarea"
                    value={changeReason}
                    onChange={(event) => {
                      setChangeReason(event.target.value);
                    }}
                    rows={3}
                    placeholder="Nhập lý do nếu cần"
                    disabled={changingStage}
                  />
                </div>

                {changeStageError && (
                  <p className="modal-error" style={{ marginBottom: 0 }}>
                    {changeStageError}
                  </p>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={closeChangeStageModal}
                  disabled={changingStage}
                >
                  Huỷ
                </button>
                <button
                  type="button"
                  className="btn-start"
                  onClick={handleChangeStage}
                  disabled={changingStage || selectedBatchId === ""}
                >
                  {changingStage
                    ? t("experimentLog.changingStage") || "Đang chuyển..."
                    : "Xác nhận chuyển"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Review Disease Incident Modal */}
      {reviewingIncident && (
        <div className="modal-backdrop" onClick={closeReviewModal}>
          <div
            className="modal-container"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 520 }}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h3 className="modal-title">
                  {t("diseaseIncident.reviewModalTitle")}
                </h3>
                <button
                  type="button"
                  className="modal-close"
                  onClick={closeReviewModal}
                  disabled={reviewSubmitting}
                >
                  ×
                </button>
              </div>

              <div className="modal-body">
                <div
                  style={{
                    background: "#f9fafb",
                    borderRadius: 8,
                    padding: "12px 14px",
                    marginBottom: "1rem",
                    fontSize: "0.9rem",
                    lineHeight: 1.7,
                  }}
                >
                  <div>
                    <strong>{t("diseaseIncident.sampleName")}:</strong>{" "}
                    {reviewingIncident.sampleName}
                  </div>
                  <div>
                    <strong>{t("diseaseIncident.diseaseName")}:</strong>{" "}
                    {reviewingIncident.diseaseName}
                  </div>
                  <div>
                    <strong>{t("diseaseIncident.aiConfidence")}:</strong>{" "}
                    {(reviewingIncident.aiConfidence * 100).toFixed(1)}%
                  </div>
                </div>

                <div style={{ marginBottom: "1rem" }}>
                  <label className="modal-label">
                    {t("diseaseIncident.reviewDecision")}
                  </label>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                      marginTop: "0.4rem",
                    }}
                  >
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="radio"
                        name="review-decision"
                        checked={reviewIsConfirmed}
                        onChange={() => setReviewIsConfirmed(true)}
                        disabled={reviewSubmitting}
                      />
                      <span>{t("diseaseIncident.reviewConfirm")}</span>
                    </label>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="radio"
                        name="review-decision"
                        checked={!reviewIsConfirmed}
                        onChange={() => setReviewIsConfirmed(false)}
                        disabled={reviewSubmitting}
                      />
                      <span>{t("diseaseIncident.reviewDismiss")}</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label htmlFor="review-note" className="modal-label">
                    {t("diseaseIncident.reviewNote")}
                  </label>
                  <textarea
                    id="review-note"
                    className="modal-textarea"
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    rows={3}
                    placeholder={t("diseaseIncident.reviewNotePlaceholder")}
                    disabled={reviewSubmitting}
                  />
                </div>

                {reviewError && (
                  <p className="modal-error" style={{ marginBottom: 0 }}>
                    {reviewError}
                  </p>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={closeReviewModal}
                  disabled={reviewSubmitting}
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="button"
                  className="btn-start"
                  onClick={() => void handleSubmitReview()}
                  disabled={reviewSubmitting}
                >
                  {reviewSubmitting
                    ? t("diseaseIncident.submitting")
                    : t("diseaseIncident.submitReview")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
export default ExperimentLogDetail;
