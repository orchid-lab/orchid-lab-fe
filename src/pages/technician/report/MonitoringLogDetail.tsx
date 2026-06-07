/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-misused-promises */
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../../api/axiosInstance";
import { useAuth } from "../../../context/AuthContext";
import { useSnackbar } from "notistack";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  ArrowLeft,
  FileText,
  FlaskConical,
  Calendar,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Microscope,
  ThermometerSun,
  Edit3,
  Save,
  X,
  Activity,
  Loader2,
  Info,
} from "lucide-react";
import type {
  MonitoringLogDetail,
  LogDetail,
} from "../../../types/MonitoringLogDetail";
import { useDiseaseMap } from "../../../utils/useDiseaseMap";

/* ─── Animation variants ──────────────────────────────── */
const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function MonitoringLogDetail() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const { enqueueSnackbar } = useSnackbar();

  const [log, setLog] = useState<MonitoringLogDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [approvingOrRejecting, setApprovingOrRejecting] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [editingValues, setEditingValues] = useState<
    Record<string, number | null>
  >({});
  const [isEditing, setIsEditing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { onnxNameMap, isMapLoaded } = useDiseaseMap();

  // Phân quyền
  const isResearcher = user?.roleId === 2;
  const isTechnician = user?.roleId === 3;
  const isOwner = user?.id === log?.createdBy;
  const canEdit = isTechnician && log?.status === "Rejected" && isOwner;
  const canSubmit =
    isTechnician &&
    (log?.status === "Created" || log?.status === "Rejected") &&
    isOwner;
  const canApproveOrReject =
    isResearcher &&
    (log?.status === "WaitingForApproval" || log?.status === "Revised");

  const fetchLog = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/api/monitoring-log/${id}`);
      const logData = res.data as MonitoringLogDetail;
      setLog(logData);

      // Init editing values
      if (logData?.logDetails) {
        const values: Record<string, number | null> = {};
        logData.logDetails.forEach((detail: LogDetail) => {
          values[detail.id] = detail.measuredValue;
        });
        setEditingValues(values);
      }
    } catch (error) {
      console.error("Failed to fetch monitoring log detail:", error);
      const apiError = error as {
        response?: { data?: string; status?: number };
        message?: string;
      };
      enqueueSnackbar(
        apiError.response?.data ?? apiError.message ?? t("common.errorLoading"),
        { variant: "error" },
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchLog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleEditChange = (detailId: string, value: string) => {
    const numValue = Number(value);
    setEditingValues((prev) => ({
      ...prev,
      [detailId]: value === "" ? null : Number.isNaN(numValue) ? 0 : numValue,
    }));
  };

  const handleSaveChanges = async () => {
    if (!id || !log) return;
    const updates = Object.entries(editingValues).map(
      ([logDetailId, measuredValue]) => ({ logDetailId, measuredValue }),
    );

    setSubmitting(true);
    try {
      await axiosInstance.patch(
        `/api/monitoring-log/${id}/update-details`,
        updates,
      );
      enqueueSnackbar(t("monitoringLog.updateDetailsSuccess"), {
        variant: "success",
      });
      setIsEditing(false);
      await fetchLog();
    } catch (error) {
      console.error("Failed to update log details:", error);
      const apiError = error as {
        response?: { data?: string };
        message?: string;
      };
      enqueueSnackbar(
        apiError.response?.data ??
          apiError.message ??
          t("monitoringLog.updateDetailsFailed"),
        { variant: "error" },
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!id) return;
    setSubmitting(true);
    try {
      await axiosInstance.patch(`/api/monitoring-log/${id}/submit`);
      enqueueSnackbar(
        log?.status === "Created"
          ? t("monitoringLog.submitDraftSuccess")
          : t("monitoringLog.resubmitSuccess"),
        { variant: "success" },
      );
      await fetchLog();
    } catch (error) {
      console.error("Failed to submit:", error);
      const apiError = error as {
        response?: { data?: string };
        message?: string;
      };
      enqueueSnackbar(
        apiError.response?.data ??
          apiError.message ??
          t("monitoringLog.submitDraftFailed"),
        { variant: "error" },
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!id) return;
    setApprovingOrRejecting(true);
    try {
      const monitoringLogRes = await axiosInstance.get(
        `/api/monitoring-log/${id}`,
      );
      const monitoringLog = monitoringLogRes.data as MonitoringLogDetail;
      const sampleStageId =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (monitoringLog as any).sampleStageId ?? (log as any)?.sampleStageId;
      const imageObj =
        monitoringLog.images && monitoringLog.images.length > 0
          ? monitoringLog.images[0]
          : null;

      if (imageObj && sampleStageId) {
        const response = await fetch(imageObj.url);
        const blob = await response.blob();
        const formData = new FormData();
        formData.append("image", blob, "monitoring-log-image.jpg");
        formData.append("targetType", "SampleStage");
        formData.append("targetId", sampleStageId);
        await axiosInstance.post("/api/images", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      await axiosInstance.patch(`/api/monitoring-log/${id}/approve`);
      enqueueSnackbar(t("monitoringLog.approveSuccess"), {
        variant: "success",
      });
      await fetchLog();
    } catch (error) {
      console.error("Failed to approve:", error);
      const apiError = error as {
        response?: { data?: string };
        message?: string;
      };
      enqueueSnackbar(
        apiError.response?.data ??
          apiError.message ??
          t("monitoringLog.approveFailed"),
        { variant: "error" },
      );
    } finally {
      setApprovingOrRejecting(false);
    }
  };

  const handleReject = async () => {
    if (!id || !rejectionReason.trim()) {
      enqueueSnackbar(t("monitoringLog.rejectionReasonRequired"), {
        variant: "warning",
      });
      return;
    }
    setApprovingOrRejecting(true);
    try {
      await axiosInstance.patch(
        `/api/monitoring-log/${id}/reject`,
        JSON.stringify(rejectionReason.trim()),
        { headers: { "Content-Type": "application/json" } },
      );
      enqueueSnackbar(t("monitoringLog.rejectSuccess"), { variant: "success" });
      setShowRejectModal(false);
      setRejectionReason("");
      await fetchLog();
    } catch (error) {
      console.error("Failed to reject:", error);
      const apiError = error as {
        response?: { data?: string };
        message?: string;
      };
      enqueueSnackbar(
        apiError.response?.data ??
          apiError.message ??
          t("monitoringLog.rejectFailed"),
        { variant: "error" },
      );
    } finally {
      setApprovingOrRejecting(false);
    }
  };

  const renderStatusBadge = (status?: string) => {
    if (!status) return null;
    const configMap: Record<
      string,
      { label: string; bg: string; text: string; icon: React.ElementType }
    > = {
      Created: {
        label: t("monitoringLog.statusCreated"),
        bg: "bg-slate-100 border-slate-200",
        text: "text-slate-700",
        icon: FileText,
      },
      WaitingForApproval: {
        label: t("monitoringLog.statusWaitingForApproval"),
        bg: "bg-amber-100 border-amber-200",
        text: "text-amber-800",
        icon: Activity,
      },
      Approved: {
        label: t("monitoringLog.statusApproved"),
        bg: "bg-[#E4F0E8] border-[#C9E7D2]",
        text: "text-[#2D5A27]",
        icon: CheckCircle2,
      },
      Rejected: {
        label: t("monitoringLog.statusRejected"),
        bg: "bg-rose-100 border-rose-200",
        text: "text-rose-800",
        icon: ShieldAlert,
      },
      Revised: {
        label: t("monitoringLog.statusRevised"),
        bg: "bg-indigo-100 border-indigo-200",
        text: "text-indigo-800",
        icon: Edit3,
      },
    };

    const config = configMap[status] ?? {
      label: status,
      bg: "bg-gray-50 border-gray-200",
      text: "text-gray-700",
      icon: Info,
    };
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border ${config.bg} ${config.text}`}
      >
        <Icon className="w-4 h-4" />
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#F4F7F4] flex items-center justify-center">
        <div className="flex flex-col items-center text-[#2D5A27] animate-pulse">
          <FileText className="w-10 h-10 mb-4 animate-bounce" />
          <p className="font-medium">
            {t("common.loadingData") ?? "Đang tải báo cáo..."}
          </p>
        </div>
      </main>
    );
  }

  if (!log) {
    return (
      <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#F4F7F4] flex items-center justify-center">
        <div className="text-slate-500 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p>{t("common.noData") ?? "Không tìm thấy dữ liệu."}</p>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mt-4 text-[#2D5A27] hover:underline"
          >
            Quay lại
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
        {/* Back Button */}
        <motion.button
          variants={fadeInUp}
          type="button"
          className="flex items-center gap-2 text-slate-500 hover:text-[#2D5A27] transition-colors font-medium w-fit"
          onClick={() =>
            navigate(
              isTechnician ? `/technician/reports` : `/researcher/reports`,
            )
          }
        >
          <ArrowLeft className="w-4 h-4" />
          {t("common.back") ?? "Quay lại danh sách"}
        </motion.button>

        {/* Cảnh báo từ chối (nếu có) */}
        {log.status === "Rejected" && log.rejectionReason && (
          <motion.div
            variants={fadeInUp}
            className="p-5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-4 text-rose-800 shadow-sm"
          >
            <ShieldAlert className="w-6 h-6 mt-0.5 flex-shrink-0 text-rose-600" />
            <div>
              <h4 className="font-bold text-base mb-1">
                {t("monitoringLog.rejectionReasonLabel") ?? "Lý do từ chối:"}
              </h4>
              <p className="text-sm leading-relaxed">{log.rejectionReason}</p>
              {log.rejectedDate && (
                <p className="text-xs text-rose-500/80 mt-2 font-medium">
                  {t("monitoringLog.rejectedOn") ?? "Từ chối lúc:"}{" "}
                  {new Date(log.rejectedDate).toLocaleString("vi-VN")}
                </p>
              )}
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info Card */}
          <motion.div
            variants={fadeInUp}
            className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-[#DDEEE0] overflow-hidden"
          >
            <div className="px-6 py-5 border-b border-[#DDEEE0] bg-[#F4F7F4] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-[#2D5A27] p-1 bg-[#E4F0E8] rounded-lg" />
                <h1 className="text-xl font-bold text-[#1e3e1c]">{log.name}</h1>
              </div>
              <div className="flex flex-col items-end gap-2">
                {renderStatusBadge(log.status)}
                {log.isNewest && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#E4F0E8] text-[#2D5A27] border border-[#DDEEE0]">
                    {t("monitoringLog.newest") ?? "Mới nhất"}
                  </span>
                )}
              </div>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-5 rounded-xl border border-slate-100">
                <div>
                  <span className="block text-sm font-semibold text-slate-500 uppercase mb-1">
                    {t("monitoringLog.sampleName") ?? "Tên mẫu"}
                  </span>
                  <div className="text-lg font-medium text-slate-800 flex items-center gap-2">
                    <FlaskConical className="w-5 h-5 text-[#2D5A27]" />
                    {log.sampleName}
                  </div>
                </div>
                <div>
                  <span className="block text-sm font-semibold text-slate-500 uppercase mb-1">
                    {t("monitoringLog.sampleStage") ?? "Giai đoạn"}
                  </span>
                  <div className="text-lg font-medium text-slate-800">
                    {log.sampleStageDefinitionName}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400 border border-slate-100">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-500 uppercase">
                      {t("monitoringLog.createdDate") ?? "Ngày tạo"}
                    </span>
                    <span className="text-base font-medium text-slate-800">
                      {new Date(log.createdDate).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                </div>
                {log.updatedDate && (
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-[#E4F0E8] rounded-xl text-[#2D5A27] border border-[#DDEEE0]">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-slate-500 uppercase">
                        {t("monitoringLog.lastUpdated") ?? "Cập nhật lần cuối"}
                      </span>
                      <span className="text-base font-medium text-slate-800">
                        {new Date(log.updatedDate).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {log.diseaseName && (
                <div
                  className={`mt-4 p-4 ${log.diseaseName === "Khỏe mạnh" ? "bg-[#E4F0E8] border border-green-200" : "bg-rose-100 border border-rose-200"} rounded-xl flex items-center gap-3`}
                >
                  <AlertCircle
                    className={`w-6 h-6 ${log.diseaseName === "Khỏe mạnh" ? "text-green-600" : "text-rose-600"}`}
                  />
                  <div>
                    <span
                      className={`block text-xs font-bold ${log.diseaseName === "Khỏe mạnh" ? "text-green-700" : "text-rose-700"} uppercase`}
                    >
                      {t("monitoringLog.diseaseDetected") ??
                        "Tình trạng phát hiện"}
                      :
                    </span>
                    <span
                      className={`text-lg font-bold ${log.diseaseName === "Khỏe mạnh" ? "text-green-800" : "text-rose-800"}`}
                    >
                      {log.analyticResult &&
                      isMapLoaded &&
                      !(
                        String(
                          log.analyticResult.topDisease ?? "",
                        ).toLowerCase() === "healthy"
                      ) &&
                      !(log.analyticResult.topDisease in onnxNameMap)
                        ? "Không rõ"
                        : log.diseaseName}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Cột phải: Hình ảnh đính kèm */}
          <motion.div
            variants={fadeInUp}
            className="bg-white rounded-2xl shadow-sm border border-[#DDEEE0] overflow-hidden h-fit"
          >
            <div className="px-6 py-5 border-b border-[#DDEEE0] bg-[#F4F7F4] flex items-center gap-3">
              <Microscope className="w-5 h-5 text-[#2D5A27]" />
              <h2 className="text-lg font-bold text-[#1e3e1c]">
                {t("monitoringLog.images") ?? "Hình ảnh đính kèm"}
              </h2>
            </div>
            <div className="p-6">
              {log.images && log.images.length > 0 ? (
                <>
                  <div className="w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200 mb-4 flex-1 min-h-[200px] relative group">
                    <img
                      src={selectedImage ?? log.images[0].url}
                      alt="Selected"
                      className="w-full h-full object-cover absolute inset-0 cursor-pointer"
                      onClick={() =>
                        window.open(
                          selectedImage ?? log.images[0].url,
                          "_blank",
                        )
                      }
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <span className="px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white border border-white/50 rounded-lg text-sm font-medium">
                        Mở ảnh gốc
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar">
                    {log.images.map((img) => (
                      <button
                        key={img.id}
                        type="button"
                        onClick={() => setSelectedImage(img.url)}
                        className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${selectedImage === img.url ? "border-[#2D5A27] shadow-md scale-105" : "border-transparent opacity-70 hover:opacity-100"}`}
                      >
                        <img
                          src={img.url}
                          alt="thumb"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-[200px] flex flex-col items-center justify-center bg-slate-50 border border-slate-100 rounded-xl text-slate-400">
                  <AlertCircle className="w-10 h-10 mb-2 text-slate-300" />
                  <p className="text-sm">Không có hình ảnh đính kèm</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Analytic Result Section (AI Disease Analysis) */}
        {log.analyticResult && (
          <motion.div
            variants={fadeInUp}
            className="bg-white rounded-2xl shadow-sm border border-[#DDEEE0] overflow-hidden"
          >
            <div className="px-6 py-5 border-b border-[#DDEEE0] bg-[#F4F7F4] flex items-center gap-3">
              <Microscope className="w-5 h-5 text-[#2D5A27]" />
              <h2 className="text-lg font-bold text-[#1e3e1c]">
                {t("monitoringLog.aiDiseaseAnalysisResult") ??
                  "Kết quả Phân tích AI"}
              </h2>
            </div>
            <div className="p-6">
              {(() => {
                const ar = log.analyticResult;
                if (!ar) return null;
                const isHealthyLog =
                  String(ar.topDisease ?? "").toLowerCase() === "healthy" ||
                  (log.diseaseName ?? "").toLowerCase().includes("khỏe");
                return (
                  <div className="space-y-4">
                    <div
                      className={`p-5 rounded-xl border ${
                        isHealthyLog
                          ? "bg-[#E4F0E8] border-[#DDEEE0]"
                          : "bg-rose-50 border-rose-200"
                      } flex items-center justify-between gap-4`}
                    >
                      <div className="space-y-3 flex-1">
                        <div>
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            Giai đoạn
                          </span>
                          <p className="text-base font-bold text-[#1e3e1c] mt-0.5">
                            {log.sampleStageDefinitionName ?? "—"}
                          </p>
                        </div>
                        <div>
                          <span
                            className={`text-xs font-semibold uppercase tracking-wide ${
                              isHealthyLog ? "text-[#2D5A27]" : "text-rose-600"
                            }`}
                          >
                            Kết quả chẩn đoán
                          </span>
                          <p
                            className={`text-xl font-black mt-0.5 ${
                              isHealthyLog ? "text-[#1e3e1c]" : "text-rose-800"
                            }`}
                          >
                            {isMapLoaded &&
                            !isHealthyLog &&
                            !(ar.topDisease in onnxNameMap)
                              ? "Không rõ"
                              : (log.diseaseName ?? "—")}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`w-24 h-24 rounded-full border-4 flex flex-col items-center justify-center shadow-sm flex-shrink-0 bg-white ${
                          isHealthyLog ? "border-[#C9E7D2]" : "border-rose-200"
                        }`}
                      >
                        <span
                          className={`text-xl font-black leading-none ${
                            isHealthyLog ? "text-[#2D5A27]" : "text-rose-600"
                          }`}
                        >
                          {ar.confidence != null
                            ? `${(ar.confidence * 100).toFixed(1)}%`
                            : "—"}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-1">
                          độ tin cậy
                        </span>
                      </div>
                    </div>

                    {/* Predictions Breakdown */}
                    {ar.predictions &&
                      Object.keys(ar.predictions).length > 0 && (
                        <div className="rounded-xl border border-slate-200 overflow-hidden">
                          <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                            <Activity className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                              Phân bố xác suất bệnh
                            </span>
                          </div>
                          <div className="divide-y divide-slate-100">
                            {Object.entries(ar.predictions)
                              .filter(([onnxKey]) => onnxKey in onnxNameMap)
                              .sort(([, a], [, b]) => b - a)
                              .map(([onnxKey, prob]) => {
                                const name = onnxNameMap[onnxKey] ?? onnxKey;
                                const isTop = onnxKey === ar.topDisease;
                                const pct = prob * 100;
                                return (
                                  <div
                                    key={onnxKey}
                                    className={`flex items-center gap-3 px-4 py-3 ${
                                      isTop
                                        ? isHealthyLog
                                          ? "bg-[#f0f8f2]"
                                          : "bg-rose-50/60"
                                        : ""
                                    }`}
                                  >
                                    <span
                                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                        isTop
                                          ? isHealthyLog
                                            ? "bg-[#2D5A27]"
                                            : "bg-rose-500"
                                          : "bg-slate-300"
                                      }`}
                                    />
                                    <span
                                      className={`flex-1 text-sm truncate ${
                                        isTop
                                          ? isHealthyLog
                                            ? "font-semibold text-[#1e3e1c]"
                                            : "font-semibold text-rose-800"
                                          : "font-medium text-slate-500"
                                      }`}
                                      title={name}
                                    >
                                      {name}
                                    </span>
                                    <div className="flex items-center gap-2 w-44 flex-shrink-0">
                                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                          style={{
                                            width: `${pct.toFixed(1)}%`,
                                          }}
                                          className={`h-full rounded-full transition-all duration-500 ${
                                            isTop
                                              ? isHealthyLog
                                                ? "bg-[#2D5A27]"
                                                : "bg-rose-500"
                                              : "bg-slate-200"
                                          }`}
                                        />
                                      </div>
                                      <span
                                        className={`text-xs font-bold w-11 text-right ${
                                          isTop
                                            ? isHealthyLog
                                              ? "text-[#2D5A27]"
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
                  </div>
                );
              })()}
            </div>
          </motion.div>
        )}

        {/* Log Details Section */}
        <motion.div
          variants={fadeInUp}
          className="bg-white rounded-2xl shadow-sm border border-[#DDEEE0] overflow-hidden"
        >
          <div className="px-6 py-5 border-b border-[#DDEEE0] bg-[#F4F7F4] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ThermometerSun className="w-5 h-5 text-[#2D5A27]" />
              <h2 className="text-lg font-bold text-[#1e3e1c]">
                {t("monitoringLog.monitoringSpecifications") ??
                  "Thông số Đo đạc"}
              </h2>
            </div>
            {canEdit && !isEditing && (
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E4F0E8] text-[#2D5A27] hover:bg-[#DDEEE0] rounded-lg text-sm font-semibold transition-colors"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 className="w-4 h-4" />{" "}
                {t("common.edit") ?? "Sửa số liệu"}
              </button>
            )}
          </div>

          <div className="p-0">
            {log.logDetails.length === 0 ? (
              <div className="p-8 text-center text-slate-500 italic">
                {t("monitoringLog.noSpecificationData") ??
                  "Chưa có thông số đo đạc."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-[#F4F7F4] text-slate-600 font-semibold border-b border-[#DDEEE0]">
                    <tr>
                      <th className="px-6 py-4">
                        {t("monitoringLog.createForm.requirementName") ??
                          "Tên yêu cầu"}
                      </th>
                      <th className="px-6 py-4">
                        {t("monitoringLog.expectedValue") ?? "Dự kiến"}
                      </th>
                      <th className="px-6 py-4">
                        {t("monitoringLog.createForm.min")} -{" "}
                        {t("monitoringLog.createForm.max")}
                      </th>
                      <th className="px-6 py-4">
                        {t("monitoringLog.createForm.measuredValue") ??
                          "Thực tế"}
                      </th>
                      <th className="px-6 py-4 text-center">
                        {t("monitoringLog.match") ?? "Đạt"}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {log.logDetails.map((detail, idx) => (
                      <tr
                        key={detail.id}
                        className={`border-b border-slate-100 hover:bg-[#F4F7F4] transition-colors ${idx === log.logDetails.length - 1 ? "border-none" : ""}`}
                      >
                        <td className="px-6 py-4 font-medium text-slate-800">
                          {
                            detail.stageRequirementDefinitionDto
                              .sampleRequirementDefinitionDto.name
                          }
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {detail.stageRequirementDefinitionDto.expectedValue ??
                            "-"}{" "}
                          {
                            detail.stageRequirementDefinitionDto
                              .sampleRequirementDefinitionDto.unit
                          }
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {detail.stageRequirementDefinitionDto.minValue ?? "-"}{" "}
                          -{" "}
                          {detail.stageRequirementDefinitionDto.maxValue ?? "-"}{" "}
                          {
                            detail.stageRequirementDefinitionDto
                              .sampleRequirementDefinitionDto.unit
                          }
                        </td>
                        <td className="px-6 py-4">
                          {isEditing && canEdit ? (
                            <input
                              type="number"
                              step="any"
                              value={editingValues[detail.id] ?? ""}
                              onChange={(e) =>
                                handleEditChange(detail.id, e.target.value)
                              }
                              className="w-24 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/20 focus:border-[#2D5A27] transition-all shadow-sm"
                            />
                          ) : (
                            <span className="font-bold text-[#1e3e1c]">
                              {detail.measuredValue ?? "-"}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                              detail.isMatch
                                ? "bg-[#E4F0E8] text-[#2D5A27] border border-[#C9E7D2]"
                                : "bg-rose-100 text-rose-700 border border-rose-200"
                            }`}
                          >
                            {detail.isMatch ? "✓" : "✗"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {isEditing && canEdit && (
              <div className="p-5 border-t border-slate-100 flex items-center justify-end gap-3 bg-[#F4F7F4]">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    setIsEditing(false);
                    if (log?.logDetails) {
                      const values: Record<string, number | null> = {};
                      log.logDetails.forEach((detail: LogDetail) => {
                        values[detail.id] = detail.measuredValue;
                      });
                      setEditingValues(values);
                    }
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
                >
                  <X className="w-4 h-4" /> {t("common.cancel") ?? "Hủy"}
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void handleSaveChanges()}
                  className="flex items-center gap-1.5 px-5 py-2 bg-[#2D5A27] hover:bg-[#1e3e1c] text-white rounded-xl text-sm font-semibold transition-colors shadow-sm disabled:opacity-70"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {submitting
                    ? (t("monitoringLog.submitting") ?? "Đang lưu...")
                    : (t("common.save") ?? "Lưu thay đổi")}
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Bottom Action Buttons */}
        <motion.div
          variants={fadeInUp}
          className="flex flex-wrap items-center gap-3 pt-4"
        >
          {/* Technician Actions */}
          {isTechnician && canSubmit && (
            <button
              type="button"
              disabled={submitting}
              onClick={() => void handleSubmitForApproval()}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#2D5A27] hover:bg-[#1e3e1c] text-white rounded-xl font-semibold shadow-sm transition-all disabled:opacity-70"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {submitting
                ? (t("monitoringLog.submitting") ?? "Đang gửi...")
                : log.status === "Created"
                  ? (t("monitoringLog.submitDraft") ?? "Gửi chờ duyệt")
                  : (t("monitoringLog.resubmit") ?? "Gửi lại")}
            </button>
          )}

          {/* Researcher Actions */}
          {isResearcher && canApproveOrReject && (
            <>
              <button
                type="button"
                disabled={approvingOrRejecting}
                onClick={() => void handleApprove()}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#2D5A27] hover:bg-[#1e3e1c] text-white rounded-xl font-semibold shadow-sm transition-all disabled:opacity-70"
              >
                {approvingOrRejecting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
                {approvingOrRejecting
                  ? (t("common.processing") ?? "Đang xử lý...")
                  : (t("monitoringLog.approve") ?? "Duyệt báo cáo")}
              </button>
              <button
                type="button"
                disabled={approvingOrRejecting}
                onClick={() => setShowRejectModal(true)}
                className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold shadow-sm transition-all disabled:opacity-70"
              >
                {approvingOrRejecting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ShieldAlert className="w-5 h-5" />
                )}
                {approvingOrRejecting
                  ? (t("common.processing") ?? "Đang xử lý...")
                  : (t("monitoringLog.reject") ?? "Từ chối")}
              </button>
            </>
          )}
        </motion.div>
      </motion.div>

      {/* Rejection Reason Modal */}
      <AnimatePresence>
        {showRejectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => !approvingOrRejecting && setShowRejectModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative z-10 border border-rose-100"
            >
              <div className="px-6 py-5 border-b border-rose-50 flex justify-between items-center bg-gradient-to-r from-rose-50/50 to-transparent">
                <h3 className="text-lg font-bold text-rose-800 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-600" />
                  {t("monitoringLog.rejectReport") ?? "Từ chối báo cáo"}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  disabled={approvingOrRejecting}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    {t("monitoringLog.rejectionReasonRequired") ??
                      "Lý do từ chối (Bắt buộc)"}
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder={
                      t("monitoringLog.enterRejectionReason") ??
                      "Nhập lý do từ chối chi tiết..."
                    }
                    className="w-full border border-rose-200 bg-white rounded-xl px-4 py-3 text-sm text-slate-800 min-h-[120px] focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all shadow-sm outline-none resize-none"
                    disabled={approvingOrRejecting}
                  />
                  <p className="text-xs text-rose-500 mt-2 font-medium bg-rose-50 p-2 rounded-md">
                    <Info className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                    {t("monitoringLog.minimumCharacters") ??
                      "Yêu cầu tối thiểu 10 ký tự."}
                  </p>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <button
                  type="button"
                  className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
                  onClick={() => setShowRejectModal(false)}
                  disabled={approvingOrRejecting}
                >
                  {t("common.cancel") ?? "Hủy"}
                </button>
                <button
                  type="button"
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-all shadow-sm ${
                    rejectionReason.trim().length >= 10 && !approvingOrRejecting
                      ? "bg-rose-600 hover:bg-rose-700"
                      : "bg-slate-400 cursor-not-allowed"
                  }`}
                  onClick={() => void handleReject()}
                  disabled={
                    approvingOrRejecting || rejectionReason.trim().length < 10
                  }
                >
                  {approvingOrRejecting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ShieldAlert className="w-4 h-4" />
                  )}
                  {approvingOrRejecting
                    ? (t("common.processing") ?? "Đang xử lý...")
                    : (t("monitoringLog.reject") ?? "Từ chối")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
