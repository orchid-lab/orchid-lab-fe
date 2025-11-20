import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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

interface ApiTaskTemplateResponse {
  value?: TaskTemplate;
}

const TaskTemplateDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [template, setTemplate] = useState<TaskTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) {
      setError(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    axiosInstance
      .get(`/api/tasktemplate/${id}`)
      .then((res: { data: ApiTaskTemplateResponse }) => {
        if (res.data?.value) {
          setTemplate(res.data.value);
        } else {
          setError(true);
        }
      })
      .catch(() => {
        setError(true);
        enqueueSnackbar("Không thể tải chi tiết mẫu nhiệm vụ!", {
          variant: "error",
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id, enqueueSnackbar]);

  if (loading) {
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

  if (error || !template) {
    return (
      <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 flex flex-col items-center py-10">
        <div className="bg-white rounded-xl px-8 pt-8 pb-6 shadow-md max-w-2xl w-full text-center">
          <h2 className="text-2xl font-bold mb-6 text-red-700">
            Không tìm thấy mẫu nhiệm vụ
          </h2>
          <button
            type="button"
            className="mt-4 bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800"
            onClick={() => {
              void navigate("/task-templates");
            }}
          >
            Quay lại danh sách
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
            Chi tiết mẫu nhiệm vụ: {template.name}
          </h2>
          <div className="flex gap-3">
            <button
              type="button"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Chỉnh sửa
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Xóa mẫu
            </button>
          </div>
        </div>

        {/* Status */}
        <div className="flex flex-col mb-6">
          <label className="font-medium mb-1.5">Trạng thái</label>
          <span
            className={`px-3 py-2 rounded-md text-sm font-medium w-fit ${
              template.status
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {template.status ? "Hoạt động" : "Không hoạt động"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="flex flex-col">
            <label className="font-medium mb-1.5">Tên nhiệm vụ mẫu</label>
            <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
              {template.name}
            </div>
          </div>
          <div className="flex flex-col">
            <label className="font-medium mb-1.5">Tên giai đoạn</label>
            <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
              {template.stageName}
            </div>
          </div>
        </div>

        <div className="flex flex-col mb-6">
          <label className="font-medium mb-1.5">Mô tả</label>
          <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 min-h-[80px]">
            {template.description}
          </div>
        </div>

        {/* Nguyên vật liệu */}
        <div className="flex flex-col mb-8">
          <label className="font-medium mb-1.5">Nguyên vật liệu</label>
          {template.details && template.details.length > 0 ? (
            <div className="space-y-2">
              {/* Header - sắp xếp giống CreateTaskContainer */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-2 font-medium text-sm text-gray-700">
                <span>Tên vật tư</span>
                <span>Đơn vị</span>
                <span>Số lượng</span>
                <span>Mô tả</span>
                <span>Bắt buộc</span>
              </div>
              {/* Data rows */}
              {template.details.map((detail, idx) => (
                <div
                  className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-2"
                  key={detail.id || idx}
                >
                  <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                    {detail.name || detail.element}
                  </div>
                  <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                    {detail.unit}
                  </div>
                  <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                    {detail.expectedValue}
                  </div>
                  <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                    {detail.description || "N/A"}
                  </div>
                  <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        detail.isRequired
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {detail.isRequired ? "Có" : "Không"}
                    </span>
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

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            className="min-w-[90px] px-5 py-2 rounded-lg border-none text-base font-semibold cursor-pointer transition-colors duration-200 bg-gray-300 text-gray-800 hover:bg-gray-400"
            onClick={() => {
              void navigate("/task-templates");
            }}
          >
            Quay lại
          </button>
        </div>
      </div>
    </main>
  );
};

export default TaskTemplateDetail;
