/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { useEffect, useState } from "react";
import { useSnackbar } from "notistack";
import { useNavigate, useParams } from "react-router-dom";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import type { AxiosError } from "axios";
import { SampleStatus } from "../../../types/Sample";
import { SAMPLE_STATUS_MAP } from "../../../utils/sampleStatus";
import { useTranslation } from "react-i18next";
import axiosInstance from "../../../api/axiosInstance";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  ArrowLeft, FileText, FlaskConical, ShieldAlert, CheckCircle2,
  AlertCircle, Activity, Loader2, Leaf, Download, X,
  Beaker, Trash2, ClipboardCheck, ChevronDown,
} from "lucide-react";
import { getDiseaseIncidents, reviewDiseaseIncident } from "../../../api/diseaseIncidentApi";
import type { DiseaseIncident } from "../../../types/DiseaseIncident";
import { DiseaseIncidentStatus } from "../../../types/DiseaseIncident";
import { useAuth } from "../../../context/AuthContext";
import { getTasks } from "../../../api/taskApi";
import type { Task } from "../../../api/taskApi";
import "./ExperimentLogDetail.css";

Chart.register(ArcElement, Tooltip, Legend);

/* ─── Interfaces ─── */
interface Sample {
  id: string; name: string; experimentLogId?: string; currentSampleStage?: string;
  notes?: string; reason?: string; executionDate?: string; status?: string;
  description?: string; dob?: string; statusEnum?: string;
}
interface StageDefinition { id: number; name: string; description?: string; }
interface Material { id: number; name: string; category?: string; description?: string; unit?: string; }
interface Chemical { id: number; name: string; category?: string; description?: string; concentrationUnit?: string; }
interface StageMaterial { id: string; material: Material; }
interface StageChemical { id: string; chemical: Chemical; }
interface MethodStage {
  id: number; durationsDays: number; order: number; stageDefinition: StageDefinition;
  stageMaterials?: StageMaterial[]; stageChemicals?: StageChemical[]; isSampleGenerated?: boolean;
}
interface Method { id: number; name: string; description?: string; totalDurationDays?: number; methodStages?: MethodStage[]; }
interface Batch { id: number; labRoomId?: number; labRoomName?: string; batchName?: string; batchSizeWidth?: number; batchSizeHeight?: number; widthUnit?: string; heightUnit?: string; status?: string; }
interface Trait { name: string; value: number; unit: string; }
interface Seedling { id: string; localName: string; scientificName?: string; description?: string; parentAId?: string; parentALocalName?: string; parentAScientificName?: string; traits?: Trait[]; createdDate?: string; createdBy?: string; }
interface ExperimentLogDetailType {
  id: string; name: string; seedling?: Seedling; method?: Method; batch?: Batch;
  expectedSampleCount?: number; currentStageOrder?: number; assignedTo?: string;
  startDate?: string; endDate?: string; notes?: string; reason?: string; status?: string;
  createdDate?: string; createdBy?: string; updatedDate?: string; updatedBy?: string;
  samples?: Sample[]; conclusion?: string; issues?: string; recommendations?: string;
  methodName?: string; tissueCultureBatchName?: string; create_date?: string; create_by?: string;
}
interface ApiErrorResponse { title?: string; detail?: string; status?: number; }
interface StageDistribution { stageName: string; sampleCount: number; percentage: number; }
interface ExperimentLogSummary {
  experimentLogId: string; experimentLogName: string; totalSamples: number; expectedSamples: number;
  aliveSamples: number; infectedSamples: number; survivalRate: number; progressRate: number;
  stageDistribution: StageDistribution[]; totalMonitoringLogs: number; pendingApprovalLogs: number; rejectedLogs: number;
}

/* ─── Animations ─── */
const staggerContainer: Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const fadeInUp: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } } };

const inputClass = "form-input-control";
const labelClass = "form-label-control";

