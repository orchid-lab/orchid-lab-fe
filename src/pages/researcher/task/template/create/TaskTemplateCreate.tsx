import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../../../../api/axiosInstance";
import { useSnackbar } from "notistack";

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

interface Element {
  id: string;
  name: string;
  description: string;
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

interface ApiMethodResponse {
  value?: {
    data?: Method[];
    totalCount?: number;
  };
}

interface ApiElementResponse {
  value?: {
    data?: Element[];
    totalCount?: number;
  };
}

function isApiMethodResponse(obj: unknown): obj is ApiMethodResponse {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "value" in obj &&
    typeof (obj as { value: unknown }).value === "object"
  );
}

function isApiElementResponse(obj: unknown): obj is ApiElementResponse {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "value" in obj &&
    typeof (obj as { value: unknown }).value === "object"
  );
}

const TaskTemplateCreate: React.FC = () => {
  const [name, setName] = useState("");
  const [methods, setMethods] = useState<Method[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState("");
  const [stages, setStages] = useState<Stage[]>([]);
  const [selectedStageId, setSelectedStageId] = useState("");
  const [description, setDescription] = useState("");
  const [elements, setElements] = useState<Element[]>([]);
  const [details, setDetails] = useState<TemplateDetail[]>([
    {
      id: "",
      element: "",
      name: "",
      description: "",
      expectedValue: 0,
      unit: "",
      isRequired: true,
      status: true,
    },
  ]);

  const [loadingMethods, setLoadingMethods] = useState(false);
  const [loadingElements, setLoadingElements] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  // Fetch methods
  useEffect(() => {
    setLoadingMethods(true);
    axiosInstance
      .get("/api/method?pageNumber=1&pageSize=100")
      .then((res) => {
        if (isApiMethodResponse(res.data)) {
          const data = Array.isArray(res.data.value?.data)
            ? res.data.value.data
            : [];
          setMethods(data);
        }
      })
      .catch(() => {
        setMethods([]);
        enqueueSnackbar("Không thể tải danh sách phương pháp!", {
          variant: "error",
        });
      })
      .finally(() => setLoadingMethods(false));
  }, [enqueueSnackbar]);

  // Fetch elements
  useEffect(() => {
    setLoadingElements(true);
    axiosInstance
      .get("/api/element?pageNumber=1&pageSize=100")
      .then((res) => {
        if (isApiElementResponse(res.data)) {
          const data = Array.isArray(res.data.value?.data)
            ? res.data.value.data
            : [];
          setElements(data);
        }
      })
      .catch(() => {
        setElements([]);
        enqueueSnackbar("Không thể tải danh sách nguyên vật liệu!", {
          variant: "error",
        });
      })
      .finally(() => setLoadingElements(false));
  }, [enqueueSnackbar]);

  // Update stages when method changes
  useEffect(() => {
    if (!selectedMethodId) {
      setStages([]);
      setSelectedStageId("");
      return;
    }

    const selectedMethod = methods.find((m) => m.id === selectedMethodId);
    if (selectedMethod) {
      setStages(selectedMethod.stages || []);
      setSelectedStageId("");
    }
  }, [selectedMethodId, methods]);

  const handleDetailChange = (
    idx: number,
    field: keyof TemplateDetail,
    value: string | number | boolean
  ) => {
    setDetails((prev) =>
      prev.map((detail, i) => {
        if (i === idx) {
          if (field === "element") {
            // Khi chọn element, tự động cập nhật unit và id
            const selectedElement = elements.find((el) => el.id === value);
            return {
              ...detail,
              element: value as string,
              name: selectedElement?.name ?? "",
              unit: selectedElement?.description ?? "",
              id: selectedElement?.id ?? "",
            };
          }
          return { ...detail, [field]: value };
        }
        return detail;
      })
    );
  };

  const handleAddDetail = () => {
    setDetails((prev) => [
      ...prev,
      {
        id: "",
        element: "",
        name: "",
        description: "",
        expectedValue: 0,
        unit: "",
        isRequired: true,
        status: true,
      },
    ]);
  };

  const handleRemoveDetail = (idx: number) => {
    setDetails((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !selectedStageId || !description) {
      enqueueSnackbar("Vui lòng điền đầy đủ thông tin bắt buộc!", {
        variant: "error",
      });
      return;
    }

    if (details.some((d) => !d.element || d.expectedValue <= 0)) {
      enqueueSnackbar("Vui lòng điền đầy đủ thông tin nguyên vật liệu!", {
        variant: "error",
      });
      return;
    }

    setSubmitting(true);

    try {
      const templateData = {
        name,
        stageID: selectedStageId,
        description,
        status: true,
        details: details.map((detail) => ({
          id: detail.id,
          element: detail.element,
          name: detail.name,
          description: detail.description,
          expectedValue: detail.expectedValue,
          unit: detail.unit,
          isRequired: detail.isRequired,
          status: detail.status,
        })),
      };

      await axiosInstance.post("/api/tasktemplate", templateData);

      enqueueSnackbar("Tạo mẫu nhiệm vụ thành công!", { variant: "success" });
      void navigate("/task-templates");
    } catch (error) {
      console.error("Error creating task template:", error);
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
        "Tạo mẫu nhiệm vụ thất bại!";

      enqueueSnackbar(backendMessage, {
        variant: "error",
        autoHideDuration: 5000,
        preventDuplicate: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 flex flex-col items-center py-10">
      <div className="bg-white rounded-xl px-8 pt-8 pb-6 shadow-md max-w-4xl w-full">
        <h2 className="text-2xl font-bold mb-6 text-green-800">
          Tạo mẫu nhiệm vụ
        </h2>
        <form
          onSubmit={(e) => {
            void handleSubmit(e);
          }}
        >
          <div className="mb-4">
            <label className="font-medium mb-1.5 block">
              Tên nhiệm vụ mẫu *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full py-2 px-3 border border-gray-300 rounded-md text-base bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="mb-4">
            <label className="font-medium mb-1.5 block">Phương pháp *</label>
            <select
              value={selectedMethodId}
              onChange={(e) => {
                setSelectedMethodId(e.target.value);
                setSelectedStageId("");
              }}
              required
              className="w-full py-2 px-3 border border-gray-300 rounded-md text-base bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Chọn phương pháp...</option>
              {methods.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.name}
                </option>
              ))}
            </select>
            {loadingMethods && (
              <span className="text-xs text-gray-400">Đang tải...</span>
            )}
          </div>

          <div className="mb-4">
            <label className="font-medium mb-1.5 block">Giai đoạn *</label>
            <select
              value={selectedStageId}
              onChange={(e) => setSelectedStageId(e.target.value)}
              required
              disabled={!selectedMethodId}
              className="w-full py-2 px-3 border border-gray-300 rounded-md text-base bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Chọn giai đoạn...</option>
              {stages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="font-medium mb-1.5 block">Mô tả nhiệm vụ *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full py-2 px-3 border border-gray-300 rounded-md text-base bg-gray-50 min-h-[60px] resize-y focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="mb-4">
            <label className="font-medium mb-1.5 block">Nguyên vật liệu</label>
            {loadingElements && (
              <span className="text-xs text-gray-400 mb-2">
                Đang tải danh sách nguyên vật liệu...
              </span>
            )}
            <div className="space-y-4">
              {details.map((detail, idx) => (
                <div
                  key={idx}
                  className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                >
                  {/* Hàng 1: Dropdown chọn nguyên vật liệu */}
                  <div className="mb-3">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Nguyên vật liệu *
                    </label>
                    <select
                      value={detail.element}
                      onChange={(e) =>
                        handleDetailChange(idx, "element", e.target.value)
                      }
                      className="w-full py-2 px-3 border border-gray-300 rounded-md text-base bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    >
                      <option value="">Chọn...</option>
                      {elements.map((element) => (
                        <option key={element.id} value={element.id}>
                          {element.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* Hàng 2: 4 field giống CreateTaskContainer */}
                  <div className="grid grid-cols-4 gap-3">
                    <input
                      type="text"
                      placeholder="Tên nguyên vật liệu"
                      value={detail.name}
                      readOnly
                      className="w-full py-2 px-3 border border-gray-300 rounded-md text-base bg-gray-200 cursor-not-allowed"
                    />
                    <input
                      type="text"
                      placeholder="Đơn vị"
                      value={detail.unit}
                      readOnly
                      className="w-full py-2 px-3 border border-gray-300 rounded-md text-base bg-gray-200 cursor-not-allowed"
                    />
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder="Số lượng"
                      value={detail.expectedValue}
                      onChange={(e) =>
                        handleDetailChange(
                          idx,
                          "expectedValue",
                          Number(e.target.value)
                        )
                      }
                      className="w-full py-2 px-3 border border-gray-300 rounded-md text-base bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Mô tả"
                      value={detail.description}
                      onChange={(e) =>
                        handleDetailChange(idx, "description", e.target.value)
                      }
                      className="w-full py-2 px-3 border border-gray-300 rounded-md text-base bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  {/* Nút xóa */}
                  <div className="flex justify-end mt-3">
                    <button
                      type="button"
                      className="bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600"
                      onClick={() => handleRemoveDetail(idx)}
                      disabled={details.length === 1}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="mt-2 bg-green-700 text-white border-none py-1.5 px-3.5 rounded-md cursor-pointer text-sm hover:bg-green-800 transition-colors"
              onClick={handleAddDetail}
            >
              + Thêm nguyên vật liệu
            </button>
          </div>

          <div className="flex justify-end mt-6">
            <button
              type="submit"
              disabled={submitting}
              className="bg-green-700 text-white border-none py-2.5 px-8 rounded-lg text-base cursor-pointer hover:bg-green-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {submitting ? "Đang tạo..." : "Lưu mẫu nhiệm vụ"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default TaskTemplateCreate;
