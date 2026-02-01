import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../../api/axiosInstance";
import { useSnackbar } from "notistack";
import { useAuth } from "../../../context/AuthContext";
import { Doughnut } from "react-chartjs-2";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";
Chart.register(ArcElement, Tooltip, Legend);

interface Task {
  id: string;
  name: string;
  description?: string;
  stageId?: string;
  researcherId: string;
  researcher: string;
  technicianId: string;
  experimentLogName?: string;
  end_date: string;
  create_at: string;
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
    totalCount?: number;
    pageCount?: number;
    pageSize?: number;
    pageNumber?: number;
    data?: Task[];
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
  DoneInTime: "text-blue-700",
  DoneInLate: "text-orange-700",
  Cancel: "text-red-700",
};

export default function ListTask() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();

  // State cho pagination và data
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // State cho filters
  const [statusFilter, setStatusFilter] = useState<StatusType | "Tất cả">(
    "Tất cả"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [todayFilter, setTodayFilter] = useState(false);

  // State cho summary data (chỉ load 1 lần)
  const [statusCounts, setStatusCounts] = useState<Record<StatusType, number>>({
    Assigned: 0,
    Taken: 0,
    InProcess: 0,
    DoneInTime: 0,
    DoneInLate: 0,
    Cancel: 0,
  });

  // State cho thống kê
  const [stats, setStats] = useState<{
    totalToday: number;
    completed: number;
    inProgress: number;
  }>({
    totalToday: 0,
    completed: 0,
    inProgress: 0,
  });

  const tasksPerPage = 20;

  // Load summary data chỉ 1 lần khi component mount
  // API: GET /api/tasks?PageNumber=1&PageSize=1000
  // Sau đó filter theo technicianId ở frontend vì API không có param technicianId
  useEffect(() => {
    const loadSummaryData = async () => {
      try {
        const params = new URLSearchParams();
        params.append("PageNumber", "1");
        params.append("PageSize", "1000");

        const response = await axiosInstance.get(`/api/tasks?${params.toString()}`);

        if (isApiTaskResponse(response.data)) {
          const allTasks = Array.isArray(response.data.value?.data)
            ? response.data.value.data
            : [];

          // Filter theo technicianId của user hiện tại ở frontend
          const myTasks = allTasks.filter(
            (task) => task.technicianId === user?.id
          );

          // Tính status counts
          const counts: Record<StatusType, number> = {
            Assigned: 0,
            Taken: 0,
            InProcess: 0,
            DoneInTime: 0,
            DoneInLate: 0,
            Cancel: 0,
          };

          myTasks.forEach((task) => {
            counts[task.status] = (counts[task.status] || 0) + 1;
          });

          // Tính thống kê cho task hôm nay
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          // Lọc các task có end_date là hôm nay
          const todayTasks = myTasks.filter((task) => {
            const taskEndDate = new Date(task.end_date);
            taskEndDate.setHours(0, 0, 0, 0);
            return taskEndDate.getTime() === today.getTime();
          });

          const totalToday = todayTasks.length;

          const completed = todayTasks.filter(
            (task) =>
              task.status === "DoneInTime" || task.status === "DoneInLate"
          ).length;

          const inProgress = todayTasks.filter(
            (task) =>
              task.status === "Assigned" ||
              task.status === "Taken" ||
              task.status === "InProcess"
          ).length;

          setStatusCounts(counts);
          setStats({
            totalToday,
            completed,
            inProgress,
          });
        }
      } catch (err) {
        console.error("Error loading summary data:", err);
      }
    };

    void loadSummaryData();
  }, [user?.id]);

  // Build query parameters cho API call chính
  // Swagger params: PageNumber, PageSize, ResearcherId, SearchTerm, StageId
  const buildApiQuery = useMemo(() => {
    const params = new URLSearchParams();

    params.append("PageNumber", "1");
    params.append("PageSize", "1000"); // Load tất cả để sort, filter và paginate ở frontend

    // Chỉ append SearchTerm nếu có giá trị
    if (searchTerm.trim()) {
      params.append("SearchTerm", searchTerm.trim());
    }

    return params.toString();
  }, [searchTerm]);

  // Load tasks với debounce cho search
  useEffect(() => {
    const timeoutId = setTimeout(
      () => {
        setLoading(true);
        setError(null);

        axiosInstance
          .get(`/api/tasks?${buildApiQuery}`)
          .then((res) => {
            if (isApiTaskResponse(res.data)) {
              const data = Array.isArray(res.data.value?.data)
                ? res.data.value.data
                : [];

              // Filter theo technicianId của user hiện tại ở frontend
              let filteredData = data.filter(
                (task) => task.technicianId === user?.id
              );

              // Sort toàn bộ danh sách theo create_at (newest first)
              filteredData = [...filteredData].sort((a, b) => {
                const dateA = new Date(a.create_at);
                const dateB = new Date(b.create_at);
                return dateB.getTime() - dateA.getTime();
              });

              // Filter by status
              if (statusFilter !== "Tất cả") {
                filteredData = filteredData.filter(
                  (task) => task.status === statusFilter
                );
              }

              // Filter by today based on end_date
              if (todayFilter) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                filteredData = filteredData.filter((task) => {
                  const taskEndDate = new Date(task.end_date);
                  taskEndDate.setHours(0, 0, 0, 0);
                  return taskEndDate.getTime() === today.getTime();
                });
              }

              // Filter by search term ở frontend (double-check lại cho chắc)
              if (searchTerm.trim()) {
                filteredData = filteredData.filter(
                  (task) =>
                    task.name
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase()) ||
                    task.researcher
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase())
                );
              }

              // Apply pagination to filtered/sorted data
              const startIndex = (currentPage - 1) * tasksPerPage;
              const endIndex = startIndex + tasksPerPage;
              const paginatedData = filteredData.slice(startIndex, endIndex);

              setTasks(paginatedData);
              setTotalCount(filteredData.length);
            }
          })
          .catch(() => {
            setError("Không thể tải danh sách nhiệm vụ");
            enqueueSnackbar("Lỗi khi tải dữ liệu", { variant: "error" });
          })
          .finally(() => {
            setLoading(false);
          });
      },
      searchTerm ? 300 : 0
    );

    return () => clearTimeout(timeoutId);
  }, [
    buildApiQuery,
    statusFilter,
    searchTerm,
    todayFilter,
    currentPage,
    user?.id,
    enqueueSnackbar,
  ]);

  // Reset về trang 1 khi filter thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm, todayFilter]);

  const totalPages = Math.ceil(totalCount / tasksPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Chart data
  const chartData = {
    labels: ["Đã hoàn thành", "Đang thực hiện", "Task hôm nay"],
    datasets: [
      {
        data: [stats.completed, stats.inProgress, stats.totalToday],
        backgroundColor: [
          "#22c55e",
          "#facc15",
          "#3b82f6",
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    plugins: {
      legend: {
        display: true,
        position: "bottom" as const,
      },
      tooltip: {
        callbacks: {
          label: function (
            context: import("chart.js").TooltipItem<"doughnut">
          ) {
            const total = context.dataset.data.reduce(
              (a: number, b: number) => a + b,
              0
            );
            const value = context.parsed;
            const percent = ((value / total) * 100).toFixed(1);
            return `${context.label}: ${value} (${percent}%)`;
          },
        },
      },
    },
  };

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-50 p-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-2 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Danh sách nhiệm vụ của tôi
            </h1>
            <p className="text-gray-600 mt-1">
              Theo dõi và quản lý các nhiệm vụ được giao
            </p>
            <p className="text-sm text-blue-600 mt-1">
              📅 Sắp xếp theo thời gian tạo mới nhất
            </p>
          </div>
        </div>

        {/* Thống kê */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          {/* Chart trạng thái */}
          <div className="flex justify-center">
            <div className="bg-white rounded-lg shadow p-4 w-full md:w-[340px]">
              <h3 className="text-center text-blue-700 font-semibold mb-2 text-sm">
                Biểu đồ thống kê nhiệm vụ ngày hôm nay
              </h3>
              <Doughnut data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* Số liệu thống kê */}
          <div className="flex flex-wrap justify-center md:justify-start gap-4">
            <div className="bg-blue-50 p-4 rounded-lg w-40">
              <div className="text-blue-600 text-sm font-medium">
                NHIỆM VỤ HÔM NAY
              </div>
              <div className="text-2xl font-bold text-blue-700">
                {stats.totalToday}
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg w-40">
              <div className="text-blue-600 text-sm font-medium">
                NHIỆM VỤ CHƯA HOÀN THÀNH
              </div>
              <div className="text-2xl font-bold text-blue-700">
                {stats.inProgress}
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg w-40">
              <div className="text-blue-600 text-sm font-medium">
                NHIỆM VỤ ĐÃ HOÀN THÀNH
              </div>
              <div className="text-2xl font-bold text-blue-700">
                {stats.completed}
              </div>
            </div>
          </div>
        </div>

        {/* 6 ô tổng hợp */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
          {Object.entries(STATUS_SUMMARY_LABELS).map(([key, label]) => (
            <div
              key={key}
              className="rounded-lg border border-gray-200 bg-white px-6 py-4 flex flex-col justify-between min-w-[150px] items-center"
            >
              <span className="text-sm text-gray-600 mb-1">{label}</span>
              <span
                className={`text-2xl font-semibold ${
                  STATUS_COLORS[key as StatusType]
                } bg-white`}
              >
                {statusCounts[key as StatusType]}
              </span>
            </div>
          ))}
        </div>

        {/* Bộ lọc */}
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
                className="border border-gray-300 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
              <button
                type="button"
                onClick={() => setTodayFilter(!todayFilter)}
                className={`px-3 py-2 text-sm rounded-full border ${
                  todayFilter
                    ? "bg-blue-100 border-blue-500 text-blue-700"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                Nhiệm vụ hôm nay
              </button>
            </div>
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Tìm kiếm nhiệm vụ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setStatusFilter("Tất cả");
                setSearchTerm("");
                setTodayFilter(false);
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
            >
              Xóa bộ lọc
            </button>
          </div>

          {/* Hiển thị active filters */}
          {(statusFilter !== "Tất cả" || searchTerm.trim() || todayFilter) && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-500">
                Bộ lọc đang áp dụng:
              </span>
              {statusFilter !== "Tất cả" && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                  Trạng thái: {STATUS_LABELS[statusFilter]}
                </span>
              )}
              {todayFilter && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                  Task hôm nay
                </span>
              )}
              {searchTerm.trim() && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                  Tìm kiếm: "{searchTerm}"
                </span>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Đang tải danh sách nhiệm vụ...</div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center py-8">{error}</div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
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
                      <td colSpan={5} className="p-8 text-center text-gray-500">
                        Không tìm thấy nhiệm vụ nào
                      </td>
                    </tr>
                  ) : (
                    tasks.map((task) => (
                      <tr
                        key={task.id}
                        className="border-b hover:bg-blue-50 cursor-pointer transition"
                        onClick={() => {
                          void navigate(`/technician/tasks/${task.id}`);
                        }}
                      >
                        <td className="p-4 text-gray-900">{task.name}</td>
                        <td className="p-4 text-gray-600">{task.researcher}</td>
                        <td className="p-4 text-gray-600">
                          {task.experimentLogName ?? "Không có"}
                        </td>
                        <td className="p-4 text-gray-600">
                          {task.end_date
                            ? new Date(task.end_date).toLocaleDateString()
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
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center text-sm text-gray-600 mt-4">
                <span>
                  Hiển thị {tasks.length} nhiệm vụ trên tổng số {totalCount}{" "}
                  nhiệm vụ
                </span>
                <div className="flex gap-2">
                  {/* Previous button */}
                  {currentPage > 1 && (
                    <button
                      type="button"
                      onClick={() => paginate(currentPage - 1)}
                      className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300"
                    >
                      ←
                    </button>
                  )}

                  {/* Page numbers */}
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
                        key={pageNum}
                        type="button"
                        onClick={() => paginate(pageNum)}
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

                  {/* Next button */}
                  {currentPage < totalPages && (
                    <button
                      type="button"
                      onClick={() => paginate(currentPage + 1)}
                      className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300"
                    >
                      →
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}