const ExperimentLogDetail = () => {
  const { user } = useAuth();
  const isResearcher = user?.roleId === 2;
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [log, setLog] = useState<ExperimentLogDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setLabName] = useState<string>(t("experimentLog.loadingData"));
  const [creator, setCreator] = useState<string>(t("experimentLog.loadingData"));

  const [changingStage, setChangingStage] = useState(false);
  const [changeStageError, setChangeStageError] = useState<string | null>(null);
  const [isChangeStageModalOpen, setIsChangeStageModalOpen] = useState(false);
  // ── Batch list state ──
  const [readyBatches, setReadyBatches] = useState<Batch[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [batchesError, setBatchesError] = useState<string | null>(null);
  const [currentBatchId, setCurrentBatchId] = useState<number | undefined>(undefined);
  const [selectedBatchId, setSelectedBatchId] = useState<number | "">("");
  const [changeReason, setChangeReason] = useState("");

  const [incidents, setIncidents] = useState<DiseaseIncident[]>([]);
  const [incidentsLoading, setIncidentsLoading] = useState(false);
  const [, setIncidentsError] = useState<string | null>(null);
  const [incidentStatusFilter, setIncidentStatusFilter] = useState<DiseaseIncidentStatus | undefined>(undefined);

  const [reviewingIncident, setReviewingIncident] = useState<DiseaseIncident | null>(null);
  const [reviewIsConfirmed, setReviewIsConfirmed] = useState(true);
  const [reviewNote, setReviewNote] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"detail" | "summary">("detail");
  const [summary, setSummary] = useState<ExperimentLogSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [exportingProcess, setExportingProcess] = useState(false);
  const [exportingSummary, setExportingSummary] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelConclusion, setCancelConclusion] = useState("");
  const [cancelIssue, setCancelIssue] = useState("");
  const [cancelRecommendation, setCancelRecommendation] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);

  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [completionConclusion, setCompletionConclusion] = useState("");
  const [completionIssues, setCompletionIssues] = useState("");
  const [completionRecommendations, setCompletionRecommendations] = useState("");
  const [isSubmittingCompletion, setIsSubmittingCompletion] = useState(false);
  const [completionError, setCompletionError] = useState<string | null>(null);

  const [allTasksCompleted, setAllTasksCompleted] = useState<boolean>(false);

  const lastStageOrder = (() => {
    if (!log?.method?.methodStages?.length) return undefined;
    return Math.max(...log.method.methodStages.map((s) => s.order));
  })();

  const isLastStage = log?.currentStageOrder !== undefined && lastStageOrder !== undefined && log.currentStageOrder === lastStageOrder;

  useEffect(() => {
    const fetchTasks = async () => {
      if (!id) return;
      try {
        const tasks: Task[] = await getTasks();
        const filtered = tasks.filter((task) => task.taskTargetType === "ExperimentLog" && String(task.targetId) === String(id));
        const allCompleted = filtered.length > 0 && filtered.every((task) => String(task.status).toLowerCase().includes("completed"));
        setAllTasksCompleted(allCompleted);
      } catch {
        setAllTasksCompleted(false);
      }
    };
    fetchTasks();
  }, [id]);

  const handleSubmitCompletion = async () => {
    if (!id) return;
    setIsSubmittingCompletion(true);
    setCompletionError(null);
    try {
      const payload = { status: "Completed", conclusion: completionConclusion.trim() || undefined, issues: completionIssues.trim() || undefined, recommendations: completionRecommendations.trim() || undefined };
      await axiosInstance.put(`/api/experiment-logs/${id}/status`, payload);
      const res = await axiosInstance.get(`/api/experiment-logs/${id}`);
      setLog(res.data.value ?? res.data);
      setIsCompletionModalOpen(false);
      enqueueSnackbar(t("experimentLog.completed"), { variant: "success" });
    } catch (e) {
      const axiosError = e as AxiosError<ApiErrorResponse>;
      const apiDetail = axiosError.response?.data?.detail?.trim();
      const apiTitle = axiosError.response?.data?.title?.trim();
      const message = apiDetail ?? apiTitle ?? t("common.errorLoading");
      setCompletionError(message);
      enqueueSnackbar(message, { autoHideDuration: 1000, variant: "warning" });
    } finally {
      setIsSubmittingCompletion(false);
    }
  };

  const handleCancelExperiment = async () => {
    setCancelLoading(true);
    try {
      const payload = { reason: cancelReason.trim() || undefined, conclusion: cancelConclusion.trim() || undefined, issue: cancelIssue.trim() || undefined, recommendation: cancelRecommendation.trim() || undefined };
      await axiosInstance.delete(`/api/experiment-logs/${id}`, { data: payload, headers: { 'Content-Type': 'application/json' } });
      enqueueSnackbar(t("common.success"), { variant: "success" });
      const res = await axiosInstance.get(`/api/experiment-logs/${id}`);
      setLog(res.data.value ?? res.data);
      setIsCancelModalOpen(false);
    } catch {
      enqueueSnackbar(t("common.error"), { variant: "error" });
    } finally {
      setCancelLoading(false);
    }
  };

  const downloadPdf = async (type: "process" | "summary") => {
    if (!id) return;
    const setExporting = type === "process" ? setExportingProcess : setExportingSummary;
    setExporting(true); setExportError(null);
    try {
      const res = await axiosInstance.get(`/api/experiment-logs/${id}/report?type=${type}`, { responseType: "blob" });
      const blob = new Blob([res.data as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `experiment-log-${id}-${type}.pdf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch {
      setExportError(t("experimentLog.exportError"));
    } finally {
      setExporting(false);
    }
  };

  const parseBatchId = (value: unknown): number | undefined => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") { const parsed = Number.parseInt(value, 10); if (!Number.isNaN(parsed)) return parsed; }
    return undefined;
  };

  const fetchSummary = async () => {
    if (!id) return;
    setSummaryLoading(true); setSummaryError(null);
    try {
      const res = await axiosInstance.get(`/api/experiment-logs/${id}/summary`);
      setSummary((res.data?.value ?? res.data) as ExperimentLogSummary);
    } catch { setSummaryError(t("common.errorLoading")); } finally { setSummaryLoading(false); }
  };

  const fetchReadyBatches = async () => {
    setBatchesLoading(true);
    setBatchesError(null);
    try {
      const res = await axiosInstance.get("/api/batches", {
        params: { pageNo: 1, pageSize: 100 },
      });
      const allBatches: Batch[] = res.data?.data ?? [];
      setReadyBatches(allBatches.filter((b) => b.status === "Ready"));
    } catch {
      setBatchesError(t("common.errorLoading"));
      setReadyBatches([]);
    } finally {
      setBatchesLoading(false);
    }
  };

  const fetchIncidents = async () => {
    if (!id) return;
    setIncidentsLoading(true); setIncidentsError(null);
    try {
      const data = await getDiseaseIncidents({ experimentLogId: id, status: incidentStatusFilter });
      setIncidents(data.data ?? []);
    } catch { setIncidentsError(t("diseaseIncident.loadError")); } finally { setIncidentsLoading(false); }
  };

  const handleSubmitReview = async () => {
    if (!reviewingIncident) return;
    setReviewSubmitting(true); setReviewError(null);
    try {
      await reviewDiseaseIncident(reviewingIncident.id, { isConfirmed: reviewIsConfirmed, note: reviewNote.trim() || undefined });
      setReviewingIncident(null);
      void fetchIncidents();
    } catch { setReviewError(t("common.error")); } finally { setReviewSubmitting(false); }
  };

  const handleChangeStage = async () => {
    if (!id || selectedBatchId === "") { setChangeStageError(t("experimentLog.selectBatchRequired")); return; }
    const requestBatchId = currentBatchId !== undefined && selectedBatchId === currentBatchId ? null : selectedBatchId;
    setChangingStage(true); setChangeStageError(null);
    try {
      await axiosInstance.put(`/api/experiment-logs/${id}/status`, { status: "ConfirmChangeStage", batchId: requestBatchId, reason: changeReason.trim() || null });
      const res = await axiosInstance.get(`/api/experiment-logs/${id}`);
      setLog(res.data.value ?? res.data as ExperimentLogDetailType);
      setCurrentBatchId(selectedBatchId);
      setIsChangeStageModalOpen(false);
    } catch (e) {
      const axiosError = e as AxiosError<ApiErrorResponse>;
      setChangeStageError(axiosError.response?.data?.detail?.trim() ?? axiosError.response?.data?.title?.trim() ?? t("common.errorLoading"));
    } finally { setChangingStage(false); }
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true); setError(null);
    axiosInstance.get(`/api/experiment-logs/${id}`)
      .then((res) => {
        const logData = res.data.value ?? res.data;
        const anyLog = logData as Record<string, unknown>;
        setLog({ ...anyLog, createdDate: anyLog.createdDate ?? anyLog.create_date } as ExperimentLogDetailType);
      })
      .catch(() => setError(t("common.errorLoading")))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { if (!id) return; void fetchIncidents(); }, [id, incidentStatusFilter]);
  useEffect(() => { if (!id || activeTab !== "summary") return; void fetchSummary(); }, [id, activeTab]);

  useEffect(() => {
    if (!log) return;
    const rawLog = log as unknown as Record<string, unknown>;
    const inferredBatchId = parseBatchId(log.batch?.id) ?? parseBatchId(rawLog.tissueCultureBatchId) ?? parseBatchId(rawLog.tissueCultureBatchID);
    setCurrentBatchId(inferredBatchId); setSelectedBatchId(inferredBatchId ?? "");
  }, [log]);

  useEffect(() => {
    if (!log) return;
    const tcbId = ((log as unknown as Record<string, unknown>)?.tissueCultureBatchId as string) ?? ((log as unknown as Record<string, unknown>)?.tissueCultureBatchID as string);
    if (tcbId) {
      axiosInstance.get(`/api/batches/${tcbId}`)
        .then((res) => {
          const raw = res.data;
          setLabName((raw?.value?.labName as string) ?? (raw?.labName as string) ?? t("experimentLog.notAvailable"));
          const fetchedBatchId = parseBatchId(raw?.value?.id ?? raw?.id ?? tcbId);
          if (fetchedBatchId !== undefined) { setCurrentBatchId(fetchedBatchId); setSelectedBatchId(fetchedBatchId); }
        }).catch(() => setLabName(t("experimentLog.notAvailable")));
    }
  }, [log]);

  useEffect(() => {
    const creatorId = log?.createdBy ?? log?.create_by;
    if (creatorId) {
      axiosInstance.get(`/api/user/${creatorId}`)
        .then((res) => setCreator(res.data?.value?.name ?? res.data?.name ?? t("experimentLog.notAvailable")))
        .catch(() => setCreator(t("experimentLog.notAvailable")));
    }
  }, [log]);

  if (loading) return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] experiment-main-bg flex items-center justify-center">
      <div className="flex flex-col items-center text-blue-600 animate-pulse">
        <FileText className="w-10 h-10 mb-4 animate-bounce" />
        <p className="font-medium">{t("experimentLog.loadingData")}</p>
      </div>
    </main>
  );

  if (error || !log) return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] experiment-main-bg flex items-center justify-center">
      <div className="text-slate-500 text-center">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <p>{error ?? t("common.noData")}</p>
        <button type="button" onClick={() => navigate(-1)} className="mt-4 text-blue-600 hover:underline">{t("common.back")}</button>
      </div>
    </main>
  );

  /* ─── Derived values ─── */
  const batchName = log.batch?.batchName ?? log.tissueCultureBatchName ?? t("experimentLog.notAvailable");
  const labRoomName = log.batch?.labRoomName ?? t("experimentLog.notAvailable");

  /* ─── Modal handlers ─── */
  const openChangeStageModal = () => {
    setChangeStageError(null);
    setIsChangeStageModalOpen(true);
    void fetchReadyBatches(); // gọi API lấy danh sách lô khi mở modal
  };
  const closeChangeStageModal = () => {
    setIsChangeStageModalOpen(false);
    setChangeStageError(null);
    setChangeReason("");
    setBatchesError(null);
  };
  const openReviewModal = (incident: DiseaseIncident) => { setReviewingIncident(incident); setReviewIsConfirmed(true); setReviewNote(""); setReviewError(null); };
  const closeReviewModal = () => { setReviewingIncident(null); setReviewNote(""); setReviewError(null); };
  const closeCompletionModal = () => { setIsCompletionModalOpen(false); setCompletionConclusion(""); setCompletionIssues(""); setCompletionRecommendations(""); setCompletionError(null); };
  const closeCancelModal = () => { setIsCancelModalOpen(false); setCancelReason(""); setCancelConclusion(""); setCancelIssue(""); setCancelRecommendation(""); };

  const getBatchOptionLabel = (b: Batch): string => {
    const name = b.batchName ?? `Batch #${b.id}`;
    const room = b.labRoomName ? ` — ${b.labRoomName}` : "";
    const size = b.batchSizeWidth && b.batchSizeHeight
      ? ` (${b.batchSizeWidth}${b.widthUnit ?? ""} x ${b.batchSizeHeight}${b.heightUnit ?? ""})`
      : "";
    return `${name}${room}${size}`;
  };

  const samples = log.samples ?? [];

  const normalizeStatus = (status?: number | string): string => {
    const statusStr = String(status ?? "");
    return ["Created", "InProgress", "WaitingForChangeStage", "Completed", "Destroyed", "ExecutedBecauseOfDisease"].includes(statusStr) ? statusStr : statusStr;
  };

  const getSampleBadge = (status?: string | number) => {
    const normalized = normalizeStatus(status);
    const entry = SAMPLE_STATUS_MAP[normalized];
    return {
      className: `inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${entry ? entry.classSuffix : 'bg-slate-100 text-slate-700 border-slate-200'}`,
      label: entry ? t(entry.labelKey) : t("common.none"),
    };
  };

  const getIncidentStatusConfig = (status: DiseaseIncidentStatus) => {
    switch (status) {
      case DiseaseIncidentStatus.AIDetected: return { label: t("diseaseIncident.statusAIDetected"), class: "bg-rose-100 text-rose-700 border-rose-200" };
      case DiseaseIncidentStatus.UnderReview: return { label: t("diseaseIncident.statusUnderReview"), class: "bg-amber-100 text-amber-700 border-amber-200" };
      case DiseaseIncidentStatus.Confirmed: return { label: t("diseaseIncident.statusConfirmed"), class: "bg-blue-50 text-blue-600 border-blue-100" };
      case DiseaseIncidentStatus.Dismissed: return { label: t("diseaseIncident.statusDismissed"), class: "bg-slate-100 text-slate-600 border-slate-200" };
      default: return { label: String(status), class: "bg-slate-100 text-slate-600 border-slate-200" };
    }
  };

  const currentMethodStage = log.method?.methodStages?.find((stage) => stage.order === log.currentStageOrder);
  const currentStageName = currentMethodStage?.stageDefinition?.name ?? t("experimentLog.notAvailable");
  const stageChemicals = currentMethodStage?.stageChemicals ?? [];
  const stageMaterials = currentMethodStage?.stageMaterials ?? [];

  const materialsByCategory = stageMaterials.reduce((acc, sm) => {
    const cat = sm.material?.category ?? t("common.other");
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(sm.material);
    return acc;
  }, {} as Record<string, Material[]>);

  const chemicalsByCategory = stageChemicals.reduce((acc, sc) => {
    const cat = sc.chemical?.category ?? t("common.other");
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(sc.chemical);
    return acc;
  }, {} as Record<string, Chemical[]>);

  const formatDate = (dateString?: string) => dateString ? new Date(dateString).toLocaleDateString("vi-VN") : t("experimentLog.notAvailable");

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] experiment-main-bg p-6 lg:p-8">
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="max-w-6xl mx-auto space-y-6">

        {/* ── Header ── */}
        <motion.div variants={fadeInUp} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => navigate("/researcher/experiment-log")} className="p-2 border border-slate-300 rounded-xl text-slate-500 hover:text-blue-600 hover:border-blue-600 hover:bg-blue-50 transition-all bg-white">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-blue-900">{t("experimentLog.detailTitle")}</h1>
              <p className="text-slate-500 font-medium">{log.name}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {exportError && <span className="text-sm text-rose-600 font-medium">{exportError}</span>}
            {["Completed", "Destroyed", "ExecutedBecauseOfDisease"].includes(normalizeStatus(log.status)) && (
              <>
                <button type="button" onClick={() => void downloadPdf("process")} disabled={exportingProcess} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 shadow-sm transition-all disabled:opacity-50">
                  <Download className="w-4 h-4" />
                  {exportingProcess ? t("experimentLog.exporting") : t("experimentLog.exportProcess")}
                </button>
                <button type="button" onClick={() => void downloadPdf("summary")} disabled={exportingSummary} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 shadow-sm transition-all disabled:opacity-50">
                  <Download className="w-4 h-4" />
                  {exportingSummary ? t("experimentLog.exporting") : t("experimentLog.exportSummary")}
                </button>
              </>
            )}
            {isResearcher && normalizeStatus(log.status) === "InProgress" && isLastStage && allTasksCompleted && (
              <button type="button" onClick={() => setIsCompletionModalOpen(true)} className="btn-action-primary">
                <CheckCircle2 className="w-4 h-4" /> {t("experimentLog.completeExperiment")}
              </button>
            )}
            {samples.length > 0 && ((samples.filter(s => s.status === SampleStatus.ExecutedBecauseOfDisease).length / samples.length) * 100 > 50) && isResearcher && normalizeStatus(log.status) === "InProgress" && (
              <button type="button" onClick={() => setIsCancelModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl font-semibold hover:bg-rose-700 shadow-sm transition-all">
                <Trash2 className="w-4 h-4" /> {t("experimentLog.cancelExperiment")}
              </button>
            )}
          </div>
        </motion.div>

        {/* ── Stage Change Banner ── */}
        {normalizeStatus(log.status) === "WaitingForChangeStage" && (
          <motion.div variants={fadeInUp} className="relative overflow-hidden rounded-2xl border-2 border-blue-400 bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg shadow-blue-200">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "repeating-linear-gradient(45deg, white 0px, white 1px, transparent 0px, transparent 50%)", backgroundSize: "12px 12px" }} />
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-5">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-base">{t("experimentLog.changeStage")}</p>
                  <p className="text-blue-100 text-sm mt-0.5">{t("experimentLog.currentStage")}: <span className="font-semibold text-white">{currentStageName}</span></p>
                </div>
              </div>
              <button
                type="button"
                onClick={openChangeStageModal}
                className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 bg-white text-blue-700 font-bold rounded-xl shadow-md hover:bg-blue-50 active:scale-95 transition-all text-sm"
              >
                <ChevronDown className="w-4 h-4" />
                {t("experimentLog.changeStage")}
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Tabs ── */}
        <motion.div variants={fadeInUp} className="flex gap-2 border-b border-blue-100">
          <button type="button" onClick={() => setActiveTab("detail")} className={`experiment-tab ${activeTab === "detail" ? "experiment-tab-active" : "experiment-tab-inactive"}`}>
            {t("experimentLog.tabDetail")}
          </button>
          <button type="button" onClick={() => setActiveTab("summary")} className={`experiment-tab ${activeTab === "summary" ? "experiment-tab-active" : "experiment-tab-inactive"}`}>
            {t("experimentLog.tabSummary")}
          </button>
        </motion.div>

        {/* ── Tab: Detail ── */}
        {activeTab === "detail" && (
          <div className="space-y-6">

            {/* General Info */}
            <motion.div variants={fadeInUp} className="experiment-card">
              <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <span className="text-sm text-slate-500 font-semibold uppercase">{t("experimentLog.method")}</span>
                    <span className="text-slate-800 font-medium">{log.method?.name ?? log.methodName ?? "-"}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <span className="text-sm text-slate-500 font-semibold uppercase">{t("experimentLog.tissueCultureBatch")}</span>
                    <span className="text-slate-800 font-medium">{batchName}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <span className="text-sm text-slate-500 font-semibold uppercase">{t("experimentLog.labRoom")}</span>
                    <span className="text-slate-800 font-medium">{labRoomName}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <span className="text-sm text-slate-500 font-semibold uppercase">{t("common.status")}</span>
                    <span className={getSampleBadge(log.status).className}>{getSampleBadge(log.status).label}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <span className="text-sm text-slate-500 font-semibold uppercase">{t("experimentLog.expectedSampleCount")}</span>
                    <span className="text-slate-800 font-medium">{log.expectedSampleCount}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <span className="text-sm text-slate-500 font-semibold uppercase">{t("experimentLog.dateCreated")}</span>
                    <span className="text-slate-800 font-medium">{formatDate(log.createdDate)}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <span className="text-sm text-slate-500 font-semibold uppercase">{t("experimentLog.creator")}</span>
                    <span className="text-slate-800 font-medium">{creator}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <span className="text-sm text-slate-500 font-semibold uppercase">{t("experimentLog.currentStage")}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-blue-600 font-bold bg-blue-50 px-3 py-1 rounded-lg">{currentStageName}</span>
                      {normalizeStatus(log.status) === "WaitingForChangeStage" && (
                        <button type="button" onClick={openChangeStageModal} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-sm">
                          <ChevronDown className="w-3 h-3" /> {t("experimentLog.changeStage")}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {log.notes && (
                    <div>
                      <span className="text-sm text-slate-500 font-semibold uppercase mb-1 block">{t("common.description")}</span>
                      <p className="text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100">{log.notes}</p>
                    </div>
                  )}
                  <div className="experiment-main-bg border border-blue-100 rounded-xl p-5">
                    <h3 className="font-bold text-blue-900 flex items-center gap-2 mb-3">
                      <Leaf className="w-5 h-5 text-blue-600" /> {t("experimentLog.selectedSeedlings")}
                    </h3>
                    {log.seedling ? (
                      <div>
                        <p className="font-semibold text-slate-800">
                          {log.seedling.localName || "-"} {log.seedling.scientificName && <span className="text-slate-500 font-normal">({log.seedling.scientificName})</span>}
                        </p>
                        {log.seedling.parentALocalName && (
                          <p className="text-sm text-slate-600 mt-1">
                            {t("experimentLog.parent")}: {log.seedling.parentALocalName} {log.seedling.parentAScientificName && `(${log.seedling.parentAScientificName})`}
                          </p>
                        )}
                      </div>
                    ) : <p className="text-slate-500 italic">{t("experimentLog.noSeedlings")}</p>}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Completion Details */}
            {normalizeStatus(log.status) === "Completed" && (log.conclusion ?? log.issues ?? log.recommendations) && (
              <motion.div variants={fadeInUp} className="experiment-card p-6 md:p-8">
                <h2 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-blue-600" /> {t("experimentLog.completionDetails")}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {log.conclusion && (
                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
                      <p className="text-xs font-semibold text-emerald-700 uppercase mb-2">{t("experimentLog.conclusion")}</p>
                      <p className="text-sm text-slate-800 whitespace-pre-wrap">{log.conclusion}</p>
                    </div>
                  )}
                  {log.issues && (
                    <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl">
                      <p className="text-xs font-semibold text-rose-700 uppercase mb-2">{t("experimentLog.issues")}</p>
                      <p className="text-sm text-slate-800 whitespace-pre-wrap">{log.issues}</p>
                    </div>
                  )}
                  {log.recommendations && (
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                      <p className="text-xs font-semibold text-blue-700 uppercase mb-2">{t("experimentLog.recommendations")}</p>
                      <p className="text-sm text-slate-800 whitespace-pre-wrap">{log.recommendations}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Materials & Chemicals */}
            <motion.div variants={fadeInUp} className="experiment-card p-6 md:p-8">
              <h2 className="text-lg font-bold text-blue-900 mb-6 flex items-center gap-2">
                <Beaker className="w-5 h-5 text-blue-600" /> {t("experimentLog.chemicalsAndMaterials")}
                <span className="text-sm font-medium text-slate-500 ml-2">({currentStageName})</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Hóa chất */}
                <div>
                  <h3 className="text-md font-semibold text-purple-800 mb-4 bg-purple-50 p-3 rounded-xl flex items-center gap-2">
                    <span className="bg-purple-200 text-purple-700 w-6 h-6 flex items-center justify-center rounded-md text-xs">🧪</span>
                    {t("experimentLog.chemicalsUsed")} ({stageChemicals.length})
                  </h3>
                  {stageChemicals.length === 0 ? <p className="text-slate-500 italic text-sm">{t("experimentLog.noChemicals")}</p> : (
                    <div className="space-y-4">
                      {Object.entries(chemicalsByCategory).map(([cat, items]) => (
                        <div key={cat}>
                          <p className="text-xs font-semibold text-slate-400 uppercase mb-2">{cat}</p>
                          <ul className="space-y-2">
                            {items.map(c => (
                              <li key={c.id} className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                <span className="text-purple-500">•</span>
                                <span className="font-medium">{c.name}</span>
                                {c.concentrationUnit && <span className="text-slate-400">({c.concentrationUnit})</span>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* Dụng cụ */}
                <div>
                  <h3 className="text-md font-semibold text-amber-800 mb-4 bg-amber-50 p-3 rounded-xl flex items-center gap-2">
                    <span className="bg-amber-200 text-amber-700 w-6 h-6 flex items-center justify-center rounded-md text-xs">🔧</span>
                    {t("experimentLog.materialsUsed")} ({stageMaterials.length})
                  </h3>
                  {stageMaterials.length === 0 ? <p className="text-slate-500 italic text-sm">{t("experimentLog.noMaterials")}</p> : (
                    <div className="space-y-4">
                      {Object.entries(materialsByCategory).map(([cat, items]) => (
                        <div key={cat}>
                          <p className="text-xs font-semibold text-slate-400 uppercase mb-2">{cat}</p>
                          <ul className="space-y-2">
                            {items.map(m => (
                              <li key={m.id} className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                <span className="text-amber-500">•</span>
                                <span className="font-medium">{m.name}</span>
                                {m.unit && <span className="text-slate-400">({m.unit})</span>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Stages */}
            {log.method?.methodStages && (
              <motion.div variants={fadeInUp} className="experiment-card p-6 md:p-8">
                <h2 className="text-lg font-bold text-blue-900 mb-6 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" /> {t("experimentLog.stages")}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {log.method.methodStages.sort((a, b) => a.order - b.order).map(stage => {
                    const isCurr = stage.order === log.currentStageOrder;
                    return (
                      <div key={stage.id} className={`p-5 rounded-2xl border transition-all ${isCurr ? "bg-blue-50 border-blue-600 shadow-sm" : "bg-slate-50 border-slate-200"}`}>
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${isCurr ? "bg-blue-600 text-white" : "bg-slate-300 text-slate-600"}`}>{stage.order}</span>
                          <span className={`font-bold ${isCurr ? "text-blue-900" : "text-slate-700"}`}>{stage.stageDefinition?.name || "-"}</span>
                          {isCurr && (
                            <span className="ml-auto text-[10px] font-bold bg-blue-600 text-white px-2 py-1 rounded-md uppercase">
                              {t("experimentLog.currentLabel")}
                            </span>
                          )}
                        </div>
                        {stage.stageDefinition?.description && (
                          <p className="text-xs text-slate-500 mb-3 line-clamp-2">{stage.stageDefinition.description}</p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-auto">
                          <span className="text-[11px] font-semibold bg-white border border-slate-200 px-2 py-1 rounded-md text-slate-600">
                            {stage.durationsDays} {t("common.days")}
                          </span>
                          <span className={`text-[11px] font-semibold px-2 py-1 rounded-md border flex items-center gap-1 ${stage.isSampleGenerated ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"}`}>
                            <Leaf className="w-3 h-3" />
                            {stage.isSampleGenerated ? t("experimentLog.canGenerateSample") : t("experimentLog.noSampleGeneration")}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Samples */}
            <motion.div variants={fadeInUp} className="experiment-card p-6 md:p-8">
              <h2 className="text-lg font-bold text-blue-900 mb-6 flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-blue-600" /> {t("experimentLog.sampleList")} ({samples.length})
              </h2>
              {samples.length === 0 ? <p className="text-center text-slate-500 py-8 italic">{t("experimentLog.noSamples")}</p> : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {samples.map(s => (
                    <div key={s.id} onClick={() => navigate(`/researcher/samples/${s.id}`)} className="p-4 bg-white border border-slate-200 hover:border-blue-600 hover:shadow-md transition-all rounded-xl cursor-pointer group">
                      <p className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">{s.name}</p>
                      <p className="text-xs text-slate-500 mt-1 mb-3 truncate">{s.description ?? "-"}</p>
                      <div className="flex justify-between items-center mt-auto">
                        <span className="text-[10px] text-slate-400">{formatDate(s.dob)}</span>
                        <span className={getSampleBadge(s.status ?? s.statusEnum).className}>{getSampleBadge(s.status ?? s.statusEnum).label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Disease Incidents */}
            <motion.div variants={fadeInUp} className="experiment-card p-6 md:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <h2 className="text-lg font-bold text-blue-900 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-600" /> {t("diseaseIncident.title")}
                </h2>
                <div className="flex items-center gap-3">
                  <select value={incidentStatusFilter ?? ""} onChange={(e) => setIncidentStatusFilter(e.target.value === "" ? undefined : e.target.value as DiseaseIncidentStatus)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600/20 outline-none">
                    <option value="">{t("diseaseIncident.filterAll")}</option>
                    <option value={DiseaseIncidentStatus.AIDetected}>{t("diseaseIncident.statusAIDetected")}</option>
                    <option value={DiseaseIncidentStatus.UnderReview}>{t("diseaseIncident.statusUnderReview")}</option>
                    <option value={DiseaseIncidentStatus.Confirmed}>{t("diseaseIncident.statusConfirmed")}</option>
                    <option value={DiseaseIncidentStatus.Dismissed}>{t("diseaseIncident.statusDismissed")}</option>
                  </select>
                  <button type="button" onClick={() => fetchIncidents()} disabled={incidentsLoading} className="bg-slate-100 text-slate-700 hover:bg-slate-200 px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">
                    {incidentsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t("common.filter")}
                  </button>
                </div>
              </div>
              {incidentsLoading ? (
                <div className="py-8 text-center text-blue-600 animate-pulse font-medium">{t("common.loadingData")}</div>
              ) : incidents.length === 0 ? (
                <p className="text-center text-slate-500 py-8 italic">{t("diseaseIncident.noIncidents")}</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-3">{t("diseaseIncident.sampleName")}</th>
                        <th className="px-5 py-3">{t("diseaseIncident.diseaseName")}</th>
                        <th className="px-5 py-3 text-center">{t("diseaseIncident.aiConfidence")}</th>
                        <th className="px-5 py-3 text-center">{t("diseaseIncident.status")}</th>
                        <th className="px-5 py-3 text-center">{t("diseaseIncident.action")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {incidents.map(inc => (
                        <tr key={inc.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-3 font-medium text-slate-800">{inc.sampleName}</td>
                          <td className="px-5 py-3 text-rose-700 font-medium">{inc.diseaseName}</td>
                          <td className="px-5 py-3 text-center">
                            <span className={`font-bold ${inc.aiConfidence >= 0.8 ? "text-rose-600" : inc.aiConfidence >= 0.5 ? "text-amber-600" : "text-slate-500"}`}>
                              {(inc.aiConfidence * 100).toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-5 py-3 text-center">
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold border ${getIncidentStatusConfig(inc.status).class}`}>
                              {getIncidentStatusConfig(inc.status).label}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-center">
                            {(inc.status === DiseaseIncidentStatus.AIDetected || inc.status === DiseaseIncidentStatus.UnderReview) && (
                              <button type="button" onClick={() => openReviewModal(inc)} className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
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
            </motion.div>
          </div>
        )}

        {/* ── Tab: Summary ── */}
        {activeTab === "summary" && (
          <motion.div variants={fadeInUp} className="space-y-6">
            {summaryLoading ? (
              <div className="py-20 text-center text-blue-600 animate-pulse font-medium text-lg">
                {t("experimentLog.summaryLoading")}
              </div>
            ) : summaryError ? (
              <div className="py-20 text-center text-rose-500 font-medium text-lg">{summaryError}</div>
            ) : summary && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100 flex flex-col justify-center items-center text-center">
                    <p className="text-sm font-bold text-slate-500 uppercase mb-2">{t("experimentLog.totalSamples")}</p>
                    <p className="text-3xl font-black text-slate-800">{summary.totalSamples}</p>
                  </div>
                  <div className="bg-blue-50 p-6 rounded-2xl shadow-sm border border-blue-200 flex flex-col justify-center items-center text-center">
                    <p className="text-sm font-bold text-blue-600 uppercase mb-2">{t("experimentLog.aliveSamples")}</p>
                    <p className="text-3xl font-black text-blue-900">{summary.aliveSamples}</p>
                  </div>
                  <div className="bg-rose-50 p-6 rounded-2xl shadow-sm border border-rose-200 flex flex-col justify-center items-center text-center">
                    <p className="text-sm font-bold text-rose-700 uppercase mb-2">{t("experimentLog.infectedSamples")}</p>
                    <p className="text-3xl font-black text-rose-900">{summary.infectedSamples}</p>
                  </div>
                  <div className="bg-sky-50 p-6 rounded-2xl shadow-sm border border-sky-200 flex flex-col justify-center items-center text-center">
                    <p className="text-sm font-bold text-sky-700 uppercase mb-2">{t("experimentLog.survivalRateLabel")}</p>
                    <p className="text-3xl font-black text-sky-900">{summary.survivalRate.toFixed(1)}%</p>
                  </div>
                </div>

                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-blue-100">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center justify-between">
                    <span>{t("experimentLog.progressTitle")}</span>
                    <span className="text-sm text-slate-500 font-medium">
                      {t("experimentLog.targetLabel")}: {summary.expectedSamples} {t("experimentLog.samples")}
                    </span>
                  </h3>
                  <div className="w-full bg-slate-100 rounded-full h-4 mb-2 overflow-hidden shadow-inner">
                    <div className="bg-blue-600 h-4 rounded-full transition-all duration-1000 relative" style={{ width: `${Math.min(summary.progressRate, 100)}%` }}>
                      <div className="absolute inset-0 bg-white/20 w-full h-full" style={{ backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)', backgroundSize: '1rem 1rem' }}></div>
                    </div>
                  </div>
                  <p className="text-right text-sm font-bold text-blue-600">{summary.progressRate.toFixed(1)}%</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-blue-100 flex flex-col items-center">
                    <h3 className="font-bold text-slate-800 w-full mb-6 text-center">{t("experimentLog.stageDistribution")}</h3>
                    {summary.stageDistribution.length > 0 ? (
                      <div className="w-64 h-64">
                        <Doughnut
                          data={{
                            labels: summary.stageDistribution.map(s => s.stageName),
                            datasets: [{
                              data: summary.stageDistribution.map(s => s.sampleCount),
                              backgroundColor: ["#2563EB", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"],
                              borderWidth: 0,
                              hoverOffset: 4,
                            }],
                          }}
                          options={{ plugins: { legend: { position: "bottom", labels: { usePointStyle: true, padding: 20, font: { family: "inherit" } } } }, cutout: "70%" }}
                        />
                      </div>
                    ) : <p className="text-slate-500 italic my-auto">{t("common.noData")}</p>}
                  </div>

                  <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-blue-100 flex flex-col">
                    <h3 className="font-bold text-slate-800 mb-6">{t("experimentLog.monitoringStats")}</h3>
                    <div className="space-y-4 my-auto">
                      <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="font-semibold text-slate-600">{t("experimentLog.totalMonitoringLogs")}</span>
                        <span className="text-xl font-black text-slate-800">{summary.totalMonitoringLogs}</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-amber-50 rounded-xl border border-amber-100">
                        <span className="font-semibold text-amber-700">{t("status.waitingForApproval")}</span>
                        <span className="text-xl font-black text-amber-600">{summary.pendingApprovalLogs}</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-rose-50 rounded-xl border border-rose-100">
                        <span className="font-semibold text-rose-700">{t("monitoringLog.statusRejected")}</span>
                        <span className="text-xl font-black text-rose-600">{summary.rejectedLogs}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}

      </motion.div>

      {/* ── MODALS ── */}
      <AnimatePresence>

        {/* Change Stage Modal */}
        {isChangeStageModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeChangeStageModal} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative z-10 border border-slate-100">
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-800">{t("experimentLog.confirmChangeStageTitle")}</h3>
                <button type="button" onClick={closeChangeStageModal} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <label className={labelClass}>
                    {t("experimentLog.batchLabel")} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedBatchId}
                      onChange={(e) => setSelectedBatchId(e.target.value === "" ? "" : Number(e.target.value))}
                      disabled={batchesLoading || changingStage}
                      className={`${inputClass} appearance-none`}
                    >
                      <option value="">
                        {batchesLoading ? t("experimentLog.loadingBatches") : t("experimentLog.selectBatchPlaceholder")}
                      </option>
                      {readyBatches.map(b => (
                        <option key={b.id} value={b.id}>{getBatchOptionLabel(b)}</option>
                      ))}
                    </select>
                    {/* Icon: spinner khi loading, chevron khi không */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      {batchesLoading
                        ? <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                        : <ChevronDown className="w-5 h-5" />
                      }
                    </div>
                  </div>
                  {/* Trạng thái phụ bên dưới select */}
                  {batchesLoading && (
                    <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> {t("experimentLog.loadingBatches")}
                    </p>
                  )}
                  {batchesError && !batchesLoading && (
                    <p className="text-xs text-rose-500 mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {batchesError}
                    </p>
                  )}
                  {!batchesLoading && !batchesError && readyBatches.length === 0 && (
                    <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {t("experimentLog.noBatchesAvailable")}
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>{t("common.reason")} ({t("common.optional")})</label>
                  <textarea value={changeReason} onChange={e => setChangeReason(e.target.value)} rows={3} placeholder={t("experimentLog.changeStageReasonPlaceholder")} disabled={changingStage} className={`${inputClass} resize-none`} />
                </div>
                {changeStageError && (
                  <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />{changeStageError}
                  </div>
                )}
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={closeChangeStageModal} disabled={changingStage} className="px-5 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition-colors">
                  {t("common.cancel")}
                </button>
                <button type="button" onClick={handleChangeStage} disabled={changingStage || selectedBatchId === "" || batchesLoading} className="btn-action-primary disabled:opacity-50">
                  {changingStage ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {changingStage ? t("experimentLog.changingStage") : t("experimentLog.confirmChangeStageBtn")}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Review Incident Modal */}
        {reviewingIncident && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeReviewModal} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden relative z-10 border border-slate-100">
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-800">{t("diseaseIncident.reviewModalTitle")}</h3>
                <button type="button" onClick={closeReviewModal} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-5">
                <div className="bg-rose-50/50 border border-rose-100 p-4 rounded-xl space-y-2 text-sm text-slate-700">
                  <p><strong>{t("diseaseIncident.sampleName")}:</strong> {reviewingIncident.sampleName}</p>
                  <p><strong>{t("diseaseIncident.diseaseName")}:</strong> <span className="text-rose-600 font-bold">{reviewingIncident.diseaseName}</span></p>
                  <p><strong>{t("diseaseIncident.aiConfidence")}:</strong> <span className="font-bold">{(reviewingIncident.aiConfidence * 100).toFixed(1)}%</span></p>
                </div>
                <div>
                  <label className={labelClass}>{t("diseaseIncident.reviewDecision")}</label>
                  <div className="flex gap-4 mt-2">
                    <label className={`flex-1 p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${reviewIsConfirmed ? "bg-blue-50 border-blue-600" : "bg-white border-slate-200 hover:border-blue-600/50"}`}>
                      <input type="radio" name="review" checked={reviewIsConfirmed} onChange={() => setReviewIsConfirmed(true)} className="w-4 h-4 text-blue-600 focus:ring-blue-600 cursor-pointer" />
                      <span className={`font-semibold ${reviewIsConfirmed ? "text-blue-900" : "text-slate-600"}`}>{t("diseaseIncident.reviewConfirm")}</span>
                    </label>
                    <label className={`flex-1 p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${!reviewIsConfirmed ? "bg-slate-100 border-slate-400" : "bg-white border-slate-200 hover:border-slate-400"}`}>
                      <input type="radio" name="review" checked={!reviewIsConfirmed} onChange={() => setReviewIsConfirmed(false)} className="w-4 h-4 text-slate-600 focus:ring-slate-500 cursor-pointer" />
                      <span className={`font-semibold ${!reviewIsConfirmed ? "text-slate-800" : "text-slate-600"}`}>{t("diseaseIncident.reviewDismiss")}</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>{t("diseaseIncident.reviewNote")}</label>
                  <textarea value={reviewNote} onChange={e => setReviewNote(e.target.value)} rows={3} placeholder={t("diseaseIncident.reviewNotePlaceholder")} className={`${inputClass} resize-none`} />
                </div>
                {reviewError && <div className="text-sm text-rose-600 flex items-center gap-2"><AlertCircle className="w-4 h-4" />{reviewError}</div>}
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={closeReviewModal} className="px-5 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition-colors">{t("common.cancel")}</button>
                <button type="button" onClick={handleSubmitReview} disabled={reviewSubmitting} className="btn-action-primary disabled:opacity-50">
                  {reviewSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null} {t("diseaseIncident.submitReview")}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Completion Modal */}
        {isCompletionModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeCompletionModal} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative z-10 border border-slate-100">
              <div className="px-6 py-5 border-b border-blue-100 bg-blue-50 flex justify-between items-center">
                <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" /> {t("experimentLog.completeExperiment")}
                </h3>
                <button type="button" onClick={closeCompletionModal} className="text-blue-600 hover:bg-blue-100 p-1.5 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div>
                  <label className={labelClass}>{t("experimentLog.conclusion")}</label>
                  <textarea value={completionConclusion} onChange={e => setCompletionConclusion(e.target.value)} rows={3} placeholder={t("experimentLog.conclusionPlaceholder")} className={`${inputClass} resize-none`} />
                </div>
                <div>
                  <label className={labelClass}>{t("experimentLog.issues")}</label>
                  <textarea value={completionIssues} onChange={e => setCompletionIssues(e.target.value)} rows={3} placeholder={t("experimentLog.issuesPlaceholder")} className={`${inputClass} resize-none`} />
                </div>
                <div>
                  <label className={labelClass}>{t("experimentLog.recommendations")}</label>
                  <textarea value={completionRecommendations} onChange={e => setCompletionRecommendations(e.target.value)} rows={3} placeholder={t("experimentLog.recommendationsPlaceholder")} className={`${inputClass} resize-none`} />
                </div>
                {completionError && <div className="text-sm text-rose-600 flex items-center gap-2"><AlertCircle className="w-4 h-4" />{completionError}</div>}
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={closeCompletionModal} className="px-5 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition-colors">{t("common.cancel")}</button>
                <button type="button" onClick={handleSubmitCompletion} disabled={isSubmittingCompletion} className="btn-action-primary disabled:opacity-50">
                  {isSubmittingCompletion ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {t("experimentLog.completeExperiment")}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Cancel Experiment Modal */}
        {isCancelModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeCancelModal} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative z-10 border border-slate-100">
              <div className="px-6 py-5 border-b border-rose-100 bg-rose-50 flex justify-between items-center">
                <h3 className="text-lg font-bold text-rose-800 flex items-center gap-2">
                  <Trash2 className="w-5 h-5" /> {t("experimentLog.cancelExperiment")}
                </h3>
                <button type="button" onClick={closeCancelModal} className="text-rose-600 hover:bg-rose-100 p-1.5 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="bg-amber-50 p-4 rounded-xl text-amber-800 text-sm mb-2 border border-amber-200 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p>{t("experimentLog.cancelWarning")}</p>
                </div>
                <div>
                  <label className={labelClass}>{t("common.reason")}</label>
                  <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} rows={2} placeholder={t("experimentLog.cancelReason")} className={`${inputClass} resize-none`} />
                </div>
                <div>
                  <label className={labelClass}>{t("experimentLog.conclusion")}</label>
                  <textarea value={cancelConclusion} onChange={e => setCancelConclusion(e.target.value)} rows={2} placeholder={t("experimentLog.conclusionPlaceholder")} className={`${inputClass} resize-none`} />
                </div>
                <div>
                  <label className={labelClass}>{t("experimentLog.issues")}</label>
                  <textarea value={cancelIssue} onChange={e => setCancelIssue(e.target.value)} rows={2} placeholder={t("experimentLog.issuesPlaceholder")} className={`${inputClass} resize-none`} />
                </div>
                <div>
                  <label className={labelClass}>{t("experimentLog.recommendations")}</label>
                  <textarea value={cancelRecommendation} onChange={e => setCancelRecommendation(e.target.value)} rows={2} placeholder={t("experimentLog.recommendationsPlaceholder")} className={`${inputClass} resize-none`} />
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={closeCancelModal} className="px-5 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition-colors">{t("common.close")}</button>
                <button type="button" onClick={handleCancelExperiment} disabled={cancelLoading} className="px-5 py-2 bg-rose-600 text-white rounded-xl font-semibold hover:bg-rose-700 transition-colors flex items-center gap-2 disabled:opacity-50">
                  {cancelLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {t("experimentLog.cancelExperiment")}
                </button>
              </div>
            </motion.div>
          </div>
        )}

      </AnimatePresence>
    </main>
  );
};

export default ExperimentLogDetail;