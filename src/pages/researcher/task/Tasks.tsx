import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../../api/axiosInstance";
import { useSnackbar } from "notistack";
import { useTranslation } from 'react-i18next';

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

function getStatusLabel(status: StatusType, t: (key: string) => string): string {
  const labels: Record<StatusType, string> = {
    Assigned: t('status.assigned'),
    Taken: t('status.taken'),
    InProcess: t('status.inProcess'),
    DoneInTime: t('status.doneInTime'),
    DoneInLate: t('status.doneInLate'),
    Cancel: t('status.cancel'),
  };
  return labels[status] || status;
}

const STATUS_COLORS: Record<StatusType, string> = {
  Assigned: "text-blue-700",
  Taken: "text-purple-700",
  InProcess: "text-yellow-700",
  DoneInTime: "text-green-700",
  DoneInLate: "text-orange-700",
  Cancel: "text-red-700",
};

export default function Tasks() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation();

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
  const [researcherFilter, setResearcherFilter] = useState<string>("Tất cả");
  const [searchTerm, setSearchTerm] = useState("");

  // State cho summary data (chỉ load 1 lần)
  const [statusCounts, setStatusCounts] = useState<Record<StatusType, number>>({
    Assigned: 0,
    Taken: 0,
    InProcess: 0,
    DoneInTime: 0,
    DoneInLate: 0,
    Cancel: 0,
  });
  const [allResearchers, setAllResearchers] = useState<string[]>([]);

  const tasksPerPage = 20; // Tăng pageSize để giảm số lần gọi API

  // Load summary data chỉ 1 lần khi component mount
  useEffect(() => {
    const loadSummaryData = async () => {
      try {
        // Lấy tất cả tasks để tính summary (có thể cache ở đây)
        const response = await axiosInstance.get(
          `/api/tasks?pageNo=1&pageSize=1000`
        );

        if (isApiTaskResponse(response.data)) {
          const allTasks = Array.isArray(response.data.value?.data)
            ? response.data.value.data
            : [];

          // Sort all tasks by create_at (newest first) for summary
          allTasks.sort((a, b) => {
            const dateA = new Date(a.create_at ?? a.end_date ?? new Date(0));
            const dateB = new Date(b.create_at ?? b.end_date ?? new Date(0));
            return dateB.getTime() - dateA.getTime();
          });

          // Tính status counts
          const counts: Record<StatusType, number> = {
            Assigned: 0,
            Taken: 0,
            InProcess: 0,
            DoneInTime: 0,
            DoneInLate: 0,
            Cancel: 0,
          };

          // Lấy unique researchers
          const researcherSet = new Set<string>();

          allTasks.forEach((task) => {
            counts[task.status] = (counts[task.status] || 0) + 1;
            researcherSet.add(task.researcher);
          });

          setStatusCounts(counts);
          setAllResearchers(Array.from(researcherSet));
        }
      } catch (err) {
        console.error("Error loading summary data:", err);
      }
    };

    void loadSummaryData();
  }, []);

  // Build query parameters cho API call chính
  const buildApiQuery = useMemo(() => {
    const params = new URLSearchParams();

    // Luôn load tất cả tasks để sort và filter ở frontend
    params.append("pageNo", "1");
    params.append("pageSize", "1000"); // Load tất cả để sort và filter
    console.log("Loading all tasks for frontend sorting and filtering");

    // Backend không hỗ trợ status filter, chỉ có thể filter ở frontend
    if (researcherFilter !== "Tất cả") {
      params.append("researcher", researcherFilter);
    }
    if (searchTerm.trim()) {
      params.append("search", searchTerm.trim());
    }

    const queryString = params.toString();
    console.log("Built query parameters:", {
      pageNo: currentPage,
      pageSize: tasksPerPage,
      statusFilter,
      researcherFilter,
      searchTerm,
      finalQuery: queryString,
    });

    return queryString;
  }, [currentPage, statusFilter, researcherFilter, searchTerm]);

  // Load tasks với debounce cho search
  useEffect(() => {
    const timeoutId = setTimeout(
      () => {
        setLoading(true);
        setError(null);

        console.log("API Query:", buildApiQuery); // Debug log
        console.log("Current filters:", {
          statusFilter,
          researcherFilter,
          searchTerm,
          currentPage,
        });

        axiosInstance
          .get(`/api/tasks?${buildApiQuery}`)
          .then((res) => {
            console.log("API Response:", res.data); // Debug log
            if (isApiTaskResponse(res.data)) {
              const data = Array.isArray(res.data.value?.data)
                ? res.data.value.data
                : [];
              // const total =
              //   typeof res.data.value?.totalCount === "number"
              //     ? res.data.value.totalCount
              //     : 0;

              // Sort toàn bộ danh sách theo create_at (newest first)
              const sortedData = [...data].sort((a, b) => {
                const dateA = new Date(
                  a.create_at ?? a.end_date ?? new Date(0)
                );
                const dateB = new Date(
                  b.create_at ?? b.end_date ?? new Date(0)
                );
                return dateB.getTime() - dateA.getTime(); // Descending order (newest first)
              });

              console.log(
                "Sorted all tasks by create_at (newest first):",
                sortedData.slice(0, 3).map((task) => ({
                  name: task.name,
                  create_at: task.create_at,
                  end_date: task.end_date,
                }))
              );

              // Filter trên data đã sort
              let filteredData = sortedData;

              // Filter by status
              if (statusFilter !== "Tất cả") {
                const beforeFilter = filteredData.length;
                filteredData = filteredData.filter(
                  (task) => task.status === statusFilter
                );
                console.log(
                  `Filtered by status ${statusFilter}: ${beforeFilter} -> ${filteredData.length} tasks`
                );
                console.log("Available statuses in data:", [
                  ...new Set(data.map((task) => task.status)),
                ]);
              }

              // Filter by researcher
              if (researcherFilter !== "Tất cả") {
                filteredData = filteredData.filter(
                  (task) => task.researcher === researcherFilter
                );
                console.log(
                  `Filtered by researcher ${researcherFilter}: ${filteredData.length} tasks`
                );
              }

              // Filter by search term
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
                console.log(
                  `Filtered by search "${searchTerm}": ${filteredData.length} tasks`
                );
              }

              // Apply pagination to filtered/sorted data
              const startIndex = (currentPage - 1) * tasksPerPage;
              const endIndex = startIndex + tasksPerPage;
              const paginatedData = filteredData.slice(startIndex, endIndex);

              setTasks(paginatedData);
              setTotalCount(filteredData.length); // Total filtered count
            }
          })
          .catch((error) => {
            console.error("API Error:", error); // Debug log
            setError("Không thể tải danh sách nhiệm vụ");
            enqueueSnackbar("Lỗi khi tải dữ liệu", { variant: "error" });
          })
          .finally(() => {
            setLoading(false);
          });
      },
      searchTerm ? 300 : 0
    ); // Debounce 300ms cho search, ngay lập tức cho các filter khác

    return () => clearTimeout(timeoutId);
  }, [
    buildApiQuery,
    statusFilter,
    researcherFilter,
    searchTerm,
    currentPage,
    enqueueSnackbar,
  ]);

  // Reset về trang 1 khi filter thay đổi (chỉ khi có filter)
  useEffect(() => {
    console.log("Filter changed:", {
      statusFilter,
      researcherFilter,
      searchTerm,
    });
    if (
      statusFilter !== "Tất cả" ||
      researcherFilter !== "Tất cả" ||
      searchTerm.trim()
    ) {
      setCurrentPage(1);
    }
  }, [statusFilter, researcherFilter, searchTerm]);

  const totalPages = Math.ceil(totalCount / tasksPerPage);

  // Debug logs cho pagination
  console.log("Pagination debug:", {
    totalCount,
    tasksPerPage,
    totalPages,
    currentPage,
    tasksLength: tasks.length,
  });

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-50 p-8">
      <div className="space-y-6">
        {/* Header + nút tạo task */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-2 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Quản lý nghiên cứu lai tạo
            </h1>
            <p className="text-gray-600 mt-1">
              Theo dõi và quản lý các nhiệm vụ nghiên cứu lai tạo và kết quả thí
              nghiệm
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                void navigate("/task-templates");
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              Mẫu nhiệm vụ
            </button>
            <button
              type="button"
              onClick={() => {
                void navigate("/create-task/step-1");
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              + Tạo nhiệm vụ nghiên cứu
            </button>
          </div>
        </div>

        {/* 6 ô tổng hợp */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
          {Object.entries({
            Assigned: t('status.taskAssigned'),
            Taken: t('status.taskTaken'),
            InProcess: t('status.taskInProcess'),
            DoneInTime: t('status.taskDoneInTime'),
            DoneInLate: t('status.taskDoneInLate'),
            Cancel: t('status.taskCancelled'),
          }).map(([key, label]) => (
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

        {/* {t('common.filter')} */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex flex-wrap items-center gap-4 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700 font-medium">
                {t('common.status')}:
              </span>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as StatusType | "Tất cả")
                }
                className="border border-gray-300 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="Tất cả">{t('common.all')}</option>
                {Object.entries({
                  Assigned: t('status.assigned'),
                  Taken: t('status.taken'),
                  InProcess: t('status.inProcess'),
                  DoneInTime: t('status.doneInTime'),
                  DoneInLate: t('status.doneInLate'),
                  Cancel: t('status.cancel'),
                }).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700 font-medium">
                {t('task.researcher')}:
              </span>
              <select
                value={researcherFilter}
                onChange={(e) => setResearcherFilter(e.target.value)}
                className="border border-gray-300 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="Tất cả">{t('common.all')}</option>
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
                className="w-full border border-gray-300 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setStatusFilter("Tất cả");
                setResearcherFilter("Tất cả");
                setSearchTerm("");
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
            >
              {t('common.clear')} {t('common.filter').toLowerCase()}
            </button>
          </div>

          {/* Hiển thị active filters */}
          {(statusFilter !== "Tất cả" ||
            researcherFilter !== "Tất cả" ||
            searchTerm.trim()) && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-500">
                {t('common.filter')} {t('common.selected').toLowerCase()}:
              </span>
              {statusFilter !== "Tất cả" && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                  {t('common.status')}: {getStatusLabel(statusFilter, t)}
                </span>
              )}
              {researcherFilter !== "Tất cả" && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                  {t('task.researcher')}: {researcherFilter}
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
            <div className="flex items-center gap-2 text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
              Đang tải {t('task.taskList').toLowerCase()}...
            </div>
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
                      {t('task.taskName')}
                    </th>
                    <th className="text-left p-4 font-medium text-gray-900">
                      {t('task.taskCreator')}
                    </th>
                    <th className="text-left p-4 font-medium text-gray-900">
                      {t('task.experimentLog')}
                    </th>
                    <th className="text-left p-4 font-medium text-gray-900">
                      {t('task.deadline')}
                    </th>
                    <th className="text-left p-4 font-medium text-gray-900">
                      {t('common.status')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-gray-500">
                        {searchTerm.trim() ||
                        statusFilter !== "Tất cả" ||
                        researcherFilter !== "Tất cả"
                          ? "Không tìm thấy nhiệm vụ nào phù hợp với bộ lọc hiện tại"
                          : "Không có nhiệm vụ nào"}
                      </td>
                    </tr>
                  ) : (
                    tasks.map((task) => (
                      <tr
                        key={task.id}
                        className="border-b hover:bg-green-50 cursor-pointer transition"
                        onClick={() => {
                          void navigate(`/tasks/${task.id}`);
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
                            {getStatusLabel(task.status, t)}
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
