import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axiosInstance from "../../../../api/axiosInstance";
import { useSnackbar } from "notistack";

interface TaskTemplate {
  id: string;
  name: string;
  stageID: string;
  stageName: string;
  description: string;
  status: boolean;
  details: TemplateDetail[];
}

interface Method {
  id: string;
  name: string;
  description: string;
  type: string;
  status: boolean;
  stages: Stage[];
}

interface Stage {
  id: string;
  name: string;
  description: string;
  dateOfProcessing: number;
  step: number;
  status: boolean;
}

interface TemplateDetail {
  id: string;
  element: string;
  name: string;
  description: string;
  expectedValue: number;
  unit: string;
  isRequired: boolean;
  status: boolean;
}

interface Technician {
  id: string;
  name: string;
  email: string;
  roleID: number;
}

interface ApiTaskTemplateResponse {
  value?: {
    data?: TaskTemplate[];
    totalCount?: number;
  };
}

function isApiTaskTemplateResponse(
  obj: unknown
): obj is ApiTaskTemplateResponse {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "value" in obj &&
    typeof (obj as { value: unknown }).value === "object"
  );
}

const AutoCreateTaskContainer: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { enqueueSnackbar } = useSnackbar();

  // URL parameters
  const experimentLogId = searchParams.get("experimentLogId");
  const stageId = searchParams.get("stageId");
  const autoCreate = searchParams.get("autoCreate") === "true";

  // State
  const [taskTemplates, setTaskTemplates] = useState<TaskTemplate[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [selectedTechnician, setSelectedTechnician] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [loadingTechnicians, setLoadingTechnicians] = useState(false);
  const [loadingMethod, setLoadingMethod] = useState(false);
  const [method, setMethod] = useState<Method | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Derived dates
  const [startDateIso, setStartDateIso] = useState<string>("");
  const [endDateIso, setEndDateIso] = useState<string>("");

  // Load method and stage information
  useEffect(() => {
    if (!experimentLogId) {
      setError("Không có thông tin nhật ký thí nghiệm");
      return;
    }

    setLoadingMethod(true);
    axiosInstance
      .get(`/api/experimentlog/${experimentLogId}`)
      .then((res) => {
        const methodData = (res.data as { value?: Method })?.value;
        if (methodData) {
          setMethod(methodData);
        }
      })
      .catch(() => {
        setError("Không thể tải thông tin phương pháp");
        enqueueSnackbar("Lỗi khi tải dữ liệu", { variant: "error" });
      })
      .finally(() => setLoadingMethod(false));
  }, [experimentLogId, enqueueSnackbar]);

  // Compute start/end dates: start = tomorrow, end = start + dateOfProcessing days
  useEffect(() => {
    // start date = tomorrow
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    // Đặt thời gian về 00:00:00 và thêm 7 tiếng cho múi giờ Việt Nam
    tomorrow.setHours(7, 0, 0, 0);
    const startIso = tomorrow.toISOString();
    setStartDateIso(startIso);

    // end date depends on stage's dateOfProcessing
    let durationDays = 0;
    if (method && stageId) {
      const st = method.stages?.find((s) => s.id === stageId);
      if (st && typeof st.dateOfProcessing === "number") {
        durationDays = st.dateOfProcessing;
      }
    }
    const end = new Date(tomorrow);
    if (durationDays > 0) {
      end.setDate(end.getDate() + durationDays);
    } else {
      // default to same as start if unknown
      end.setDate(end.getDate());
    }
    // Đặt thời gian về 00:00:00 và thêm 7 tiếng cho múi giờ Việt Nam
    end.setHours(7, 0, 0, 0);
    setEndDateIso(end.toISOString());
  }, [method, stageId]);

  // Load task templates based on stageId
  useEffect(() => {
    if (!stageId) {
      setError("Không có thông tin giai đoạn");
      return;
    }

    setLoadingTemplates(true);
    axiosInstance
      .get(`/api/tasktemplate?pageNumber=1&pageSize=100&filter=${stageId}`)
      .then((res) => {
        if (isApiTaskTemplateResponse(res.data)) {
          const data = Array.isArray(res.data.value?.data)
            ? res.data.value.data
            : [];
          // Filter by stageID
          const filteredTemplates = data.filter(
            (template) => template.stageID === stageId
          );
          setTaskTemplates(filteredTemplates);

          if (filteredTemplates.length === 0) {
            setError("Không có mẫu nhiệm vụ nào cho giai đoạn này");
          }
        }
      })
      .catch(() => {
        setError("Không thể tải danh sách mẫu nhiệm vụ");
        enqueueSnackbar("Lỗi khi tải dữ liệu", { variant: "error" });
      })
      .finally(() => setLoadingTemplates(false));
  }, [stageId, enqueueSnackbar]);

  // Load technicians
  useEffect(() => {
    setLoadingTechnicians(true);
    axiosInstance
      .get("/api/user?pageNumber=1&pageSize=100")
      .then((res) => {
        const responseData = res.data as { data?: Technician[] };
        const data = Array.isArray(responseData?.data) ? responseData.data : [];
        // Filter technicians with roleID = 3 (same as SelectTechnicianContainer)
        const filteredTechnicians = data.filter(
          (t) => String(t.roleID) === "3"
        );
        setTechnicians(filteredTechnicians);
      })
      .catch(() => {
        setError("Không thể tải danh sách kỹ thuật viên");
        enqueueSnackbar("Lỗi khi tải dữ liệu", { variant: "error" });
      })
      .finally(() => setLoadingTechnicians(false));
  }, [enqueueSnackbar]);

  // Generate task data from template
  const generateTaskFromTemplate = (template: TaskTemplate) => {
    return {
      experimentLogID: experimentLogId,
      stageID: stageId,
      sampleID: null, // Không bắt buộc, sử dụng null thay vì ""
      name: template.name,
      description: template.description,
      start_date: startDateIso,
      end_date: endDateIso,
      isDaily: true, // Luôn luôn là daily task cho auto-create
      attribute: template.details.map((detail) => ({
        elementId: detail.element, // Thêm elementId từ template detail
        name: detail.name,
        measurementUnit: detail.unit,
        value: detail.expectedValue,
        description: detail.description,
      })),
      assignCommand: selectedTechnician
        ? [{ technicianId: selectedTechnician }]
        : [],
    };
  };

  // Create all tasks
  const handleCreateTasks = async () => {
    if (!selectedTechnician) {
      enqueueSnackbar("Vui lòng chọn kỹ thuật viên", { variant: "error" });
      return;
    }

    if (taskTemplates.length === 0) {
      enqueueSnackbar("Không có mẫu nhiệm vụ nào để tạo", { variant: "error" });
      return;
    }

    if (!experimentLogId || !stageId) {
      enqueueSnackbar("Thiếu thông tin nhật ký thí nghiệm hoặc giai đoạn", {
        variant: "error",
      });
      return;
    }

    setLoading(true);

    try {
      const tasks = taskTemplates.map((template) =>
        generateTaskFromTemplate(template)
      );

      console.log("Creating tasks:", tasks); // Debug log

      // Create tasks one by one to handle errors better
      const results = [];
      for (let i = 0; i < tasks.length; i++) {
        try {
          const response = await axiosInstance.post("/api/tasks", tasks[i]);
          results.push(response.data);
          console.log(`Task ${i + 1} created successfully:`, response.data);
        } catch (error) {
          console.error(`Error creating task ${i + 1}:`, error);
          console.error("Task data that failed:", tasks[i]);
          throw error;
        }
      }

      enqueueSnackbar(`Đã tạo thành công ${results.length} nhiệm vụ!`, {
        variant: "success",
      });
      void navigate("/tasks");
    } catch (error: unknown) {
      console.error("Error creating tasks:", error);
      if (
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "data" in error.response &&
        error.response.data &&
        typeof error.response.data === "object" &&
        "message" in error.response.data
      ) {
        enqueueSnackbar(
          `Lỗi khi tạo nhiệm vụ: ${
            (error.response.data as { message: string }).message
          }`,
          { variant: "error" }
        );
      } else {
        enqueueSnackbar("Lỗi khi tạo nhiệm vụ", { variant: "error" });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!autoCreate) {
    return (
      <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 flex flex-col items-center py-10">
        <div className="bg-white rounded-xl px-8 pt-8 pb-6 shadow-md max-w-2xl w-full text-center">
          <h2 className="text-2xl font-bold mb-6 text-red-700">
            Truy cập không hợp lệ
          </h2>
          <p className="text-gray-600 mb-4">
            Vui lòng truy cập từ trang chi tiết nhật ký thí nghiệm
          </p>
          <button
            className="mt-4 bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800"
            onClick={() => void navigate("/experiment-logs")}
          >
            Quay lại danh sách
          </button>
        </div>
      </main>
    );
  }

  if (loadingTemplates || loadingTechnicians || loadingMethod) {
    return (
      <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 flex flex-col items-center py-10">
        <div className="bg-white rounded-xl px-8 pt-8 pb-6 shadow-md max-w-2xl w-full text-center">
          <h2 className="text-2xl font-bold mb-6 text-green-800">
            Đang tải...
          </h2>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700 mx-auto"></div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 flex flex-col items-center py-10">
        <div className="bg-white rounded-xl px-8 pt-8 pb-6 shadow-md max-w-2xl w-full text-center">
          <h2 className="text-2xl font-bold mb-6 text-red-700">Lỗi</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            className="mt-4 bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800"
            onClick={() => void navigate("/experiment-logs")}
          >
            Quay lại
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 flex flex-col items-center py-10">
      <div className="bg-white rounded-xl px-8 pt-8 pb-8 shadow-[0_2px_8px_rgba(0,0,0,0.06)] w-full max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">
            Tạo nhiệm vụ tự động hằng ngày
          </h2>
          <button
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            onClick={() => void navigate("/create-task/step-1")}
          >
            Tạo thủ công
          </button>
        </div>

        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-2">
            Thông tin tự động
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Phương pháp:</span>{" "}
              {method?.name ?? "Đang tải..."}
            </div>
            <div>
              <span className="font-medium">Giai đoạn:</span>{" "}
              {method?.stages?.find((s) => s.id === stageId)?.name ??
                "Đang tải..."}
            </div>
            <div>
              <span className="font-medium">Ngày bắt đầu:</span>{" "}
              {startDateIso
                ? new Date(startDateIso).toLocaleDateString("vi-VN")
                : "Đang tính..."}
            </div>
            <div>
              <span className="font-medium">Ngày kết thúc:</span>{" "}
              {endDateIso
                ? new Date(endDateIso).toLocaleDateString("vi-VN")
                : "Đang tính..."}
            </div>
          </div>
        </div>

        {/* Task Templates Preview */}
        <div className="mb-6">
          <h3 className="font-semibold mb-4">
            Mẫu nhiệm vụ sẽ được tạo ({taskTemplates.length} mẫu)
          </h3>
          <div className="space-y-3">
            {taskTemplates.map((template, index) => (
              <div
                key={template.id}
                className="p-4 border border-gray-200 rounded-lg bg-gray-50"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-lg">{template.name}</h4>
                    <p className="text-gray-600 text-sm">
                      Giai đoạn: {template.stageName}
                    </p>
                    <p className="text-gray-600 text-sm mt-1">
                      {template.description}
                    </p>
                  </div>
                  <span className="text-sm text-gray-500">#{index + 1}</span>
                </div>

                {/* Preview attributes */}
                {template.details && template.details.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Nguyên vật liệu:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {template.details.map((detail, idx) => (
                        <div
                          key={idx}
                          className="text-xs bg-white p-3 rounded border"
                        >
                          <div className="font-medium text-sm">
                            {detail.name}
                          </div>
                          <div className="text-gray-600 text-xs mt-1">
                            <span className="font-medium">Số lượng:</span>{" "}
                            {detail.expectedValue} {detail.unit}
                          </div>
                          <div className="text-gray-600 text-xs mt-1">
                            <span className="font-medium">Đơn vị:</span>{" "}
                            {detail.unit}
                          </div>
                          {detail.description && (
                            <div className="text-gray-500 text-xs mt-1">
                              <span className="font-medium">Mô tả:</span>{" "}
                              {detail.description}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Technician Selection */}
        <div className="mb-6">
          <h3 className="font-semibold mb-4">Chọn kỹ thuật viên *</h3>
          <select
            value={selectedTechnician}
            onChange={(e) => setSelectedTechnician(e.target.value)}
            className="w-full py-2 px-3 border border-gray-300 rounded-md text-base bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          >
            <option value="">Chọn kỹ thuật viên...</option>
            {technicians.map((tech) => (
              <option key={tech.id} value={tech.id}>
                {tech.name}
              </option>
            ))}
          </select>
          {loadingTechnicians && (
            <span className="text-xs text-gray-400">Đang tải...</span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            onClick={() => void navigate("/experiment-logs")}
          >
            Hủy
          </button>
          <button
            type="button"
            className="px-5 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            onClick={() => void handleCreateTasks()}
            disabled={
              loading || !selectedTechnician || taskTemplates.length === 0
            }
          >
            {loading ? "Đang tạo..." : `Tạo ${taskTemplates.length} nhiệm vụ`}
          </button>
        </div>
      </div>
    </main>
  );
};

export default AutoCreateTaskContainer;
