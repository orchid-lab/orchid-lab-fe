import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../../../api/axiosInstance";
import { useSnackbar } from "notistack";

interface TaskTemplate {
  id: string;
  name: string;
  stageID: string;
  stageName: string;
  description: string;
  status: boolean;
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

const TaskTemplateList: React.FC = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stageFilter, setStageFilter] = useState<string>("Tất cả");

  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await axiosInstance.get(
          "/api/tasktemplate?pageNumber=1&pageSize=100"
        );

        if (isApiTaskTemplateResponse(response.data)) {
          const data = Array.isArray(response.data.value?.data)
            ? response.data.value.data
            : [];
          setTemplates(data);
        } else {
          setError("Dữ liệu không đúng định dạng");
        }
      } catch (err) {
        console.error("Error fetching task templates:", err);
        setError("Không thể tải danh sách mẫu nhiệm vụ");
        enqueueSnackbar("Lỗi khi tải dữ liệu", { variant: "error" });
      } finally {
        setLoading(false);
      }
    };

    void fetchTemplates();
  }, [enqueueSnackbar]);

  // Get unique stage names for filter
  const stageNames = useMemo(() => {
    const stages = [
      ...new Set(templates.map((template) => template.stageName)),
    ];
    return stages.sort();
  }, [templates]);

  // Filter and sort templates
  const filteredAndSortedTemplates = useMemo(() => {
    let filteredTemplates = templates;

    // Filter by stage
    if (stageFilter !== "Tất cả") {
      filteredTemplates = templates.filter(
        (template) => template.stageName === stageFilter
      );
    }

    // Group templates by stage and count
    const stageCounts = new Map<string, number>();
    filteredTemplates.forEach((template) => {
      const count = stageCounts.get(template.stageName) ?? 0;
      stageCounts.set(template.stageName, count + 1);
    });

    // Sort by stage count (ascending - fewer templates first) then by stage name
    return filteredTemplates.sort((a, b) => {
      const countA = stageCounts.get(a.stageName) ?? 0;
      const countB = stageCounts.get(b.stageName) ?? 0;

      if (countA !== countB) {
        return countA - countB; // Ascending order (fewer first)
      }

      // If same count, sort by stage name
      return a.stageName.localeCompare(b.stageName);
    });
  }, [templates, stageFilter]);

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded shadow p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-green-800">
            Danh sách mẫu nhiệm vụ
          </h1>
          <button
            className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800"
            onClick={() => {
              void navigate("/task-templates/new");
            }}
          >
            + Tạo mẫu nhiệm vụ
          </button>
        </div>

        {/* Filter section */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700 font-medium">
                Lọc theo giai đoạn:
              </span>
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="Tất cả">Tất cả giai đoạn</option>
                {stageNames.map((stageName) => (
                  <option key={stageName} value={stageName}>
                    {stageName}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => setStageFilter("Tất cả")}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Xóa bộ lọc
            </button>
          </div>

          {/* Active filter indicator */}
          {stageFilter !== "Tất cả" && (
            <div className="mt-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                Giai đoạn: {stageFilter}
              </span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">
              Đang tải danh sách mẫu nhiệm vụ...
            </div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center py-8">{error}</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-green-50 text-green-800 font-semibold">
                <th className="py-3 px-4 text-left">Tên nhiệm vụ mẫu</th>
                <th className="px-4 text-left">Tên giai đoạn</th>
                <th className="px-4 text-left">Mô tả</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedTemplates.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-gray-500">
                    {stageFilter !== "Tất cả"
                      ? "Không có mẫu nhiệm vụ nào cho giai đoạn này"
                      : "Không có mẫu nhiệm vụ nào"}
                  </td>
                </tr>
              ) : (
                filteredAndSortedTemplates.map((template) => (
                  <tr
                    key={template.id}
                    className="border-t hover:bg-green-50 transition cursor-pointer"
                    onClick={() =>
                      void navigate(`/task-templates/${template.id}`)
                    }
                  >
                    <td className="py-3 px-4">{template.name}</td>
                    <td className="px-4">{template.stageName}</td>
                    <td className="px-4 text-gray-600">
                      {template.description}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
};

export default TaskTemplateList;
