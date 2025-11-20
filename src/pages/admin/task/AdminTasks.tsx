import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../../api/axiosInstance";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
);

interface Task {
  id: string;
  name: string;
  researcher: string;
  experimentLogName?: string;
  end_date: string;
  create_at?: string;
  status: StatusType;
}

type StatusType =
  | "Assigned"
  | "Taken"
  | "InProcess"
  | "DoneInTime"
  | "DoneInLate"
  | "Cancel";

interface ApiTaskResponse {
  value?: {
    data?: Task[];
    totalCount?: number;
  };
}

function isApiTaskResponse(obj: unknown): obj is ApiTaskResponse {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "value" in obj &&
    typeof (obj as { value: unknown }).value === "object"
  );
}

const STATUS_LABELS: Record<StatusType, string> = {
  Assigned: "Đã giao",
  Taken: "Đã nhận",
  InProcess: "Đang thực hiện",
  DoneInTime: "Hoàn thành đúng hạn",
  DoneInLate: "Hoàn thành trễ hạn",
  Cancel: "Bị hủy",
};

const STATUS_SUMMARY_LABELS: Record<StatusType, string> = {
  Assigned: "Nhiệm vụ đã giao",
  Taken: "Nhiệm vụ đã nhận",
  InProcess: "Nhiệm vụ đang thực hiện",
  DoneInTime: "Nhiệm vụ hoàn thành đúng hạn",
  DoneInLate: "Nhiệm vụ hoàn thành trễ hạn",
  Cancel: "Nhiệm vụ bị hủy",
};

const STATUS_COLORS: Record<StatusType, string> = {
  Assigned: "text-blue-700",
  Taken: "text-purple-700",
  InProcess: "text-yellow-700",
  DoneInTime: "text-green-700",
  DoneInLate: "text-orange-700",
  Cancel: "text-red-700",
};

