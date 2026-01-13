import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../../api/axiosInstance";
import { useSnackbar } from "notistack";

type StatusType =
  | "Assigned"
  | "Taken"
  | "InProcess"
  | "DoneInTime"
  | "DoneInLate"
  | "Cancel";

interface AttributeDTO {
  id: string;
  name: string;
  description: string;
  measurementUnit: string;
  value: number;
  status: boolean;
}

interface TaskData {
  value: string;
  id: string;
  researcher: string;
  name: string;
  description: string;
  attributeDTOs: AttributeDTO[];
  start_date: string;
  end_date: string;
  create_at: string;
  status: StatusType;
  url?: string | null;
  reportInformation?: string | null;
  isDaily?: boolean | null;
}

const TechDetailTask: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { enqueueSnackbar } = useSnackbar();
  const [taskData, setTaskData] = useState<TaskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Report popup states
  const [showReportPopup, setShowReportPopup] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [reportInformation, setReportInformation] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submittingReport, setSubmittingReport] = useState(false);

  useEffect(() => {
    const fetchTaskDetail = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const response = await axiosInstance.get(`/api/tasks/${id}`);

        if (
          response.data &&
          typeof response.data === "object" &&
          "value" in response.data
        ) {
          console.log("API Response:", response.data.value);
          setTaskData(response.data.value as TaskData);
        } else {
          console.error("Invalid response structure:", response.data);
          throw new Error("No data received");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải dữ liệu";
        setError(errorMessage);
        enqueueSnackbar("Không thể tải chi tiết nhiệm vụ", {
          variant: "error",
        });
        console.error("Error fetching task detail:", err);
      } finally {
        setLoading(false);
      }
    };

    void fetchTaskDetail();
  }, [id, enqueueSnackbar]);

  const handleBack = (): void => {
    void navigate("/technician/tasks");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Assigned":
        return "bg-blue-100 text-blue-800";
      case "Taken":
        return "bg-purple-100 text-purple-800";
      case "InProcess":
        return "bg-yellow-100 text-yellow-800";
      case "DoneInTime":
        return "bg-blue-100 text-blue-800";
      case "DoneInLate":
        return "bg-orange-100 text-orange-800";
      case "Cancel":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "Assigned":
        return "Đã giao";
      case "Taken":
        return "Đã nhận";
      case "InProcess":
        return "Đang thực hiện";
      case "DoneInTime":
        return "Hoàn thành đúng hạn";
      case "DoneInLate":
        return "Hoàn thành trễ hạn";
      case "Cancel":
        return "Bị hủy";
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN");
    } catch {
      return dateString;
    }
  };

  // Kiểm tra xem task có bị trễ so với end_date không (nhiệm vụ chỉ quá hạn khi đã qua ngày kết thúc)
  const isTaskOverdue = (): boolean => {
    if (!taskData?.end_date) return false;
    const endDate = new Date(taskData.end_date);
    const currentDate = new Date();
    return currentDate > endDate;
  };

  // Kiểm tra xem task có bị trễ so với end_date không
  const isTaskLate = (): boolean => {
    if (!taskData?.end_date) return false;
    const endDate = new Date(taskData.end_date);
    const currentDate = new Date();
    return currentDate > endDate;
  };

  // Cập nhật status của task
  const updateTaskStatus = async (newStatus: number) => {
    if (!taskData?.id) return;

    try {
      setUpdatingStatus(true);
      const response = await axiosInstance.put("/api/tasks/update-status", {
        taskId: taskData.id,
        status: newStatus,
      });

      if (response.status === 200) {
        // Cập nhật status trong state
        const statusMap: Record<number, StatusType> = {
          0: "Assigned",
          1: "Taken",
          2: "InProcess",
          3: "DoneInTime",
          4: "DoneInLate",
          5: "Cancel",
        };

        setTaskData((prev) =>
          prev
            ? {
                ...prev,
                status: statusMap[newStatus] || prev.status,
              }
            : null
        );

        const statusLabels: Record<number, string> = {
          0: "Đã giao",
          1: "Đã nhận",
          2: "Đang thực hiện",
          3: "Hoàn thành đúng hạn",
          4: "Hoàn thành trễ hạn",
          5: "Bị hủy",
        };

        enqueueSnackbar(
          `Cập nhật trạng thái thành công: ${statusLabels[newStatus]}`,
          { variant: "success" }
        );
      }
    } catch (error) {
      console.error("Error updating task status:", error);
      const apiError = error as {
        response?: {
          data?: string;
          status?: number;
        };
        message?: string;
      };
      const backendMessage =
        apiError.response?.data ??
        apiError.message ??
        "Cập nhật trạng thái thất bại!";

      enqueueSnackbar(backendMessage, {
        variant: "error",
        autoHideDuration: 5000,
        preventDuplicate: true,
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Xử lý nút nhận nhiệm vụ
  const handleTakeTask = () => {
    if (isTaskOverdue()) {
      enqueueSnackbar("Không thể nhận nhiệm vụ đã quá hạn kết thúc", {
        variant: "warning",
      });
      return;
    }
    void updateTaskStatus(1);
  };

  // Xử lý nút thực hiện nhiệm vụ
  const handleStartTask = () => {
    void updateTaskStatus(2);
  };

  // Xử lý nút hoàn thành nhiệm vụ
  const handleCompleteTask = () => {
    setShowReportPopup(true);
  };

  // Xử lý file upload
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);

      // Tạo preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  // Xử lý gửi báo cáo
  const handleSubmitReport = async () => {
    if (!selectedFile || !reportInformation || !taskData?.id) {
      enqueueSnackbar("Vui lòng điền đầy đủ thông tin báo cáo", {
        variant: "error",
      });
      return;
    }

    try {
      setSubmittingReport(true);

      // Tạo FormData để gửi file
      const formData = new FormData();
      formData.append("image", selectedFile);
      formData.append("description", reportInformation);
      formData.append("taskid", taskData.id);

      // Gửi báo cáo
      await axiosInstance.put("/api/tasks/update-report-task", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Sau khi gửi báo cáo thành công, cập nhật status
      const status = isTaskLate() ? 4 : 3; // 4 = DoneInLate, 3 = DoneInTime
      await updateTaskStatus(status);

      // Đóng popup và reset form
      setShowReportPopup(false);
      setSelectedFile(null);
      setReportInformation("");
      setPreviewUrl(null);

      enqueueSnackbar("Báo cáo đã được gửi thành công!", {
        variant: "success",
      });
    } catch (error) {
      console.error("Error submitting report:", error);
      const apiError = error as {
        response?: {
          data?: string;
          status?: number;
        };
        message?: string;
      };
      const backendMessage =
        apiError.response?.data ?? apiError.message ?? "Gửi bao cáo thất bại!";

      enqueueSnackbar(backendMessage, {
        variant: "error",
        autoHideDuration: 5000,
        preventDuplicate: true,
      });
    } finally {
      setSubmittingReport(false);
    }
  };

  // Đóng popup
  const handleClosePopup = () => {
    setShowReportPopup(false);
    setSelectedFile(null);
    setReportInformation("");
    setPreviewUrl(null);
  };

  // Xử lý nút hủy nhiệm vụ
  const handleCancelTask = () => {
    if (isTaskOverdue()) {
      enqueueSnackbar("Không thể hủy nhiệm vụ đã quá hạn kết thúc", {
        variant: "warning",
      });
      return;
    }
    void updateTaskStatus(5);
  };

  // Kiểm tra xem nút có được enable không
  const canTakeTask = (): boolean => {
    return taskData?.status === "Assigned" && !isTaskOverdue();
  };

  const canStartTask = (): boolean => {
    return taskData?.status === "Assigned" || taskData?.status === "Taken";
  };

  const canCompleteTask = (): boolean => {
    return taskData?.status === "InProcess";
  };

  const canCancelTask = (): boolean => {
    const allowedStatuses: StatusType[] = ["Assigned", "Taken", "InProcess"];
    return (
      allowedStatuses.includes(taskData?.status ?? "Cancel") && !isTaskOverdue()
    );
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

  if (error) {
    return (
      <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Lỗi: {error}</p>
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

  if (!taskData) {
    return (
      <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Không tìm thấy dữ liệu nhiệm vụ</p>
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
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 flex flex-col items-center py-10 px-4">
      <div className="bg-white rounded-xl px-8 pt-8 pb-8 shadow-[0_2px_8px_rgba(0,0,0,0.06)] w-full max-w-[900px] mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">
            Chi tiết Nhiệm vụ: {taskData.name}
          </h2>
          <div className="flex gap-3">
            {/* Nút nhận nhiệm vụ */}
            <button
              onClick={handleTakeTask}
              disabled={!canTakeTask() || updatingStatus}
              className={`px-4 py-2 rounded-lg transition-colors ${
                canTakeTask()
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {updatingStatus ? "Đang cập nhật..." : "Nhận nhiệm vụ"}
            </button>

            {/* Nút thực hiện nhiệm vụ */}
            <button
              onClick={handleStartTask}
              disabled={!canStartTask() || updatingStatus}
              className={`px-4 py-2 rounded-lg transition-colors ${
                canStartTask()
                  ? "bg-yellow-600 text-white hover:bg-yellow-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {updatingStatus ? "Đang cập nhật..." : "Thực hiện nhiệm vụ"}
            </button>

            {/* Nút hoàn thành nhiệm vụ */}
            <button
              onClick={handleCompleteTask}
              disabled={!canCompleteTask() || updatingStatus}
              className={`px-4 py-2 rounded-lg transition-colors ${
                canCompleteTask()
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {updatingStatus ? "Đang cập nhật..." : "Hoàn thành nhiệm vụ"}
            </button>

            {/* Nút hủy nhiệm vụ */}
            <button
              onClick={handleCancelTask}
              disabled={!canCancelTask() || updatingStatus}
              className={`px-4 py-2 rounded-lg transition-colors ${
                canCancelTask()
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {updatingStatus ? "Đang cập nhật..." : "Hủy nhiệm vụ"}
            </button>
          </div>
        </div>

        {/* Status */}
        <div className="flex flex-col mb-6">
          <label className="font-medium mb-1.5">Trạng thái</label>
          <span
            className={`px-3 py-2 rounded-md text-sm font-medium w-fit ${getStatusColor(
              taskData.status
            )}`}
          >
            {getStatusLabel(taskData.status)}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="flex flex-col">
            <label className="font-medium mb-1.5">Tên nhiệm vụ</label>
            <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
              {taskData.name || "Không có"}
            </div>
          </div>
          <div className="flex flex-col">
            <label className="font-medium mb-1.5">Tên researcher</label>
            <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
              {taskData.researcher || "Không có"}
            </div>
          </div>
        </div>

        <div className="flex flex-col mb-6">
          <label className="font-medium mb-1.5">Mô tả nhiệm vụ</label>
          <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 min-h-[80px]">
            {taskData.description || "Không có"}
          </div>
        </div>

        {/* Nguyên vật liệu */}
        <div className="flex flex-col mb-6">
          <label className="font-medium mb-1.5">Nguyên vật liệu</label>
          {taskData.attributeDTOs && taskData.attributeDTOs.length > 0 ? (
            <div className="space-y-2">
              {/* Header */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-2 font-medium text-sm text-gray-700">
                <span>Tên vật liệu</span>
                <span>Đơn vị</span>
                <span>Số lượng</span>
                <span>Mô tả</span>
              </div>
              {/* Data rows */}
              {taskData.attributeDTOs.map((attribute, idx) => (
                <div
                  className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-2"
                  key={attribute.id || idx}
                >
                  <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                    {attribute.name}
                  </div>
                  <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                    {attribute.measurementUnit}
                  </div>
                  <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                    {attribute.value}
                  </div>
                  <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                    {attribute.description || "N/A"}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="flex flex-col">
            <label className="font-medium mb-1.5">Ngày bắt đầu</label>
            <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
              {taskData.start_date
                ? formatDate(taskData.start_date)
                : "Không có"}
            </div>
          </div>
          <div className="flex flex-col">
            <label className="font-medium mb-1.5">Ngày kết thúc</label>
            <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
              {taskData.end_date ? formatDate(taskData.end_date) : "Không có"}
            </div>
          </div>
          <div className="flex flex-col">
            <label className="font-medium mb-1.5">Ngày tạo</label>
            <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
              {taskData.create_at ? formatDate(taskData.create_at) : "Không có"}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            className="min-w-[90px] px-5 py-2 rounded-lg border-none text-base font-semibold cursor-pointer transition-colors duration-200 bg-gray-300 text-gray-800 hover:bg-gray-400"
            onClick={handleBack}
          >
            Quay lại
          </button>
        </div>

        {/* Báo cáo và hình ảnh */}
        <div className="flex flex-col mb-6 mt-6">
          <label className="font-medium mb-1.5">Thông tin báo cáo</label>
          <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
            {taskData.reportInformation || "Không có"}
          </div>
        </div>
        {taskData.url && (
          <div className="flex flex-col mb-6">
            <label className="font-medium mb-1.5">Ảnh báo cáo</label>
            <a
              href={taskData.url}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 underline break-all mb-2"
            >
              {taskData.url}
            </a>
            <img
              src={taskData.url}
              alt="Report"
              className="max-h-64 object-contain border rounded"
            />
          </div>
        )}

        {/* Loại nhiệm vụ */}
        <div className="flex flex-col mb-6">
          <label className="font-medium mb-1.5">Loại nhiệm vụ</label>
          <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
            {taskData.isDaily === true
              ? "Lặp lại hằng ngày tới ngày kết thúc"
              : taskData.isDaily === false
              ? "Thực hiện một lần"
              : "Không có"}
          </div>
        </div>
      </div>

      {/* Report Popup */}
      {showReportPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">
                Báo cáo hoàn thành nhiệm vụ
              </h3>
              <button
                onClick={handleClosePopup}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* File Upload */}
              <div>
                <label className="block font-medium mb-2">
                  Chọn ảnh báo cáo *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
                {selectedFile && (
                  <p className="text-sm text-gray-600 mt-1">
                    Đã chọn: {selectedFile.name}
                  </p>
                )}
              </div>

              {/* Image Preview */}
              {previewUrl && (
                <div>
                  <label className="block font-medium mb-2">
                    Xem trước ảnh
                  </label>
                  <div className="border border-gray-300 rounded-md p-2">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-w-full h-auto max-h-64 object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Report Information */}
              <div>
                <label className="block font-medium mb-2">
                  Thông tin báo cáo *
                </label>
                <textarea
                  value={reportInformation}
                  onChange={(e) => setReportInformation(e.target.value)}
                  placeholder="Mô tả chi tiết công việc đã hoàn thành..."
                  rows={4}
                  className="w-full p-2 border border-gray-300 rounded-md resize-none"
                />
              </div>

              {/* Deadline Warning */}
              {isTaskLate() && (
                <div className="p-3 bg-orange-100 border border-orange-300 rounded-md">
                  <p className="text-orange-800 text-sm">
                    ⚠️ Nhiệm vụ này đã quá hạn kết thúc. Báo cáo sẽ được đánh
                    dấu là "Hoàn thành trễ hạn".
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button
                onClick={handleClosePopup}
                disabled={submittingReport}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmitReport}
                disabled={
                  submittingReport || !selectedFile || !reportInformation
                }
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingReport ? "Đang gửi..." : "Gửi báo cáo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default TechDetailTask;
