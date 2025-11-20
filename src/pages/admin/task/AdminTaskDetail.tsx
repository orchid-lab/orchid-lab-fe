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

interface AssignDTO {
  id: string;
  technicianName: string;
  status: boolean;
}

interface TaskData {
  value: string;
  id: string;
  researcher: string;
  assignDTOs: AssignDTO[];
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

const AdminTaskDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { enqueueSnackbar } = useSnackbar();
  const [taskData, setTaskData] = useState<TaskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTaskDetail = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const response = await axiosInstance.get(`/api/tasks/${id}`);

        if (response.data && response.data.value) {
          console.log("API Response:", response.data.value);
          setTaskData(response.data.value);
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

    fetchTaskDetail();
  }, [id, enqueueSnackbar]);

  const handleBack = (): void => {
    void navigate(-1);
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
        return "bg-green-100 text-green-800";
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
            Chi tiết Task: {taskData.name || "Không có"}
          </h2>
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

        {/* Kỹ thuật viên được giao */}
        <div className="flex flex-col mb-8">
          <label className="font-medium mb-1.5">Kỹ thuật viên được giao</label>
          {taskData.assignDTOs && taskData.assignDTOs.length > 0 ? (
            <div className="space-y-2">
              {taskData.assignDTOs.map((assign, idx) => (
                <div
                  key={assign.id || idx}
                  className="bg-green-50 border-[1.5px] border-green-700 rounded-lg py-2.5 px-[18px] font-semibold flex items-center min-h-[40px]"
                >
                  <span className="w-8 h-8 rounded-full bg-[#4cafef] text-white flex items-center justify-center font-bold text-[1.05rem] mr-2.5 flex-shrink-0">
                    TV
                  </span>
                  <span className="flex-1">
                    {assign.technicianName || "Không có"}
                  </span>
                  <span
                    className={`text-[0.98em] ml-2.5 flex-shrink-0 px-2 py-1 rounded-full text-xs ${
                      assign.status
                        ? "text-green-700 bg-green-100"
                        : "text-red-700 bg-red-100"
                    }`}
                  >
                    {assign.status ? "Hoạt động" : "Không hoạt động"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 italic">
              Chưa có kỹ thuật viên nào được giao
            </div>
          )}
        </div>

        {/* Báo cáo và hình ảnh */}
        <div className="flex flex-col mb-6">
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
    </main>
  );
};

export default AdminTaskDetail;