export default function AdminTasks() {
  const navigate = useNavigate();

  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [statusFilter, setStatusFilter] = useState<StatusType | "Tất cả">(
    "Tất cả"
  );
  const [researcherFilter, setResearcherFilter] = useState<string>("Tất cả");
  const [searchTerm, setSearchTerm] = useState("");

  const [statusCounts, setStatusCounts] = useState<Record<StatusType, number>>({
    Assigned: 0,
    Taken: 0,
    InProcess: 0,
    DoneInTime: 0,
    DoneInLate: 0,
    Cancel: 0,
  });
  const [allResearchers, setAllResearchers] = useState<string[]>([]);

  const [timeMode, setTimeMode] = useState<"day" | "week" | "month">("day");

  // Chart 2 filter cụ thể
  const [filterMode, setFilterMode] = useState<"day" | "week" | "month">("day");
  const [filterDate, setFilterDate] = useState<string>("");

  const tasksPerPage = 20;

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await axiosInstance.get(
          `/api/tasks?pageNo=1&pageSize=1000`
        );
        if (isApiTaskResponse(response.data)) {
          const all = Array.isArray(response.data.value?.data)
            ? response.data.value.data
            : [];
          setAllTasks(all);
          const counts: Record<StatusType, number> = {
            Assigned: 0,
            Taken: 0,
            InProcess: 0,
            DoneInTime: 0,
            DoneInLate: 0,
            Cancel: 0,
          };
          const researcherSet = new Set<string>();
          all.forEach((task) => {
            counts[task.status] = (counts[task.status] || 0) + 1;
            researcherSet.add(task.researcher);
          });
          setStatusCounts(counts);
          setAllResearchers(Array.from(researcherSet));
        }
      } catch (err) {
        console.error("Error loading data:", err);
      }
    };
    void loadData();
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    let filteredData = [...allTasks];
    if (statusFilter !== "Tất cả") {
      filteredData = filteredData.filter((t) => t.status === statusFilter);
    }
    if (researcherFilter !== "Tất cả") {
      filteredData = filteredData.filter(
        (t) => t.researcher === researcherFilter
      );
    }
    if (searchTerm.trim()) {
      filteredData = filteredData.filter(
        (task) =>
          task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.researcher.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setTotalCount(filteredData.length);
    const startIndex = (currentPage - 1) * tasksPerPage;
    const endIndex = startIndex + tasksPerPage;
    setTasks(filteredData.slice(startIndex, endIndex));
    setLoading(false);
  }, [statusFilter, researcherFilter, searchTerm, currentPage, allTasks]);

  const totalPages = Math.ceil(totalCount / tasksPerPage);

  // Chart 1: tổng hợp toàn bộ task và nhiệm vụ hoàn thành đúng hạn
  const chartStats = useMemo(() => {
    const grouped: Record<string, { total: number; completedOnTime: number }> =
      {};
    allTasks.forEach((task) => {
      if (!task.create_at) return;
      const date = new Date(task.create_at);
      let key = "";
      if (timeMode === "day") {
        key = date.toLocaleDateString("vi-VN");
      } else if (timeMode === "week") {
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay() + 1);
        key = `Tuần ${startOfWeek.toLocaleDateString("vi-VN")}`;
      } else if (timeMode === "month") {
        key = `${date.getMonth() + 1}/${date.getFullYear()}`;
      }

      if (!grouped[key]) {
        grouped[key] = { total: 0, completedOnTime: 0 };
      }

      grouped[key].total += 1;
      if (task.status === "DoneInTime") {
        grouped[key].completedOnTime += 1;
      }
    });
    return Object.entries(grouped).map(([label, values]) => ({
      label,
      ...values,
    }));
  }, [allTasks, timeMode]);

  const chartData = {
    labels: chartStats.map((item) => item.label),
    datasets: [
      {
        label: "Tổng số nhiệm vụ được tạo",
        data: chartStats.map((item) => item.total),
        backgroundColor: "#3b82f6",
      },
      {
        label: "Nhiệm vụ hoàn thành đúng hạn",
        data: chartStats.map((item) => item.completedOnTime),
        backgroundColor: "#22c55e",
      },
    ],
  };

  // Chart 2: theo lựa chọn cụ thể
  const filteredChartStats = useMemo(() => {
    if (!filterDate) return [];
    const grouped: Record<
      string,
      { created: number; completedOnTime: number }
    > = {};

    // Lọc các task theo ngày/tuần/tháng được chọn
    const filteredTasks = allTasks.filter((task) => {
      if (!task.create_at) return false;
      const date = new Date(task.create_at);
      const sel = new Date(filterDate);

      if (filterMode === "day") {
        return date.toDateString() === sel.toDateString();
      } else if (filterMode === "week") {
        const weekStart = new Date(sel);
        weekStart.setDate(sel.getDate() - sel.getDay() + 1);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return date >= weekStart && date <= weekEnd;
      } else if (filterMode === "month") {
        return (
          date.getMonth() === sel.getMonth() &&
          date.getFullYear() === sel.getFullYear()
        );
      }
      return false;
    });

    // Nhóm các task theo ngày/tuần/tháng hiển thị
    filteredTasks.forEach((task) => {
      const date = new Date(task.create_at!);
      let key = "";
      if (filterMode === "day") {
        key = date.toLocaleDateString("vi-VN");
      } else if (filterMode === "week") {
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay() + 1);
        key = `Tuần ${startOfWeek.toLocaleDateString("vi-VN")}`;
      } else if (filterMode === "month") {
        key = `${date.getMonth() + 1}/${date.getFullYear()}`;
      }

      if (!grouped[key]) {
        grouped[key] = { created: 0, completedOnTime: 0 };
      }

      grouped[key].created += 1;
      if (task.status === "DoneInTime") {
        grouped[key].completedOnTime += 1;
      }
    });

    return Object.entries(grouped).map(([label, values]) => ({
      label,
      ...values,
    }));
  }, [allTasks, filterMode, filterDate]);

  const filteredChartData = {
    labels: filteredChartStats.map((item) => item.label),
    datasets: [
      {
        label: "Nhiệm vụ được tạo",
        data: filteredChartStats.map((item) => item.created),
        backgroundColor: "#3b82f6",
      },
      {
        label: "Nhiệm vụ hoàn thành đúng hạn",
        data: filteredChartStats.map((item) => item.completedOnTime),
        backgroundColor: "#22c55e",
      },
    ],
  };

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-50 p-8">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Thống kê tổng nhiệm vụ được tạo và hoàn thành đúng hạn
          </h1>
          <select
            value={timeMode}
            onChange={(e) =>
              setTimeMode(e.target.value as "day" | "week" | "month")
            }
            className="border px-3 py-2 rounded-lg"
          >
            <option value="day">Theo ngày</option>
            <option value="week">Theo tuần</option>
            <option value="month">Theo tháng</option>
          </select>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <Bar data={chartData} />
        </div>

        {/* Chart 2 */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Thống kê nhiệm vụ được tạo và hoàn thành đúng hạn cụ thể
            </h1>
            <select
              value={filterMode}
              onChange={(e) =>
                setFilterMode(e.target.value as "day" | "week" | "month")
              }
              className="border px-3 py-2 rounded-lg"
            >
              <option value="day">Theo ngày</option>
              <option value="week">Theo tuần</option>
              <option value="month">Theo tháng</option>
            </select>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="border px-3 py-2 rounded-lg"
            />
          </div>
          <Bar data={filteredChartData} />
        </div>

        {/* Chart 3: nhiệm vụ hoàn thành đúng hạn */}
        {/* <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Thống kê nhiệm vụ hoàn thành đúng hạn
            </h1>
            <select
              value={completedOnTimeMode}
              onChange={(e) => setCompletedOnTimeMode(e.target.value as any)}
              className="border px-3 py-2 rounded-lg"
            >
              <option value="day">Theo ngày</option>
              <option value="week">Theo tuần</option>
              <option value="month">Theo tháng</option>
            </select>
          </div>
          <Bar data={completedOnTimeChartData} />
        </div> */}

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
          {Object.entries(STATUS_SUMMARY_LABELS).map(([key, label]) => (
            <div
              key={key}
              className="rounded-lg border border-gray-200 bg-white px-6 py-4 flex flex-col items-center"
            >
              <span className="text-sm text-gray-600 mb-1">{label}</span>
              <span
                className={`text-2xl font-semibold ${
                  STATUS_COLORS[key as StatusType]
                }`}
              >
                {statusCounts[key as StatusType]}
              </span>
            </div>
          ))}
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex flex-wrap items-center gap-4 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700 font-medium">
                Trạng thái:
              </span>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as StatusType | "Tất cả")
                }
                className="border border-gray-300 rounded-full px-4 py-2 text-sm"
              >
                <option value="Tất cả">Tất cả</option>
                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700 font-medium">
                Người tạo:
              </span>
              <select
                value={researcherFilter}
                onChange={(e) => setResearcherFilter(e.target.value)}
                className="border border-gray-300 rounded-full px-4 py-2 text-sm"
              >
                <option value="Tất cả">Tất cả</option>
                {allResearchers.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Tìm kiếm nhiệm vụ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-full px-4 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-6 text-gray-500">
            Đang tải dữ liệu...
          </div>
        ) : error ? (
          <div className="text-center py-6 text-red-500">{error}</div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-900">
                    Tên nhiệm vụ
                  </th>
                  <th className="text-left p-4 font-medium text-gray-900">
                    Người tạo nhiệm vụ
                  </th>
                  <th className="text-left p-4 font-medium text-gray-900">
                    Nhật ký thí nghiệm
                  </th>
                  <th className="text-left p-4 font-medium text-gray-900">
                    Thời hạn
                  </th>
                  <th className="text-left p-4 font-medium text-gray-900">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody>
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center p-6 text-gray-500">
                      Không có nhiệm vụ nào
                    </td>
                  </tr>
                ) : (
                  tasks.map((task) => (
                    <tr
                      key={task.id}
                      className="border-b hover:bg-green-50 cursor-pointer"
                      onClick={() => void navigate(`/admin/tasks/${task.id}`)}
                    >
                      <td className="p-4">{task.name}</td>
                      <td className="p-4">{task.researcher}</td>
                      <td className="p-4">
                        {task.experimentLogName ?? "Không có"}
                      </td>
                      <td className="p-4">
                        {task.end_date
                          ? new Date(task.end_date).toLocaleDateString("vi-VN")
                          : ""}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            STATUS_COLORS[task.status]
                          }`}
                        >
                          {STATUS_LABELS[task.status]}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="flex justify-between items-center text-sm text-gray-600 mt-4 p-4">
                <span>
                  Hiển thị {tasks.length} nhiệm vụ trên tổng số {totalCount}{" "}
                  nhiệm vụ
                </span>
                <div className="flex gap-2">
                  {currentPage > 1 && (
                    <button
                      type="button"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300"
                    >
                      ←
                    </button>
                  )}

                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        type="button"
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 rounded-lg ${
                          currentPage === pageNum
                            ? "bg-green-700 text-white"
                            : "bg-gray-200 hover:bg-gray-300"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {currentPage < totalPages && (
                    <button
                      type="button"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300"
                    >
                      →
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
