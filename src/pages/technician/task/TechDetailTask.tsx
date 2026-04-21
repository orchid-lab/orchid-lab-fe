/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-x/no-array-index-key */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../../api/axiosInstance";
import { useSnackbar } from "notistack";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  ArrowLeft, ListChecks, User, FileText, FlaskConical,
  CheckCircle2, Clock, Camera, X, AlertCircle, Loader2, Target, UploadCloud
} from "lucide-react";
import type {
  TaskStatus,
  TargetType,
  CheckListItemStatus,
  TaskData,
} from "../../../types/TechnicianTask";

// ==================== Helper Functions ====================

const isDefaultDate = (dateString: string): boolean => {
  return dateString.startsWith("0001-01-01");
};

const getStatusColor = (status: TaskStatus): string => {
  const colorMap: Record<TaskStatus, string> = {
    Assigned: "bg-sky-50 text-sky-700 border-sky-200",
    InProgress: "bg-amber-50 text-amber-700 border-amber-200",
    WaitingForApproval: "bg-[#E4F0E8] text-[#2D5A27] border-[#C9E7D2]",
    CompletedInTime: "bg-emerald-50 text-emerald-700 border-emerald-200",
    CompletedOutTime: "bg-orange-50 text-orange-700 border-orange-200",
    Deleted: "bg-slate-50 text-slate-700 border-slate-200",
    DeclinedByTechnician: "bg-rose-50 text-rose-700 border-rose-200",
    ReworkRequired: "bg-purple-50 text-purple-700 border-purple-200",
  };
  return colorMap[status] ?? "bg-slate-50 text-slate-700 border-slate-200";
};

const getCheckListStatusColor = (status: CheckListItemStatus): string => {
  const colorMap: Record<CheckListItemStatus, string> = {
    Pending: "bg-slate-100 text-slate-600 border-slate-200",
    InProgress: "bg-amber-100 text-amber-700 border-amber-200",
    Complete: "bg-[#E4F0E8] text-[#2D5A27] border-[#C9E7D2]",
    Failed: "bg-rose-100 text-rose-700 border-rose-200",
  };
  return colorMap[status] ?? "bg-slate-100 text-slate-600 border-slate-200";
};

// ==================== Animation Variants ====================
const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

// ==================== Component ====================

