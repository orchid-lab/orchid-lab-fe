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

interface TaskAttribute {
  chemicalName: string | null;
  materialName: string | null;
  unit: string | null;
  value: number | null;
}

interface TaskAssignment {
  taskId: string;
  technicianName: string;
  targetType: string;
  targetId: string;
  startDate: string;
  endDate: string;
  expectedEndDate: string;
}

interface CheckListItemDto {
  id: string;
  name: string;
  description: string;
  order: number;
  expectedUnit: string | null;
  expectedMinValue: number | null;
  expectedMaxValue: number | null;
  status: string;
  measurementUnit: string | null;
  mesuredValue: number | null;
  isPass: boolean | null;
  evaluated: string | null;
}

interface TaskCheckList {
  id: string;
  checkListItemDtos: CheckListItemDto[];
}

interface EditableUpdateAttribute {
  attributeId: string;
  elementName: string;
  measurementUnit: string;
  value: number;
  description: string;
}

interface EditableCreateAttribute {
  elementName: string;
  measurementUnit: string;
  value: number;
  description: string;
}

interface TaskData {
  id: string;
  name: string;
  description: string;
  stageId: string | null;
  researcherId: string;
  status: string;
  createdDate: string;
  createdBy: string;
  updatedDate: string;
  updatedBy: string;
  deletedDate: string | null;
  deletedBy: string | null;
  taskAttributes: TaskAttribute[];
  taskAssignments: TaskAssignment | null;
  taskCheckList: TaskCheckList | null;
  reportInformation?: string; // Added optional property
  url?: string; // Added optional property
  isDaily?: boolean; // Added optional property
}

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
    case "WaitingForApproval":
      return "bg-yellow-50 text-yellow-700 border border-yellow-200";
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
    case "WaitingForApproval":
      return "Chờ phê duyệt";
    default:
      return status;
  }
};

