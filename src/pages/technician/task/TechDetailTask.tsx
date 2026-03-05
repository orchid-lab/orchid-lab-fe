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

// Kiểm tra xem date có phải là .NET default date không
const isDefaultDate = (dateString: string): boolean => {
  return dateString.startsWith("0001-01-01");
};

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString || isDefaultDate(dateString)) return "—";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};

const formatDateTime = (dateString: string | null | undefined): string => {
  if (!dateString || isDefaultDate(dateString)) return "—";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
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

const getCheckListStatusLabel = (status: CheckListItemStatus): string => {
  const labelMap: Record<CheckListItemStatus, string> = {
    Pending: "Chờ xử lý",
    InProgress: "Đang thực hiện",
    Complete: "Hoàn thành",
    Failed: "Thất bại",
  };
  return labelMap[status] || status;
};

const getTargetTypeLabel = (type: TargetType): string => {
  const labelMap: Record<TargetType, string> = {
    Sample: "Mẫu thí nghiệm",
    ExperimentLog: "Nhật ký thí nghiệm",
  };
  return labelMap[type] || type;
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

  // Additional fetched data
  const [researcherName, setResearcherName] = useState<string>("");
  const [targetName, setTargetName] = useState<string>("");

  // Action states
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Checklist editing states
  const [editingChecklistItem, setEditingChecklistItem] = useState<string | null>(null);
  const [checklistValues, setChecklistValues] = useState<Record<string, { measuredValue: string; measurementUnit: string }>>({});
  const [updatingChecklistItem, setUpdatingChecklistItem] = useState<string | null>(null);

  // Checklist item report popup states
  const [showChecklistReportPopup, setShowChecklistReportPopup] = useState(false);
  const [reportingChecklistItemId, setReportingChecklistItemId] = useState<string | null>(null);
  const [checklistItemSelectedFiles, setChecklistItemSelectedFiles] = useState<File[]>([]);
  const [checklistItemPreviewUrls, setChecklistItemPreviewUrls] = useState<string[]>([]);
  const [submittingChecklistItemReport, setSubmittingChecklistItemReport] = useState(false);

  // ==================== Status Labels ====================

  const getStatusLabel = useCallback((status: TaskStatus): string => {
    const labels: Record<TaskStatus, string> = {
      Assigned: "Đã giao",
      InProgress: "Đang thực hiện",
      WaitingForApproval: "Chờ phê duyệt",
      CompletedInTime: "Hoàn thành đúng hạn",
      CompletedOutTime: "Hoàn thành trễ hạn",
      Deleted: "Đã xóa",
      DeclinedByTechnician: "Đã từ chối",
      ReworkRequired: "Yêu cầu làm lại",
    };
    return labels[status] || status;
  }, []);

  // ==================== Fetch Data ====================

  // Fetch researcher name
  const fetchResearcherName = useCallback(async (researcherId: string) => {
    if (!researcherId) return;
    try {
      const response = await axiosInstance.get(`/api/user/${researcherId}`);
      const data = response.data?.value ?? response.data;
      setResearcherName(data?.name || "Không xác định");
    } catch (error) {
      console.error("Error fetching researcher:", error);
      setResearcherName("Không xác định");
    }
  }, []);

  // Fetch target name based on target type
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
          setTargetName(data?.name || "Không xác định");
        }
      } catch (error) {
        console.error("Error fetching target:", error);
        setTargetName("Không xác định");
      }
    },
    []
  );

  // Fetch main task data
  useEffect(() => {
    const fetchTaskDetail = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        const response = await axiosInstance.get<TaskData>(`/api/tasks/${id}`);
        // API trả về trực tiếp TaskData, không có wrapper { value: ... }
        const data = response.data;

        if (!data || !data.id) {
          throw new Error("Không nhận được dữ liệu");
        }

        setTaskData(data);

        // Fetch additional data
        if (data.researcherId) {
          void fetchResearcherName(data.researcherId);
        }

        if (data.taskAssignments?.targetId && data.taskAssignments?.targetType) {
          void fetchTargetName(
            data.taskAssignments.targetType,
            data.taskAssignments.targetId
          );
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : t("common.errorLoading");
        setError(errorMessage);
        enqueueSnackbar(t("task.taskDetailLoadError"), { variant: "error" });
        console.error("Error fetching task detail:", err);
      } finally {
        setLoading(false);
      }
    };

    void fetchTaskDetail();
  }, [id, enqueueSnackbar, t, fetchResearcherName, fetchTargetName]);

  // ==================== Date Checks ====================

  const isTaskOverdue = useCallback((): boolean => {
    const endDateStr = taskData?.taskAssignments?.endDate;
    if (!endDateStr || isDefaultDate(endDateStr)) return false;
    const endDate = new Date(endDateStr);
    return new Date() > endDate;
  }, [taskData]);

  // ==================== Actions ====================

  const handleBack = (): void => {
    void navigate("/technician/tasks");
  };

  const updateTaskStatus = async (newStatus: number): Promise<boolean> => {
    if (!taskData?.id) return false;

    // Map number status sang string status name cho API
    const statusMap: Record<number, TaskStatus> = {
      0: "Assigned",
      1: "InProgress",
      2: "WaitingForApproval",
      3: "CompletedInTime",
      4: "CompletedOutTime",
      5: "Deleted",
      6: "DeclinedByTechnician",
      7: "ReworkRequired",
    };

    const statusString = statusMap[newStatus];
    if (!statusString) {
      enqueueSnackbar("Trạng thái không hợp lệ", { variant: "error" });
      return false;
    }

    try {
      setUpdatingStatus(true);
      const response = await axiosInstance.put("/api/tasks/change-task-status", {
        todoTaskId: taskData.id,
        status: statusString, // Gửi string thay vì number
      });

      if (response.status === 200) {
        setTaskData((prev) =>
          prev ? { ...prev, status: statusString } : null
        );

        const statusLabels: Record<number, string> = {
          0: "Đã giao",
          1: "Đang thực hiện",
          2: "Chờ phê duyệt",
          3: "Hoàn thành đúng hạn",
          4: "Hoàn thành trễ hạn",
          5: "Đã xóa",
          6: "Đã từ chối",
          7: "Yêu cầu làm lại",
        };

        enqueueSnackbar(`Cập nhật trạng thái thành công: ${statusLabels[newStatus]}`, {
          variant: "success",
        });

        return true;
      }

      return false;
    } catch (error) {
      console.error("Error updating task status:", error);
      const apiError = error as {
        response?: { data?: string; status?: number };
        message?: string;
      };
      const backendMessage =
        apiError.response?.data ?? apiError.message ?? "Cập nhật trạng thái thất bại!";

      enqueueSnackbar(backendMessage, {
        variant: "error",
        autoHideDuration: 5000,
      });

      return false;
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Nhận công việc: Assigned → InProgress
  const handleAcceptTask = () => {
    if (isTaskOverdue()) {
      enqueueSnackbar("Không thể nhận công việc đã quá hạn kết thúc", { variant: "warning" });
      return;
    }
    void updateTaskStatus(1); // InProgress
  };

  // Từ chối công việc: Assigned → DeclinedByTechnician
  const handleDeclineTask = () => {
    void updateTaskStatus(6); // DeclinedByTechnician
  };

  // Hoàn thành công việc: InProgress/ReworkRequired → WaitingForApproval
  const handleCompleteTask = async () => {
    const isStatusUpdated = await updateTaskStatus(2); // WaitingForApproval
    if (isStatusUpdated) {
      setShowSuccessModal(true);
    }
  };

  // ==================== Checklist Handlers ====================

  // Bắt đầu thực hiện một checklist item (Pending → InProgress)
  const handleStartChecklistItem = async (itemId: string) => {
    if (!taskData?.id) return;

    try {
      setUpdatingChecklistItem(itemId);

      await axiosInstance.post(`/api/tasks/${taskData.id}/checklist-items/${itemId}`);

      // Cập nhật state local
      setTaskData((prev) => {
        if (!prev || !prev.taskCheckList) return prev;
        return {
          ...prev,
          taskCheckList: {
            ...prev.taskCheckList,
            checkListItemDtos: prev.taskCheckList.checkListItemDtos.map((item) =>
              item.id === itemId
                ? { ...item, status: "InProgress" as CheckListItemStatus }
                : item
            ),
          },
        };
      });

      setEditingChecklistItem(itemId);
      const currentItem = taskData.taskCheckList?.checkListItemDtos.find(
        (item) => item.id === itemId
      );
      setChecklistValues((prev) => ({
        ...prev,
        [itemId]: {
          measuredValue: "",
          measurementUnit: currentItem?.expectedUnit || "",
        },
      }));

      enqueueSnackbar("Đã bắt đầu thực hiện tiêu chí!", { variant: "success" });
    } catch (error) {
      console.error("Error starting checklist item:", error);
      const apiError = error as {
        response?: { data?: string; status?: number };
        message?: string;
      };
      const backendMessage =
        apiError.response?.data ?? apiError.message ?? "Bắt đầu thất bại!";

      enqueueSnackbar(backendMessage, {
        variant: "error",
        autoHideDuration: 5000,
      });
    } finally {
      setUpdatingChecklistItem(null);
    }
  };

  // Hủy chỉnh sửa
  const handleCancelEditChecklistItem = () => {
    setEditingChecklistItem(null);
  };

  // Cập nhật giá trị đo trong state
  const handleChecklistValueChange = (itemId: string, field: "measuredValue" | "measurementUnit", value: string) => {
    setChecklistValues((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      },
    }));
  };

  // Hoàn thành checklist item (InProgress → Completed) - mở popup để upload hình
  const handleOpenChecklistReportPopup = (itemId: string) => {
    setReportingChecklistItemId(itemId);
    setShowChecklistReportPopup(true);
    setChecklistItemSelectedFiles([]);
    setChecklistItemPreviewUrls([]);
  };

  const handleCompleteChecklistItem = async (itemId: string) => {
    const values = checklistValues[itemId];
    if (!values || !taskData?.id) return;

    const currentItem = taskData.taskCheckList?.checkListItemDtos.find(
      (item) => item.id === itemId
    );

    // Cho phép giá trị đo là null (khi để trống hoặc undefined)
    const rawMeasuredValue = values.measuredValue ?? "";
    const measuredValue = rawMeasuredValue.trim() === "" 
      ? null 
      : parseFloat(rawMeasuredValue);
    
    // Chỉ báo lỗi nếu user nhập text không phải số (ví dụ "abc"), cho phép để trống (null)
    if (measuredValue !== null && isNaN(measuredValue)) {
      enqueueSnackbar("Giá trị đo phải là số hoặc để trống", { variant: "error" });
      return;
    }

    // Cho phép đơn vị đo là null khi để trống
    const rawMeasurementUnit = values.measurementUnit ?? "";
    const measurementUnit =
      rawMeasurementUnit.trim() === ""
        ? currentItem?.expectedUnit?.trim() || null
        : rawMeasurementUnit;

    try {
      setUpdatingChecklistItem(itemId);

      // Cập nhật giá trị đo (có thể là null)
      await axiosInstance.put(
        `/api/tasks/${taskData.id}/checklist-items/${itemId}/update-actual-value`,
        {
          measurementUnit: measurementUnit,
          measuredValue: measuredValue,
        }
      );

      if (!currentItem) return;

      // Tự động đánh giá isPass nếu có khoảng kỳ vọng VÀ có giá trị đo
      let isPass: boolean | null = null;
      if (measuredValue !== null && currentItem.expectedMinValue != null && currentItem.expectedMaxValue != null) {
        isPass = measuredValue >= currentItem.expectedMinValue && measuredValue <= currentItem.expectedMaxValue;
      }

      // Cập nhật state local
      setTaskData((prev) => {
        if (!prev || !prev.taskCheckList) return prev;
        return {
          ...prev,
          taskCheckList: {
            ...prev.taskCheckList,
            checkListItemDtos: prev.taskCheckList.checkListItemDtos.map((item) =>
              item.id === itemId
                ? {
                    ...item,
                    mesuredValue: measuredValue,
                    measurementUnit: measurementUnit,
                    status: "Complete" as CheckListItemStatus,
                    isPass: isPass,
                  }
                : item
            ),
          },
        };
      });

      setEditingChecklistItem(null);
      enqueueSnackbar("Đã hoàn thành tiêu chí đánh giá!", { variant: "success" });
    } catch (error) {
      console.error("Error completing checklist item:", error);
      const apiError = error as {
        response?: { data?: string; status?: number };
        message?: string;
      };
      const backendMessage =
        apiError.response?.data ?? apiError.message ?? "Cập nhật thất bại!";

      enqueueSnackbar(backendMessage, {
        variant: "error",
        autoHideDuration: 5000,
      });
    } finally {
      setUpdatingChecklistItem(null);
    }
  };

  // ==================== Checklist Item Report Handlers ====================

  const handleChecklistItemFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    setChecklistItemSelectedFiles((prev) => [...prev, ...files]);
    setChecklistItemPreviewUrls((prev) => [...prev, ...files.map((file) => URL.createObjectURL(file))]);

    event.target.value = "";
  };

  const handleRemoveChecklistItemImage = (index: number) => {
    setChecklistItemPreviewUrls((prev) => {
      const target = prev[index];
      if (target) {
        URL.revokeObjectURL(target);
      }
      return prev.filter((_, idx) => idx !== index);
    });

    setChecklistItemSelectedFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleCloseChecklistReportPopup = () => {
    setShowChecklistReportPopup(false);
    checklistItemPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    setChecklistItemPreviewUrls([]);
    setChecklistItemSelectedFiles([]);
    setReportingChecklistItemId(null);
  };

  const handleSubmitChecklistItemReport = async () => {
    if (checklistItemSelectedFiles.length === 0 || !taskData?.id || !reportingChecklistItemId) {
      enqueueSnackbar("Vui lòng tải lên ít nhất 1 hình ảnh bằng chứng", { variant: "error" });
      return;
    }

    try {
      setSubmittingChecklistItemReport(true);

      // Upload các hình ảnh với targetType là Task và targetId là taskId
      for (const file of checklistItemSelectedFiles) {
        const formData = new FormData();
        formData.append("image", file);
        formData.append("targetType", "Task");
        formData.append("targetId", taskData.id);

        await axiosInstance.post("/api/images", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      // Sau khi upload xong hình, hoàn thành checklist item
      await handleCompleteChecklistItem(reportingChecklistItemId);

      handleCloseChecklistReportPopup();
      enqueueSnackbar("Đã hoàn thành và lưu bằng chứng thành công!", { variant: "success" });
    } catch (error) {
      console.error("Error submitting checklist item report:", error);
      const apiError = error as {
        response?: { data?: string; status?: number };
        message?: string;
      };
      const backendMessage =
        apiError.response?.data ?? apiError.message ?? "Gửi báo cáo thất bại!";

      enqueueSnackbar(backendMessage, {
        variant: "error",
        autoHideDuration: 5000,
      });
    } finally {
      setSubmittingChecklistItemReport(false);
    }
  };

  // Kiểm tra có thể chỉnh sửa checklist không
  const canEditChecklist = (): boolean => {
    return taskData?.status === "InProgress" || taskData?.status === "ReworkRequired";
  };

  // ==================== Button States ====================

  // Kiểm tra tất cả checklist items đã hoàn thành chưa
  const areAllChecklistItemsCompleted = (): boolean => {
    const checklistItems = taskData?.taskCheckList?.checkListItemDtos;
    // Nếu không có checklist hoặc checklist rỗng, cho phép hoàn thành
    if (!checklistItems || checklistItems.length === 0) return true;
    // Kiểm tra tất cả items có status "Complete"
    return checklistItems.every((item) => item.status === "Complete");
  };

  // Có thể hoàn thành công việc: khi đang InProgress/ReworkRequired VÀ tất cả checklist đã completed
  const canCompleteTask = (): boolean => {
    const hasValidStatus = taskData?.status === "InProgress" || taskData?.status === "ReworkRequired";
    return hasValidStatus && areAllChecklistItemsCompleted();
  };

  // Kiểm tra task đã hoàn thành chưa (để disable các nút)
  const isTaskCompleted = (): boolean => {
    const completedStatuses: TaskStatus[] = [
      "WaitingForApproval",
      "CompletedInTime",
      "CompletedOutTime",
      "Deleted",
      "DeclinedByTechnician",
    ];
    return completedStatuses.includes(taskData?.status ?? "Assigned");
  };

  // ==================== Render States ====================

  if (loading) {
    return (
      <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t("common.loading")}</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">
            {t("common.error")}: {error}
          </p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
          >
            {t("common.back")}
          </button>
        </div>
      </main>
    );
  }

  if (!taskData) {
    return (
      <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{t("task.taskDataNotFound")}</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
          >
            {t("common.back")}
          </button>
        </div>
      </main>
    );
  }

  // ==================== Main Render ====================

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 flex flex-col items-center py-10 px-4">
      <div className="bg-white rounded-xl px-8 pt-8 pb-8 shadow-[0_2px_8px_rgba(0,0,0,0.06)] w-full max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">
            Chi tiết công việc: {taskData.name}
          </h2>
          <div className="flex gap-3">
            {/* Nút nhận công việc - chỉ hiển thị khi status = Assigned */}
            {taskData.status === "Assigned" && (
              <button
                onClick={handleAcceptTask}
                disabled={updatingStatus}
                className={`px-4 py-2 rounded-lg transition-colors bg-blue-600 text-white hover:bg-blue-700`}
              >
                {updatingStatus ? "Đang cập nhật..." : "Nhận công việc"}
              </button>
            )}

            {/* Nút từ chối - chỉ hiển thị khi status = Assigned */}
            {taskData.status === "Assigned" && (
              <button
                onClick={handleDeclineTask}
                disabled={updatingStatus}
                className="px-4 py-2 rounded-lg transition-colors bg-red-600 text-white hover:bg-red-700"
              >
                {updatingStatus ? "Đang cập nhật..." : "Từ chối"}
              </button>
            )}

            {/* Nút hoàn thành */}
            <button
              onClick={handleCompleteTask}
              disabled={!canCompleteTask() || updatingStatus || isTaskCompleted()}
              title={
                !areAllChecklistItemsCompleted()
                  ? "Vui lòng hoàn thành tất cả tiêu chí đánh giá trước"
                  : undefined
              }
              className={`px-4 py-2 rounded-lg transition-colors ${
                canCompleteTask() && !isTaskCompleted()
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {updatingStatus ? "Đang cập nhật..." : "Yêu cầu duyệt"}
            </button>
          </div>
        </div>

        {/* Status */}
        <div className="flex flex-col mb-6">
          <label className="font-medium mb-1.5">Trạng thái</label>
          <span
            className={`px-3 py-2 rounded-md text-sm font-medium w-fit ${getStatusColor(taskData.status)}`}
          >
            {getStatusLabel(taskData.status)}
          </span>
        </div>

        {/* Section 1: Basic Information */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4 pb-2 border-b">
            📋 Thông tin cơ bản
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex flex-col">
              <label className="font-medium mb-1.5">Tên công việc</label>
              <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                {taskData.name || "Không có"}
              </div>
            </div>
            <div className="flex flex-col">
              <label className="font-medium mb-1.5">Người tạo</label>
              <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                {researcherName || "Đang tải..."}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex flex-col">
              <label className="font-medium mb-1.5">Ngày tạo</label>
              <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                {formatDateTime(taskData.createdDate)}
              </div>
            </div>
            <div className="flex flex-col">
              <label className="font-medium mb-1.5">Loại đối tượng</label>
              <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                {taskData.taskAssignments?.targetType
                  ? getTargetTypeLabel(taskData.taskAssignments.targetType)
                  : "—"}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex flex-col">
              <label className="font-medium mb-1.5">Tên đối tượng</label>
              <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                {targetName || "Đang tải..."}
              </div>
            </div>
            <div className="flex flex-col">
              <label className="font-medium mb-1.5">Kỹ thuật viên</label>
              <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                {taskData.taskAssignments?.technicianName || "—"}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="flex flex-col">
              <label className="font-medium mb-1.5">Ngày bắt đầu</label>
              <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                {formatDate(taskData.taskAssignments?.startDate)}
              </div>
            </div>
            <div className="flex flex-col">
              <label className="font-medium mb-1.5">Ngày kết thúc</label>
              <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                {formatDate(taskData.taskAssignments?.endDate)}
              </div>
            </div>
            <div className="flex flex-col">
              <label className="font-medium mb-1.5">Ngày kết thúc dự kiến</label>
              <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                {formatDate(taskData.taskAssignments?.expectedEndDate)}
              </div>
            </div>
          </div>

          <div className="flex flex-col mb-6">
            <label className="font-medium mb-1.5">Mô tả công việc</label>
            <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 min-h-[80px] whitespace-pre-wrap">
              {taskData.description || "Không có mô tả"}
            </div>
          </div>
        </div>

        {/* Section 2: Materials & Chemicals */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4 pb-2 border-b">
            🧪 Hóa chất & Nguyên vật liệu cần sử dụng
          </h3>

          {taskData.taskAttributes && taskData.taskAttributes.length > 0 ? (
            <div className="space-y-2">
              {/* Header */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-2 font-medium text-sm text-gray-700">
                <span>#</span>
                <span>Hóa chất</span>
                <span>Nguyên vật liệu</span>
                <span>Đơn vị</span>
                <span>Số lượng</span>
              </div>
              {/* Data rows */}
              {taskData.taskAttributes.map((attr, idx) => (
                <div
                  className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-2"
                  key={idx}
                >
                  <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                    {idx + 1}
                  </div>
                  <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                    {attr.chemicalName || "—"}
                  </div>
                  <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                    {attr.materialName || "—"}
                  </div>
                  <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                    {attr.unit || "—"}
                  </div>
                  <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                    {attr.value ?? "—"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 italic">
              Không có nguyên vật liệu nào được ghi nhận
            </div>
          )}
        </div>

        {/* Section 3: Checklist */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4 pb-2 border-b">
            ✅ Tiêu chí đánh giá (Checklist)
          </h3>

          {taskData.taskCheckList?.checkListItemDtos &&
          taskData.taskCheckList.checkListItemDtos.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-3 py-2 text-left text-sm font-medium text-gray-700 border border-gray-300">
                      STT
                    </th>
                    <th className="px-3 py-2 text-left text-sm font-medium text-gray-700 border border-gray-300">
                      Tên tiêu chí
                    </th>
                    <th className="px-3 py-2 text-left text-sm font-medium text-gray-700 border border-gray-300">
                      Mô tả
                    </th>
                    <th className="px-3 py-2 text-center text-sm font-medium text-gray-700 border border-gray-300">
                      Khoảng kỳ vọng
                    </th>
                    <th className="px-3 py-2 text-center text-sm font-medium text-gray-700 border border-gray-300">
                      Đơn vị kỳ vọng
                    </th>
                    <th className="px-3 py-2 text-center text-sm font-medium text-gray-700 border border-gray-300">
                      Giá trị đo
                    </th>
                    <th className="px-3 py-2 text-center text-sm font-medium text-gray-700 border border-gray-300">
                      Trạng thái
                    </th>
                    <th className="px-3 py-2 text-center text-sm font-medium text-gray-700 border border-gray-300">
                      Kết quả
                    </th>
                    <th className="px-3 py-2 text-center text-sm font-medium text-gray-700 border border-gray-300">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {taskData.taskCheckList.checkListItemDtos
                    .sort((a, b) => a.order - b.order)
                    .map((item, idx) => {
                      const isEditing = editingChecklistItem === item.id;
                      const isUpdating = updatingChecklistItem === item.id;
                      const values = checklistValues[item.id] || { measuredValue: "", measurementUnit: "" };

                      return (
                        <tr key={item.id || idx} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-sm text-gray-700 border border-gray-300">
                            {item.order || idx + 1}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-700 border border-gray-300 font-medium">
                            {item.name || "—"}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600 border border-gray-300 max-w-xs">
                            {item.description || "—"}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600 border border-gray-300 text-center">
                            {item.expectedMinValue != null &&
                            item.expectedMaxValue != null
                              ? `${item.expectedMinValue} - ${item.expectedMaxValue}`
                              : <span className="text-gray-400 italic">Không có tiêu chí đo đạc</span>}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-700 border border-gray-300 text-center">
                            {item.expectedUnit?.trim() ? (
                              item.expectedUnit
                            ) : (
                              <span className="text-gray-400 italic">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-700 border border-gray-300 text-center">
                            {isEditing ? (
                              <div className="flex items-center gap-2 justify-center">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={values.measuredValue}
                                  onChange={(e) => handleChecklistValueChange(item.id, "measuredValue", e.target.value)}
                                  className="w-24 px-2 py-1.5 border border-gray-300 rounded text-sm text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="Giá trị"
                                  disabled={isUpdating}
                                />
                                <input
                                  type="text"
                                  value={values.measurementUnit}
                                  onChange={(e) => handleChecklistValueChange(item.id, "measurementUnit", e.target.value)}
                                  className="w-20 px-2 py-1.5 border border-gray-300 rounded text-sm text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="Đơn vị"
                                  disabled={isUpdating}
                                />
                              </div>
                            ) : (
                              <span className="font-medium">
                                {item.mesuredValue != null
                                  ? `${item.mesuredValue} ${item.measurementUnit || ""}`
                                  : <span className="text-gray-400 italic font-normal">Chưa đo</span>}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-sm border border-gray-300 text-center">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getCheckListStatusColor(item.status)}`}
                            >
                              {getCheckListStatusLabel(item.status)}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-sm border border-gray-300 text-center">
                            {item.isPass !== undefined && item.isPass !== null ? (
                              item.isPass ? (
                                <span className="text-green-600 font-medium">✓ Đạt</span>
                              ) : (
                                <span className="text-red-600 font-medium">✗ Không đạt</span>
                              )
                            ) : (
                              <span className="text-gray-400 italic">Chưa đánh giá</span>
                            )}
                          </td>
                          {canEditChecklist() && (
                            <td className="px-4 py-3 text-sm border border-gray-300 text-center">
                              {isEditing ? (
                                <div className="flex flex-col gap-1.5 min-w-[100px]">
                                  {item.status === "InProgress" && (
                                    <button
                                      onClick={() => handleOpenChecklistReportPopup(item.id)}
                                      disabled={isUpdating}
                                      className="px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 font-medium"
                                    >
                                      {isUpdating ? "Đang lưu..." : "Hoàn thành"}
                                    </button>
                                  )}
                                  <button
                                    onClick={handleCancelEditChecklistItem}
                                    disabled={isUpdating}
                                    className="px-3 py-1.5 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:opacity-50 font-medium"
                                  >
                                    Hủy
                                  </button>
                                </div>
                              ) : item.status === "Pending" ? (
                                <button
                                  onClick={() => handleStartChecklistItem(item.id)}
                                  disabled={updatingChecklistItem === item.id}
                                  className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                                >
                                  {updatingChecklistItem === item.id ? "Đang khởi động..." : "Bắt đầu"}
                                </button>
                              ) : item.status === "InProgress" ? (
                                <button
                                  onClick={() => {
                                    setEditingChecklistItem(item.id);
                                    setChecklistValues((prev) => ({
                                      ...prev,
                                      [item.id]: {
                                        measuredValue: item.mesuredValue?.toString() || "",
                                        measurementUnit: item.measurementUnit || item.expectedUnit || "",
                                      },
                                    }));
                                  }}
                                  className="px-4 py-1.5 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors font-medium"
                                >
                                  Cập nhật
                                </button>
                              ) : item.status === "Complete" ? (
                                <span className="text-green-600 text-sm font-medium">✓ Đã hoàn thành</span>
                              ) : (
                                <span className="text-gray-400 text-sm">—</span>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 italic">
              Không có tiêu chí đánh giá nào
            </div>
          )}
        </div>

        {/* Back Button */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            className="min-w-[90px] px-5 py-2 rounded-lg border-none text-base font-semibold cursor-pointer transition-colors duration-200 bg-gray-300 text-gray-800 hover:bg-gray-400"
            onClick={handleBack}
          >
            Quay lại
          </button>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 w-full max-w-md mx-4 text-center">
            <div className="mb-4">
              <span className="text-5xl text-green-600">✓</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              Yêu cầu duyệt thành công
            </h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Công việc đã được chuyển sang trạng thái chờ phê duyệt. Vui lòng chờ researcher phê duyệt.
            </p>
            <button
              onClick={() => {
                setShowSuccessModal(false);
                setTimeout(() => navigate("/technician/task"), 300);
              }}
              className="w-full px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              Quay lại danh sách
            </button>
          </div>
        </div>
      )}

      {/* Checklist Item Report Popup */}
      {showChecklistReportPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">
                Hoàn thành tiêu chí với bằng chứng
              </h3>
              <button
                onClick={handleCloseChecklistReportPopup}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* File Upload & Image Preview */}
              <div>
                <label className="block font-medium mb-2">
                  Chụp / chọn ảnh bằng chứng hoàn thành tiêu chí *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleChecklistItemFileChange}
                  id="checklistFileInput"
                  className="hidden"
                />
                
                {checklistItemPreviewUrls.length > 0 ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 border border-gray-300 rounded-md p-3 bg-gray-50">
                      {checklistItemPreviewUrls.map((url, index) => (
                        <div key={`${url}-${index}`} className="relative rounded-md overflow-hidden border border-gray-200 bg-white">
                          <img
                            src={url}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-28 object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveChecklistItemImage(index)}
                            disabled={submittingChecklistItemReport}
                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs hover:bg-black/75 disabled:opacity-50"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    <label
                      htmlFor="checklistFileInput"
                      className="block w-full p-2 border-2 border-dashed border-gray-300 rounded-md text-center cursor-pointer hover:border-blue-500 transition"
                    >
                      <p className="font-medium text-gray-600 text-sm">
                        Đã chọn {checklistItemSelectedFiles.length} ảnh
                      </p>
                      <p className="text-gray-500 text-xs mt-1">Nhấp để thêm ảnh khác</p>
                    </label>
                  </div>
                ) : (
                  <label
                    htmlFor="checklistFileInput"
                    className="block w-full p-6 border-2 border-dashed border-gray-300 rounded-md text-center cursor-pointer hover:border-blue-500 transition"
                  >
                    <p className="text-gray-500">Nhấp để chọn hoặc chụp ảnh</p>
                  </label>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button
                onClick={handleCloseChecklistReportPopup}
                disabled={submittingChecklistItemReport}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmitChecklistItemReport}
                disabled={submittingChecklistItemReport || checklistItemSelectedFiles.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingChecklistItemReport ? "Đang gửi..." : "Hoàn thành"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default TechDetailTask;