const TechDetailTask: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation();

  // Main states
  const [taskData, setTaskData] = useState<TaskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [researcherName, setResearcherName] = useState<string>("");
  const [targetName, setTargetName] = useState<string>("");

  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [editingChecklistItem, setEditingChecklistItem] = useState<string | null>(null);
  const [checklistValues, setChecklistValues] = useState<Record<string, { measuredValue: string; measurementUnit: string }>>({});
  const [updatingChecklistItem, setUpdatingChecklistItem] = useState<string | null>(null);

  const [showChecklistReportPopup, setShowChecklistReportPopup] = useState(false);
  const [reportingChecklistItemId, setReportingChecklistItemId] = useState<string | null>(null);
  const [checklistItemSelectedFiles, setChecklistItemSelectedFiles] = useState<File[]>([]);
  const [checklistItemPreviewUrls, setChecklistItemPreviewUrls] = useState<string[]>([]);
  const [submittingChecklistItemReport, setSubmittingChecklistItemReport] = useState(false);

  // ==================== Translation Helpers ====================

  const getStatusLabel = useCallback((status: TaskStatus): string => {
    const labels: Record<TaskStatus, string> = {
      Assigned: t("common.assigned", "Assigned"),
      InProgress: t("technicianTask.checklistInProgress"),
      WaitingForApproval: t("common.waitingForApproval", "Waiting For Approval"),
      CompletedInTime: t("common.completedInTime", "Completed In Time"),
      CompletedOutTime: t("common.completedOutTime", "Completed Out Time"),
      Deleted: t("common.deleted", "Deleted"),
      DeclinedByTechnician: t("technicianTask.declineTask"),
      ReworkRequired: t("common.reworkRequired", "Rework Required"),
    };
    return labels[status] ?? status;
  }, [t]);

  const getCheckListStatusLabel = (status: CheckListItemStatus): string => {
    const labelMap: Record<CheckListItemStatus, string> = {
      Pending: t("technicianTask.checklistPending"),
      InProgress: t("technicianTask.checklistInProgress"),
      Complete: t("technicianTask.checklistComplete"),
      Failed: t("technicianTask.checklistFailed"),
    };
    return labelMap[status] ?? status;
  };

  // ==================== Fetch Data ====================

  const fetchResearcherName = useCallback(async (researcherId: string) => {
    if (!researcherId) return;
    try {
      const response = await axiosInstance.get(`/api/user/${researcherId}`);
      const data = response.data?.value ?? response.data;
      setResearcherName(data?.name ?? t("common.unknown", "Unknown"));
    } catch (error) {
      console.error("Error fetching researcher:", error);
      setResearcherName(t("common.unknown", "Unknown"));
    }
  }, [t]);

  const fetchTargetName = useCallback(async (targetType: TargetType, targetId: string) => {
    if (!targetId) return;
    try {
      let endpoint = "";
      if (targetType === "ExperimentLog") endpoint = `/api/experiment-logs/${targetId}`;
      else if (targetType === "Sample") endpoint = `/api/samples/${targetId}`;

      if (endpoint) {
        const response = await axiosInstance.get(endpoint);
        const data = response.data?.value ?? response.data;
        setTargetName(data?.name ?? t("common.unknown", "Unknown"));
      }
    } catch (error) {
      console.error("Error fetching target:", error);
      setTargetName(t("common.unknown", "Unknown"));
    }
  }, [t]);

  useEffect(() => {
    const fetchTaskDetail = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const response = await axiosInstance.get<TaskData>(`/api/tasks/${id}`);
        const data = response.data;
        if (!data?.id) throw new Error(t("common.noData", "No data received"));
        setTaskData(data);
        if (data.researcherId) void fetchResearcherName(data.researcherId);
        if (data.taskAssignments?.targetId && data.taskAssignments?.targetType) {
          void fetchTargetName(data.taskAssignments.targetType, data.taskAssignments.targetId);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : t("common.errorLoading");
        setError(errorMessage);
        enqueueSnackbar(t("task.taskDetailLoadError"), { variant: "error" });
      } finally {
        setLoading(false);
      }
    };
    void fetchTaskDetail();
  }, [id, enqueueSnackbar, t, fetchResearcherName, fetchTargetName]);

  // ==================== Actions ====================

  const isTaskOverdue = useCallback((): boolean => {
    const endDateStr = taskData?.taskAssignments?.endDate;
    if (!endDateStr || isDefaultDate(endDateStr)) return false;
    const endDate = new Date(endDateStr);
    return new Date() > endDate;
  }, [taskData]);

  const handleBack = (): void => {
    void navigate("/technician/tasks");
  };

  const updateTaskStatus = async (newStatus: number): Promise<boolean> => {
    if (!taskData?.id) return false;

    const statusMap: Record<number, TaskStatus> = {
      0: "Assigned", 1: "InProgress", 2: "WaitingForApproval", 3: "CompletedInTime",
      4: "CompletedOutTime", 5: "Deleted", 6: "DeclinedByTechnician", 7: "ReworkRequired",
    };

    const statusString = statusMap[newStatus];
    if (!statusString) {
      enqueueSnackbar(t("common.invalidStatus", "Invalid Status"), { variant: "error" });
      return false;
    }

    try {
      setUpdatingStatus(true);
      const response = await axiosInstance.put("/api/tasks/change-task-status", {
        todoTaskId: taskData.id,
        status: statusString,
      });

      if (response.status === 200) {
        setTaskData((prev) => (prev ? { ...prev, status: statusString } : null));
        let successMessage = `${t("common.statusUpdated")}: ${getStatusLabel(statusString)}`;
        if (newStatus === 2) successMessage = t("technicianTask.requestApprovalSuccess") || "Yêu cầu duyệt thành công";
        enqueueSnackbar(successMessage, { variant: "success" });
        return true;
      }
      return false;
    } catch (error: any) {
      const backendMessage = error.response?.data ?? error.message ?? t("technicianTask.updateFailed");
      enqueueSnackbar(backendMessage, { variant: "error", autoHideDuration: 5000 });
      return false;
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAcceptTask = () => {
    if (isTaskOverdue()) {
      enqueueSnackbar(t("task.overdueWarning", "Cannot accept overdue task"), { variant: "warning" });
      return;
    }
    void updateTaskStatus(1);
  };

  const handleDeclineTask = () => void updateTaskStatus(6);

  const handleCompleteTask = async () => {
    const isStatusUpdated = await updateTaskStatus(2);
    if (isStatusUpdated) setShowSuccessModal(true);
  };

  // ==================== Checklist Handlers ====================

  const handleStartChecklistItem = async (itemId: string) => {
    if (!taskData?.id) return;
    try {
      setUpdatingChecklistItem(itemId);
      await axiosInstance.post(`/api/tasks/${taskData.id}/checklist-items/${itemId}`);
      setTaskData((prev) => {
        if (!prev?.taskCheckList) return prev;
        return {
          ...prev,
          taskCheckList: {
            ...prev.taskCheckList,
            checkListItemDtos: prev.taskCheckList.checkListItemDtos.map((item) =>
              item.id === itemId ? { ...item, status: "InProgress" as CheckListItemStatus } : item
            ),
          },
        };
      });
      setEditingChecklistItem(itemId);
      const currentItem = taskData.taskCheckList?.checkListItemDtos.find((item) => item.id === itemId);
      setChecklistValues((prev) => ({
        ...prev,
        [itemId]: { measuredValue: "", measurementUnit: currentItem?.expectedUnit ?? "" },
      }));
      enqueueSnackbar(t("technicianTask.startCriteriaSuccess"), { variant: "success" });
    } catch (error: any) {
      const backendMessage = error.response?.data ?? error.message ?? t("technicianTask.startCriteriaFailed");
      enqueueSnackbar(backendMessage, { variant: "error" });
    } finally {
      setUpdatingChecklistItem(null);
    }
  };

  const handleChecklistValueChange = (itemId: string, field: "measuredValue" | "measurementUnit", value: string) => {
    setChecklistValues((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value },
    }));
  };

  const handleCompleteChecklistItem = async (itemId: string) => {
    const values = checklistValues[itemId];
    if (!values || !taskData?.id) return;

    const currentItem = taskData.taskCheckList?.checkListItemDtos.find((item) => item.id === itemId);
    const rawMeasuredValue = values.measuredValue ?? "";
    const measuredValue = rawMeasuredValue.trim() === "" ? null : parseFloat(rawMeasuredValue);

    if (measuredValue !== null && isNaN(measuredValue)) {
      enqueueSnackbar(t("technicianTask.measuredValueMustBeNumber"), { variant: "error" });
      return;
    }

    const measurementUnit = values.measurementUnit.trim() === "" ? currentItem?.expectedUnit?.trim() ?? null : values.measurementUnit;

    try {
      setUpdatingChecklistItem(itemId);
      await axiosInstance.put(
        `/api/tasks/${taskData.id}/checklist-items/${itemId}/update-actual-value`,
        { measurementUnit, measuredValue }
      );

      let isPass: boolean | null = null;
      if (measuredValue !== null && currentItem?.expectedMinValue != null && currentItem?.expectedMaxValue != null) {
        isPass = measuredValue >= currentItem.expectedMinValue && measuredValue <= currentItem.expectedMaxValue;
      }

      setTaskData((prev) => {
        if (!prev?.taskCheckList) return prev;
        return {
          ...prev,
          taskCheckList: {
            ...prev.taskCheckList,
            checkListItemDtos: prev.taskCheckList.checkListItemDtos.map((item) =>
              item.id === itemId ? { ...item, mesuredValue: measuredValue, measurementUnit, status: "Complete", isPass } : item
            ),
          },
        };
      });
      setEditingChecklistItem(null);
      enqueueSnackbar(t("technicianTask.criteriaCompleteSuccess"), { variant: "success" });
    } catch (error: any) {
      enqueueSnackbar(error.response?.data ?? t("technicianTask.updateFailed"), { variant: "error" });
    } finally {
      setUpdatingChecklistItem(null);
    }
  };

  const handleChecklistItemFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    setChecklistItemSelectedFiles((prev) => [...prev, ...files]);
    setChecklistItemPreviewUrls((prev) => [...prev, ...files.map((file) => URL.createObjectURL(file))]);
    event.target.value = "";
  };

  const handleRemoveChecklistItemImage = (index: number) => {
    setChecklistItemPreviewUrls((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, idx) => idx !== index);
    });
    setChecklistItemSelectedFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmitChecklistItemReport = async () => {
    if (checklistItemSelectedFiles.length === 0 || !taskData?.id || !reportingChecklistItemId) {
      enqueueSnackbar(t("technicianTask.uploadAtLeastOneImage"), { variant: "error" });
      return;
    }
    try {
      setSubmittingChecklistItemReport(true);
      for (const file of checklistItemSelectedFiles) {
        const formData = new FormData();
        formData.append("image", file);
        formData.append("targetType", "Task");
        formData.append("targetId", taskData.id);
        await axiosInstance.post("/api/images", formData, { headers: { "Content-Type": "multipart/form-data" } });
      }
      await handleCompleteChecklistItem(reportingChecklistItemId);
      setShowChecklistReportPopup(false);
      setChecklistItemSelectedFiles([]);
      setChecklistItemPreviewUrls([]);
      enqueueSnackbar(t("technicianTask.submitEvidenceSuccess"), { variant: "success" });
    } catch (error: any) {
      enqueueSnackbar(error.response?.data ?? t("technicianTask.submitReportFailed"), { variant: "error" });
    } finally {
      setSubmittingChecklistItemReport(false);
    }
  };

  // ==================== Logic States ====================

  const canEditChecklist = () => taskData?.status === "InProgress" || taskData?.status === "ReworkRequired";
  const areAllChecklistItemsCompleted = () => {
    const items = taskData?.taskCheckList?.checkListItemDtos;
    return !items || items.length === 0 || items.every((item) => item.status === "Complete");
  };
  const canCompleteTask = () => canEditChecklist() && areAllChecklistItemsCompleted();
  const isTaskCompleted = () => ["WaitingForApproval", "CompletedInTime", "CompletedOutTime", "Deleted", "DeclinedByTechnician"].includes(taskData?.status ?? "");

  // ==================== Render ====================

  if (loading) return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#F4F7F4] flex items-center justify-center">
      <div className="flex flex-col items-center text-[#2D5A27] animate-pulse">
        <ListChecks className="w-12 h-12 mb-4 animate-bounce" />
        <p className="font-medium text-lg">{t("common.loading")}</p>
      </div>
    </main>
  );

  if (error || !taskData) return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#F4F7F4] flex items-center justify-center p-8">
      <div className="text-center max-w-md bg-white p-8 rounded-2xl shadow-sm border border-rose-200">
        <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
        <p className="text-rose-600 font-semibold text-lg mb-6">{error ?? t("task.taskDataNotFound")}</p>
        <button type="button" onClick={handleBack} className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium">
          {t("common.back")}
        </button>
      </div>
    </main>
  );

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#F4F7F4] p-6 lg:p-8 text-slate-800">
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="max-w-6xl mx-auto space-y-6">
        
        {/* Nút Quay lại */}
        <motion.button variants={fadeInUp} type="button" onClick={handleBack} className="flex items-center gap-2 text-slate-500 hover:text-[#2D5A27] transition-colors font-medium w-fit">
          <ArrowLeft className="w-4 h-4" /> {t("common.back")}
        </motion.button>

        {/* Header Task */}
        <motion.div variants={fadeInUp} className="bg-white rounded-2xl p-6 shadow-sm border border-[#DDEEE0] flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#E4F0E8] text-[#2D5A27] rounded-xl shadow-inner">
              <ListChecks className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-[#1e3e1c]">{taskData.name}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${getStatusColor(taskData.status)}`}>
                  {getStatusLabel(taskData.status)}
                </span>
                {isTaskOverdue() && <span className="px-2.5 py-1 rounded-md text-xs font-bold border bg-rose-50 text-rose-700 border-rose-200">Quá hạn</span>}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {taskData.status === "Assigned" && (
              <>
                <button type="button" onClick={handleAcceptTask} disabled={updatingStatus} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2D5A27] text-white hover:bg-[#1e3e1c] transition-colors font-semibold shadow-sm disabled:opacity-70">
                  {updatingStatus && <Loader2 className="w-4 h-4 animate-spin"/>} {t("technicianTask.acceptTask")}
                </button>
                <button type="button" onClick={handleDeclineTask} disabled={updatingStatus} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-colors font-semibold shadow-sm disabled:opacity-70">
                  {t("technicianTask.declineTask")}
                </button>
              </>
            )}
            {!["Assigned", "Deleted", "DeclinedByTechnician"].includes(taskData.status) && (
              <button 
                type="button" 
                onClick={handleCompleteTask} 
                disabled={!canCompleteTask() || updatingStatus || isTaskCompleted()} 
                title={!areAllChecklistItemsCompleted() ? t("technicianTask.completeAllChecklistFirst") : undefined}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold shadow-sm transition-all ${canCompleteTask() && !isTaskCompleted() ? "bg-[#2D5A27] text-white hover:bg-[#1e3e1c]" : "bg-slate-200 text-slate-500 cursor-not-allowed"}`}
              >
                {updatingStatus ? <Loader2 className="w-4 h-4 animate-spin"/> : <CheckCircle2 className="w-4 h-4" />}
                {t("technicianTask.requestApproval")}
              </button>
            )}
          </div>
        </motion.div>

        {/* Thông tin cơ bản */}
        <motion.div variants={fadeInUp} className="bg-white rounded-2xl shadow-sm border border-[#DDEEE0] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#DDEEE0] bg-[#F4F7F4] flex items-center gap-3">
            <FileText className="w-5 h-5 text-[#2D5A27]" />
            <h3 className="text-lg font-bold text-[#1e3e1c]">{t("technicianTask.basicInfoSection")}</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{t("common.creator")}</span>
              <div className="px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-800 flex items-center gap-2 font-medium">
                <User className="w-4 h-4 text-emerald-600"/> {researcherName}
              </div>
            </div>
            <div>
              <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Đối tượng (Target)</span>
              <div className="px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-800 flex items-center gap-2 font-medium">
                <Target className="w-4 h-4 text-emerald-600"/> {targetName || "—"} <span className="text-xs text-slate-400 font-normal">({taskData.taskAssignments?.targetType})</span>
              </div>
            </div>
            <div className="md:col-span-2">
              <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{t("common.description")}</span>
              <div className="px-4 py-3 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-700 min-h-[80px] whitespace-pre-wrap leading-relaxed">
                {taskData.description || <span className="italic text-slate-400">{t("technicianTask.noDescription")}</span>}
              </div>
            </div>
            <div>
              <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Thời gian bắt đầu</span>
              <div className="px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400"/> {taskData.taskAssignments?.startDate ? new Date(taskData.taskAssignments.startDate).toLocaleString("vi-VN") : "—"}
              </div>
            </div>
            <div>
              <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Hạn chót (Deadline)</span>
              <div className={`px-4 py-2.5 border rounded-xl flex items-center gap-2 font-medium ${isTaskOverdue() ? "border-rose-200 bg-rose-50 text-rose-700" : "border-slate-200 bg-slate-50/50 text-slate-800"}`}>
                <Clock className={`w-4 h-4 ${isTaskOverdue() ? "text-rose-500" : "text-slate-400"}`}/> {taskData.taskAssignments?.endDate ? new Date(taskData.taskAssignments.endDate).toLocaleString("vi-VN") : "—"}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Hóa chất / Vật tư */}
        <motion.div variants={fadeInUp} className="bg-white rounded-2xl shadow-sm border border-[#DDEEE0] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#DDEEE0] bg-[#F4F7F4] flex items-center gap-3">
            <FlaskConical className="w-5 h-5 text-[#2D5A27]" />
            <h3 className="text-lg font-bold text-[#1e3e1c]">{t("technicianTask.chemicalsSection")}</h3>
          </div>
          <div className="p-0">
            {taskData.taskAttributes && taskData.taskAttributes.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 w-16 text-center">#</th>
                      <th className="px-6 py-3">{t("technicianTask.chemicalColumn")}</th>
                      <th className="px-6 py-3">{t("technicianTask.materialColumn")}</th>
                      <th className="px-6 py-3">{t("technicianTask.quantityColumn")}</th>
                      <th className="px-6 py-3">{t("technicianTask.unitColumn")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taskData.taskAttributes.map((attr, idx) => (
                      <tr key={idx} className="border-b border-slate-100 hover:bg-[#F4F7F4] transition-colors">
                        <td className="px-6 py-4 text-center font-medium text-slate-500">{idx + 1}</td>
                        <td className="px-6 py-4 font-semibold text-[#1e3e1c]">{attr.chemicalName ?? "—"}</td>
                        <td className="px-6 py-4 text-slate-700">{attr.materialName ?? "—"}</td>
                        <td className="px-6 py-4 font-bold text-[#2D5A27]">{attr.value ?? "—"}</td>
                        <td className="px-6 py-4 text-slate-500">{attr.unit ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 italic">{t("common.noItems")}</div>
            )}
          </div>
        </motion.div>

        {/* Tiêu chí thực hiện (Checklist) */}
        <motion.div variants={fadeInUp} className="bg-white rounded-2xl shadow-sm border border-[#DDEEE0] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#DDEEE0] bg-[#F4F7F4] flex items-center gap-3">
            <ListChecks className="w-5 h-5 text-[#2D5A27]" />
            <h3 className="text-lg font-bold text-[#1e3e1c]">{t("technicianTask.checklistSection")}</h3>
          </div>
          <div className="p-0">
            {taskData.taskCheckList?.checkListItemDtos?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 w-16 text-center">STT</th>
                      <th className="px-6 py-3 min-w-[200px]">{t("technicianTask.criteriaName")}</th>
                      <th className="px-6 py-3 text-center">{t("technicianTask.expectedRange")}</th>
                      <th className="px-6 py-3 text-center min-w-[160px]">{t("technicianTask.measuredValue")}</th>
                      <th className="px-6 py-3 text-center">{t("common.status")}</th>
                      <th className="px-6 py-3 text-center">{t("technicianTask.result")}</th>
                      <th className="px-6 py-3 text-right">{t("common.action")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taskData.taskCheckList.checkListItemDtos.sort((a, b) => a.order - b.order).map((item, idx) => {
                      const isEditing = editingChecklistItem === item.id;
                      const values = checklistValues[item.id] || { measuredValue: "", measurementUnit: "" };

                      return (
                        <tr key={item.id} className="border-b border-slate-100 hover:bg-[#F4F7F4] transition-colors">
                          <td className="px-6 py-4 text-center font-medium text-slate-500">{item.order || idx + 1}</td>
                          <td className="px-6 py-4 font-semibold text-[#1e3e1c]">{item.name}</td>
                          <td className="px-6 py-4 text-center text-slate-600">
                            {item.expectedMinValue != null ? `${item.expectedMinValue} - ${item.expectedMaxValue}` : <span className="text-slate-400 italic">N/A</span>}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {isEditing ? (
                              <div className="flex flex-col gap-2 items-center">
                                <input type="number" step="any" value={values.measuredValue} onChange={(e) => handleChecklistValueChange(item.id, "measuredValue", e.target.value)} className="w-24 px-3 py-1.5 border border-[#DDEEE0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/20 focus:border-[#2D5A27] transition-all shadow-sm text-center" placeholder="Giá trị" />
                                <input type="text" value={values.measurementUnit} onChange={(e) => handleChecklistValueChange(item.id, "measurementUnit", e.target.value)} className="w-24 px-3 py-1.5 border border-[#DDEEE0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/20 focus:border-[#2D5A27] transition-all shadow-sm text-center" placeholder="Đơn vị" />
                              </div>
                            ) : (
                              item.mesuredValue != null ? <span className="font-bold text-[#2D5A27]">{item.mesuredValue} <span className="text-xs text-slate-500 font-normal">{item.measurementUnit ?? ""}</span></span> : <span className="text-slate-400 italic">{t("technicianTask.notYetMeasured")}</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${getCheckListStatusColor(item.status)}`}>
                              {getCheckListStatusLabel(item.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center font-semibold">
                            {item.isPass != null ? (item.isPass ? <span className="text-emerald-600 flex items-center justify-center gap-1"><CheckCircle2 className="w-4 h-4"/> Đạt</span> : <span className="text-rose-600 flex items-center justify-center gap-1"><AlertCircle className="w-4 h-4"/> Không đạt</span>) : <span className="text-slate-400 italic">—</span>}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {canEditChecklist() && (
                              <div className="flex flex-col gap-2 items-end">
                                {isEditing ? (
                                  <>
                                    {item.status === "InProgress" && (
                                      <button type="button" disabled={updatingChecklistItem === item.id} onClick={() => { setReportingChecklistItemId(item.id); setChecklistItemSelectedFiles([]); setChecklistItemPreviewUrls([]); setShowChecklistReportPopup(true); }} className="w-24 bg-[#2D5A27] text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#1e3e1c] transition-colors disabled:opacity-50">
                                        {updatingChecklistItem === item.id ? "Đang xử lý" : t("technicianTask.completeCriteria")}
                                      </button>
                                    )}
                                    <button type="button" onClick={() => setEditingChecklistItem(null)} className="w-24 bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-300 transition-colors">Hủy</button>
                                  </>
                                ) : (
                                  item.status === "Pending" ? (
                                    <button type="button" disabled={updatingChecklistItem === item.id} onClick={() => void handleStartChecklistItem(item.id)} className="bg-[#2D5A27] text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#1e3e1c] shadow-sm transition-colors disabled:opacity-50">
                                      {updatingChecklistItem === item.id ? "Đang bắt đầu..." : t("technicianTask.startCriteria")}
                                    </button>
                                  ) : item.status === "InProgress" ? (
                                    <button type="button" onClick={() => { setEditingChecklistItem(item.id); setChecklistValues({ ...checklistValues, [item.id]: { measuredValue: item.mesuredValue?.toString() ?? "", measurementUnit: item.measurementUnit ?? item.expectedUnit ?? "" } }); }} className="bg-amber-500 text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-amber-600 shadow-sm transition-colors">
                                      Cập nhật
                                    </button>
                                  ) : (
                                    <span className="text-emerald-600 text-xs font-bold px-2 flex items-center gap-1 justify-end"><CheckCircle2 className="w-4 h-4"/> Đã xong</span>
                                  )
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 italic">{t("technicianTask.noChecklistItems")}</div>
            )}
          </div>
        </motion.div>

      </motion.div>

      {/* --- Modals --- */}
      <AnimatePresence>
        {/* Upload Evidence (Report Popup) */}
        {showChecklistReportPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !submittingChecklistItemReport && setShowChecklistReportPopup(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden relative z-10 border border-[#DDEEE0]">
              <div className="px-6 py-5 border-b border-[#DDEEE0] bg-[#F4F7F4] flex justify-between items-center">
                <h3 className="text-lg font-bold text-[#1e3e1c] flex items-center gap-2"><UploadCloud className="w-5 h-5 text-[#2D5A27]"/> {t("technicianTask.checklistReportTitle")}</h3>
                <button type="button" onClick={() => setShowChecklistReportPopup(false)} disabled={submittingChecklistItemReport} className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors"><X className="w-5 h-5"/></button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-sm font-medium text-slate-700">{t("technicianTask.uploadEvidenceLabel")}</p>
                <input type="file" accept="image/*" multiple onChange={handleChecklistItemFileChange} id="checklistFileInput" className="hidden" />
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 border border-[#DDEEE0] rounded-xl bg-[#F4F7F4]">
                  {checklistItemPreviewUrls.map((url, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 shadow-sm group">
                      <img src={url} alt="preview" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => handleRemoveChecklistItemImage(i)} className="absolute top-2 right-2 bg-black/50 hover:bg-rose-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all"><X className="w-4 h-4"/></button>
                    </div>
                  ))}
                  <label htmlFor="checklistFileInput" className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-[#2D5A27]/30 rounded-xl bg-white hover:bg-[#E4F0E8] cursor-pointer transition-colors text-[#2D5A27]">
                    <Camera className="w-8 h-8 mb-2 opacity-60" />
                    <span className="text-xs font-semibold text-center px-2">{checklistItemPreviewUrls.length > 0 ? t("technicianTask.addMorePhotos") : t("technicianTask.clickToSelectPhoto")}</span>
                  </label>
                </div>
                {checklistItemPreviewUrls.length > 0 && <p className="text-xs font-medium text-[#2D5A27]">{t("technicianTask.selectedPhotos", { count: checklistItemPreviewUrls.length })}</p>}
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-b-2xl">
                <button type="button" onClick={() => { setShowChecklistReportPopup(false); setChecklistItemSelectedFiles([]); setChecklistItemPreviewUrls([]); }} disabled={submittingChecklistItemReport} className="px-5 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-100 transition-colors shadow-sm disabled:opacity-50">
                  {t("common.cancel")}
                </button>
                <button type="button" onClick={() => void handleSubmitChecklistItemReport()} disabled={submittingChecklistItemReport || !checklistItemSelectedFiles.length} className="flex items-center gap-2 px-6 py-2 bg-[#2D5A27] text-white rounded-xl font-bold hover:bg-[#1e3e1c] shadow-sm disabled:opacity-50 transition-colors">
                  {submittingChecklistItemReport ? <Loader2 className="w-4 h-4 animate-spin"/> : <CheckCircle2 className="w-4 h-4"/>}
                  {submittingChecklistItemReport ? t("technicianTask.submittingLabel") : t("technicianTask.completeCriteria")}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Success Modal (Request Approval) */}
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8 text-center relative z-10 border border-[#DDEEE0]">
              <div className="w-20 h-20 bg-[#E4F0E8] rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-10 h-10 text-[#2D5A27]" />
              </div>
              <h3 className="text-xl font-bold text-[#1e3e1c] mb-2">{t("technicianTask.requestApprovalSuccess")}</h3>
              <p className="text-sm text-slate-500 mb-8">{t("technicianTask.requestApprovalSuccessDesc")}</p>
              <button type="button" onClick={() => navigate("/technician/tasks")} className="w-full py-3 bg-[#2D5A27] text-white rounded-xl font-bold hover:bg-[#1e3e1c] transition-colors shadow-sm">
                {t("technicianTask.backToList")}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default TechDetailTask;