/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-x/no-array-index-key */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable react-dom/no-missing-button-type */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../../api/axiosInstance";
import { useSnackbar } from "notistack";
import { useTranslation } from "react-i18next";
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
    Assigned: "bg-blue-100 text-blue-800",
    InProgress: "bg-yellow-100 text-yellow-800",
    WaitingForApproval: "bg-purple-100 text-purple-800",
    CompletedInTime: "bg-green-100 text-green-800",
    CompletedOutTime: "bg-orange-100 text-orange-800",
    Deleted: "bg-gray-100 text-gray-800",
    DeclinedByTechnician: "bg-red-100 text-red-800",
    ReworkRequired: "bg-amber-100 text-amber-800",
  };
  return colorMap[status] || "bg-gray-100 text-gray-800";
};

const getCheckListStatusColor = (status: CheckListItemStatus): string => {
  const colorMap: Record<CheckListItemStatus, string> = {
    Pending: "bg-gray-100 text-gray-800",
    InProgress: "bg-yellow-100 text-yellow-800",
    Complete: "bg-green-100 text-green-800",
    Failed: "bg-red-100 text-red-800",
  };
  return colorMap[status] || "bg-gray-100 text-gray-800";
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
  const [, setTargetName] = useState<string>("");

  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [editingChecklistItem, setEditingChecklistItem] = useState<string | null>(null);
  const [checklistValues, setChecklistValues] = useState<Record<string, { measuredValue: string; measurementUnit: string }>>({});
  const [, setUpdatingChecklistItem] = useState<string | null>(null);

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
    return labels[status] || status;
  }, [t]);

  const getCheckListStatusLabel = (status: CheckListItemStatus): string => {
    const labelMap: Record<CheckListItemStatus, string> = {
      Pending: t("technicianTask.checklistPending"),
      InProgress: t("technicianTask.checklistInProgress"),
      Complete: t("technicianTask.checklistComplete"),
      Failed: t("technicianTask.checklistFailed"),
    };
    return labelMap[status] || status;
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

  const fetchTargetName = useCallback(
    async (targetType: TargetType, targetId: string) => {
      if (!targetId) return;
      try {
        let endpoint = "";
        if (targetType === "ExperimentLog") {
          endpoint = `/api/experiment-logs/${targetId}`;
        } else if (targetType === "Sample") {
          endpoint = `/api/sample/${targetId}`;
        }

        if (endpoint) {
          const response = await axiosInstance.get(endpoint);
          const data = response.data?.value ?? response.data;
          setTargetName(data?.name ?? t("common.unknown", "Unknown"));
        }
      } catch (error) {
        console.error("Error fetching target:", error);
        setTargetName(t("common.unknown", "Unknown"));
      }
    },
    [t]
  );

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
        enqueueSnackbar(`${t("common.statusUpdated")}: ${getStatusLabel(statusString)}`, {
          variant: "success",
        });
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

    const measurementUnit = values.measurementUnit.trim() === "" 
      ? currentItem?.expectedUnit?.trim() ?? null 
      : values.measurementUnit;

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

  // ==================== Render Components ====================

  if (loading) return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">{t("common.loading")}</p>
      </div>
    </main>
  );

  if (error || !taskData) return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <p className={error ? "text-red-600 mb-4" : "text-gray-600 mb-4"}>{error ?? t("task.taskDataNotFound")}</p>
        <button onClick={handleBack} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400">{t("common.back")}</button>
      </div>
    </main>
  );

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 flex flex-col items-center py-10 px-4">
      <div className="bg-white rounded-xl px-8 pt-8 pb-8 shadow-[0_2px_8px_rgba(0,0,0,0.06)] w-full max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">
            {t("technicianTask.detailTitle")}: {taskData.name}
          </h2>
          <div className="flex gap-3">
            {taskData.status === "Assigned" && (
              <>
                <button
                  onClick={handleAcceptTask}
                  disabled={updatingStatus}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {updatingStatus ? t("technicianTask.updating") : t("technicianTask.acceptTask")}
                </button>
                <button
                  onClick={handleDeclineTask}
                  disabled={updatingStatus}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {updatingStatus ? t("technicianTask.updating") : t("technicianTask.declineTask")}
                </button>
              </>
            )}
            <button
              onClick={handleCompleteTask}
              disabled={!canCompleteTask() || updatingStatus || isTaskCompleted()}
              title={!areAllChecklistItemsCompleted() ? t("technicianTask.completeAllChecklistFirst") : undefined}
              className={`px-4 py-2 rounded-lg transition-colors ${canCompleteTask() && !isTaskCompleted() ? "bg-green-600 text-white hover:bg-green-700" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}
            >
              {updatingStatus ? t("technicianTask.updating") : t("technicianTask.requestApproval")}
            </button>
          </div>
        </div>

        {/* Basic Info */}
        <div className="mb-6">
          <label className="font-medium mb-1.5 block">{t("common.status", "Status")}</label>
          <span className={`px-3 py-2 rounded-md text-sm font-medium inline-block ${getStatusColor(taskData.status)}`}>
            {getStatusLabel(taskData.status)}
          </span>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4 pb-2 border-b">{t("technicianTask.basicInfoSection")}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex flex-col">
              <label className="font-medium mb-1.5">{t("common.taskName", "Task Name")}</label>
              <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">{taskData.name}</div>
            </div>
            <div className="flex flex-col">
              <label className="font-medium mb-1.5">{t("common.creator", "Creator")}</label>
              <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">{researcherName}</div>
            </div>
          </div>
          {/* ... other info fields similarly mapped ... */}
          <div className="flex flex-col mb-6">
            <label className="font-medium mb-1.5">{t("common.description", "Description")}</label>
            <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 min-h-[80px] whitespace-pre-wrap">
              {taskData.description || t("technicianTask.noDescription")}
            </div>
          </div>
        </div>

        {/* Chemicals Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4 pb-2 border-b">{t("technicianTask.chemicalsSection")}</h3>
          {taskData.taskAttributes && taskData.taskAttributes.length > 0 ? (
            <div className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-2 font-medium text-sm text-gray-700">
                <span>#</span>
                <span>{t("technicianTask.chemicalColumn")}</span>
                <span>{t("technicianTask.materialColumn")}</span>
                <span>{t("technicianTask.unitColumn")}</span>
                <span>{t("technicianTask.quantityColumn")}</span>
              </div>
              {taskData.taskAttributes.map((attr, idx) => (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-2" key={idx}>
                  <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50">{idx + 1}</div>
                  <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50">{attr.chemicalName ?? "—"}</div>
                  <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50">{attr.materialName ?? "—"}</div>
                  <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50">{attr.unit ?? "—"}</div>
                  <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50">{attr.value ?? "—"}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 italic">{t("common.noItems", "No items recorded")}</div>
          )}
        </div>

        {/* Checklist Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4 pb-2 border-b">{t("technicianTask.checklistSection")}</h3>
          {taskData.taskCheckList?.checkListItemDtos?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100 text-sm">
                    <th className="px-3 py-2 border border-gray-300">STT</th>
                    <th className="px-3 py-2 border border-gray-300 text-left">{t("technicianTask.criteriaName")}</th>
                    <th className="px-3 py-2 border border-gray-300 text-center">{t("technicianTask.expectedRange")}</th>
                    <th className="px-3 py-2 border border-gray-300 text-center">{t("technicianTask.measuredValue")}</th>
                    <th className="px-3 py-2 border border-gray-300 text-center">{t("common.status", "Status")}</th>
                    <th className="px-3 py-2 border border-gray-300 text-center">{t("technicianTask.result")}</th>
                    <th className="px-3 py-2 border border-gray-300 text-center">{t("common.action", "Action")}</th>
                  </tr>
                </thead>
                <tbody>
                  {taskData.taskCheckList.checkListItemDtos.sort((a, b) => a.order - b.order).map((item, idx) => {
                    const isEditing = editingChecklistItem === item.id;
                    const values = checklistValues[item.id] || { measuredValue: "", measurementUnit: "" };

                    return (
                      <tr key={item.id} className="hover:bg-gray-50 text-sm">
                        <td className="px-3 py-2 border border-gray-300 text-center">{item.order || idx + 1}</td>
                        <td className="px-3 py-2 border border-gray-300">{item.name}</td>
                        <td className="px-3 py-2 border border-gray-300 text-center">
                          {item.expectedMinValue != null ? `${item.expectedMinValue} - ${item.expectedMaxValue}` : <span className="text-gray-400 italic">{t("technicianTask.noMeasureCriteria")}</span>}
                        </td>
                        <td className="px-3 py-2 border border-gray-300 text-center">
                          {isEditing ? (
                            <div className="flex gap-1 justify-center">
                              <input type="number" step="0.01" value={values.measuredValue} onChange={(e) => handleChecklistValueChange(item.id, "measuredValue", e.target.value)} className="w-20 px-1 border rounded" placeholder={t("technicianTask.valuePlaceholder")} />
                              <input type="text" value={values.measurementUnit} onChange={(e) => handleChecklistValueChange(item.id, "measurementUnit", e.target.value)} className="w-16 px-1 border rounded" placeholder={t("technicianTask.unitPlaceholder")} />
                            </div>
                          ) : (
                            item.mesuredValue != null ? `${item.mesuredValue} ${item.measurementUnit ?? ""}` : <span className="text-gray-400">{t("technicianTask.notYetMeasured")}</span>
                          )}
                        </td>
                        <td className="px-3 py-2 border border-gray-300 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCheckListStatusColor(item.status)}`}>{getCheckListStatusLabel(item.status)}</span>
                        </td>
                        <td className="px-3 py-2 border border-gray-300 text-center">
                          {item.isPass != null ? (item.isPass ? <span className="text-green-600">{t("technicianTask.passResult")}</span> : <span className="text-red-600">{t("technicianTask.notPassResult")}</span>) : <span className="text-gray-400 italic">{t("technicianTask.notYetEvaluated")}</span>}
                        </td>
                        <td className="px-3 py-2 border border-gray-300 text-center">
                          {canEditChecklist() && (
                            <div className="flex flex-col gap-1">
                              {isEditing ? (
                                <>
                                  {item.status === "InProgress" && <button onClick={() => { setReportingChecklistItemId(item.id); setShowChecklistReportPopup(true); }} className="bg-green-600 text-white px-2 py-1 rounded text-xs">{t("technicianTask.completeCriteria")}</button>}
                                  <button onClick={() => setEditingChecklistItem(null)} className="bg-gray-300 px-2 py-1 rounded text-xs">{t("common.cancel", "Cancel")}</button>
                                </>
                              ) : (
                                item.status === "Pending" ? <button onClick={() => handleStartChecklistItem(item.id)} className="bg-blue-600 text-white px-2 py-1 rounded text-xs">{t("technicianTask.startCriteria")}</button> :
                                item.status === "InProgress" ? <button onClick={() => { setEditingChecklistItem(item.id); setChecklistValues({ ...checklistValues, [item.id]: { measuredValue: item.mesuredValue?.toString() ?? "", measurementUnit: item.measurementUnit ?? item.expectedUnit ?? "" } }); }} className="bg-yellow-500 text-white px-2 py-1 rounded text-xs">{t("technicianTask.updateCriteria")}</button> :
                                <span className="text-green-600 text-xs">{t("technicianTask.criteriaCompleted")}</span>
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
            <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 italic">{t("technicianTask.noChecklistItems")}</div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button onClick={handleBack} className="px-5 py-2 rounded-lg bg-gray-300 text-gray-800 font-semibold">{t("common.back")}</button>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 w-full max-w-md text-center shadow-lg">
            <div className="mb-4 text-5xl text-green-600 font-bold">✓</div>
            <h3 className="text-2xl font-bold mb-2">{t("technicianTask.requestApprovalSuccess")}</h3>
            <p className="text-gray-600 mb-6">{t("technicianTask.requestApprovalSuccessDesc")}</p>
            <button onClick={() => navigate("/technician/tasks")} className="w-full py-2 bg-green-600 text-white rounded-lg font-medium">{t("technicianTask.backToList")}</button>
          </div>
        </div>
      )}

      {/* Report Popup */}
      {showChecklistReportPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-6">{t("technicianTask.checklistReportTitle")}</h3>
            <div className="space-y-4">
              <label className="block font-medium">{t("technicianTask.uploadEvidenceLabel")}</label>
              <input type="file" accept="image/*" multiple onChange={handleChecklistItemFileChange} id="checklistFileInput" className="hidden" />
              
              <div className="grid grid-cols-3 gap-3 p-3 border rounded-md bg-gray-50">
                {checklistItemPreviewUrls.map((url, i) => (
                  <div key={i} className="relative h-24 border rounded overflow-hidden">
                    <img src={url} alt="preview" className="w-full h-full object-cover" />
                    <button onClick={() => handleRemoveChecklistItemImage(i)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center">×</button>
                  </div>
                ))}
                <label htmlFor="checklistFileInput" className="border-2 border-dashed flex items-center justify-center h-24 cursor-pointer hover:bg-gray-100 text-center p-2 text-xs text-gray-500">
                  {checklistItemPreviewUrls.length > 0 ? t("technicianTask.addMorePhotos") : t("technicianTask.clickToSelectPhoto")}
                </label>
              </div>
              {checklistItemPreviewUrls.length > 0 && <p className="text-sm italic">{t("technicianTask.selectedPhotos", { count: checklistItemPreviewUrls.length })}</p>}
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button onClick={() => setShowChecklistReportPopup(false)} className="px-4 py-2 bg-gray-200 rounded">{t("common.cancel", "Cancel")}</button>
              <button onClick={handleSubmitChecklistItemReport} disabled={submittingChecklistItemReport || !checklistItemSelectedFiles.length} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
                {submittingChecklistItemReport ? t("technicianTask.submittingLabel") : t("technicianTask.completeCriteria")}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default TechDetailTask;