const formatDate = (dateString: string) => {
  if (!dateString) return "Không có";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const TaskDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { enqueueSnackbar } = useSnackbar();
  const [taskData, setTaskData] = useState<TaskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // editing state
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  // const [elements, setElements] = useState<ElementItem[]>([]); // Removed: no longer used
  const [updateRows, setUpdateRows] = useState<EditableUpdateAttribute[]>([]);
  const [createRows, setCreateRows] = useState<EditableCreateAttribute[]>([]);

  const [creatorName, setCreatorName] = useState<string>(""); // Ensure creatorName is defined

  useEffect(() => {
    const fetchTaskDetail = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const response = await axiosInstance.get(`/api/tasks/${id}`);
        const value: TaskData = response.data?.value ?? response.data; // Added type annotation
        if (value?.id) {
          setTaskData(value);
          const creatorId = value.createdBy;
          if (creatorId) {
            try {
              const userResponse = await axiosInstance.get(
                `/api/user/${creatorId}`,
              ); // Updated API endpoint
              setCreatorName(userResponse.data?.name ?? creatorId); // Replaced || with ??
            } catch {
              setCreatorName(creatorId);
            }
          }
        } else {
          throw new Error("No data received");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải dữ liệu";
        setError(errorMessage);
        enqueueSnackbar("Không thể tải chi tiết nhiệm vụ", {
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    };
    void fetchTaskDetail();
  }, [id, enqueueSnackbar]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleDelete = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa nhiệm vụ này?")) {
      setSaving(true);
      axiosInstance
        .delete(`/api/tasks/${id}`)
        .then(() => {
          enqueueSnackbar("Xóa nhiệm vụ thành công", {
            variant: "success",
          });
          navigate("/tasks");
        })
        .catch((err) => {
          const errorMessage =
            err instanceof Error
              ? err.message
              : "Đã xảy ra lỗi khi xóa nhiệm vụ";
          setError(errorMessage);
          enqueueSnackbar("Không thể xóa nhiệm vụ", {
            variant: "error",
          });
        })
        .finally(() => {
          setSaving(false);
        });
    }
  };

  const handleBack = () => {
    navigate("/tasks");
  };

  const addCreateRow = () => {};
  const createRowChange = (idx, field, value) => {};
  const handleSave = () => {};

  useEffect(() => {
    if (taskData?.createdBy) {
      axiosInstance
        .get(`/api/users/${taskData.createdBy}`)
        .then((res) => {
          if (res.data && res.data.name) {
            setCreatorName(res.data.name);
          } else {
            setCreatorName(taskData.createdBy);
          }
        })
        .catch(() => {
          setCreatorName(taskData.createdBy);
        });
    }
  }, [taskData?.createdBy]);

  const sortedChecklistItems =
    taskData?.taskCheckList?.checkListItemDtos
      ?.slice()
      .sort((a, b) => a.order - b.order) || [];

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 flex flex-col items-center py-10 px-4">
      {loading ? (
        <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải dữ liệu...</p>
          </div>
        </main>
      ) : error ? (
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
      ) : !taskData ? (
        <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Không tìm thấy dữ liệu nhiệm vụ
            </p>
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
            >
              Quay lại
            </button>
          </div>
        </main>
      ) : (
        <>
          {/* Header + Status badge */}
          <div className="w-full max-w-[1100px] mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 mb-2">
                  Nhiệm vụ / Chi tiết
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {taskData.name}
                </div>
                {taskData.status === "WaitingForApproval" && (
                  <span className={`w-fit ${getStatusColor(taskData.status)}`}>
                    {getStatusLabel(taskData.status)}
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                {!isEditing && (
                  <button
                    type="button"
                    onClick={handleEdit}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-orange-700 font-semibold rounded-lg shadow hover:bg-orange-50 transition-colors"
                  >
                    <span>✏️</span> Chỉnh sửa
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow hover:bg-red-700 transition-colors"
                >
                  <span>🗑️</span> Xóa nhiệm vụ
                </button>
              </div>
            </div>
          </div>

          <div className="w-full max-w-[1100px] flex flex-col gap-8">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-700">Tên:</span>
                  <span className="text-gray-800">{taskData.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-700">ID:</span>
                  <span className="text-gray-800">{taskData.id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-700">
                    Người tạo:
                  </span>
                  <span className="text-gray-800">
                    {creatorName || taskData.createdBy}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-700">Ngày tạo:</span>
                  <span className="text-gray-800">
                    {formatDate(taskData.createdDate)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-700">
                    Ngày cập nhật:
                  </span>
                  <span className="text-gray-800">
                    {formatDate(taskData.updatedDate)}
                  </span>
                </div>
              </div>
              <div className="mt-6">
                <span className="font-semibold text-gray-700">Mô tả:</span>
                <div className="mt-2 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 min-h-[80px]">
                  {taskData.description}
                </div>
              </div>
            </div>

            {/* Card 2: Nguyên vật liệu */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Nguyên vật liệu
              </h3>
              {Array.isArray(taskData.taskAttributes) &&
              taskData.taskAttributes.length > 0 ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-4 gap-3 mb-2 font-medium text-sm text-gray-700">
                    <span>Tên vật liệu</span>
                    <span>Đơn vị</span>
                    <span>Số lượng</span>
                    <span>Tên hóa chất</span>
                  </div>
                  {taskData.taskAttributes.map((attr, idx) => (
                    <div className="grid grid-cols-4 gap-3 mb-2" key={idx}>
                      <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                        {attr.materialName || "-"}
                      </div>
                      <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                        {attr.unit || "-"}
                      </div>
                      <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                        {attr.value ?? "-"}
                      </div>
                      <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                        {attr.chemicalName || "-"}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 italic">
                  Không có nguyên vật liệu nào được ghi nhận
                </div>
              )}
            </div>

            {/* Card 3: Phân công & Checklist */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Thông tin phân công
              </h3>
              {taskData.taskAssignments ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-4 gap-3 mb-2 font-medium text-sm text-gray-700">
                    <span>Kỹ thuật viên</span>
                    <span>Ngày bắt đầu</span>
                    <span>Ngày kết thúc</span>
                    <span>Ngày dự kiến kết thúc</span>
                  </div>
                  <div className="grid grid-cols-4 gap-3 mb-2">
                    <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                      {taskData.taskAssignments.technicianName || "-"}
                    </div>
                    <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                      {formatDate(taskData.taskAssignments.startDate)}
                    </div>
                    <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                      {taskData.taskAssignments.endDate &&
                      taskData.taskAssignments.endDate !== "0001-01-01T00:00:00"
                        ? formatDate(taskData.taskAssignments.endDate)
                        : "-"}
                    </div>
                    <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                      {formatDate(taskData.taskAssignments.expectedEndDate)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 italic">
                  Không có thông tin phân công
                </div>
              )}
              <div className="mt-8">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  Checklist nhiệm vụ
                </h3>
                {taskData.taskCheckList &&
                Array.isArray(taskData.taskCheckList.checkListItemDtos) &&
                taskData.taskCheckList.checkListItemDtos.length > 0 ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-6 gap-3 mb-2 font-medium text-sm text-gray-700">
                      <span>Tên checklist</span>
                      <span>Mô tả</span>
                      <span>Thứ tự</span>
                      <span>Đơn vị</span>
                      <span>Giá trị đo</span>
                      <span>Trạng thái</span>
                    </div>
                    {sortedChecklistItems.map((item, idx) => (
                      <div
                        className="grid grid-cols-6 gap-3 mb-2"
                        key={item.id || idx}
                      >
                        <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                          {item.name}
                        </div>
                        <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                          {item.description || "-"}
                        </div>
                        <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                          {item.order}
                        </div>
                        <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                          {item.measurementUnit || item.expectedUnit || "-"}
                        </div>
                        <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                          {item.mesuredValue ?? "-"}
                        </div>
                        <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                          {item.status}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 italic">
                    Không có checklist nào
                  </div>
                )}
              </div>
            </div>

            {/* Card 4: Báo cáo & Loại nhiệm vụ */}
            {/* <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  Thông tin báo cáo
                </h3>
                <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 mb-4">
                  {taskData.reportInformation ?? "Không có"}
                </div>
                {taskData.url && (
                  <div className="mb-4">
                    <label className="font-medium mb-1.5">Ảnh báo cáo</label>
                    <a
                      href={taskData.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 underline break-all mb-2 block"
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
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  Loại nhiệm vụ
                </h3>
                <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                  {taskData.isDaily === true
                    ? "Lặp lại hằng ngày tới ngày kết thúc"
                    : taskData.isDaily === false
                      ? "Thực hiện một lần"
                      : "Không có"}
                </div>
              </div>
            </div> */}
          </div>
        </>
      )}
    </main>
  );
};

export default TaskDetailPage;
