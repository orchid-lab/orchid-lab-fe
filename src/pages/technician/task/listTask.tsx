import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../../api/axiosInstance";
import { useSnackbar } from "notistack";
import { useAuth } from "../../../context/AuthContext";
import { Doughnut } from "react-chartjs-2";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";
import {
  Calendar,
  Clock,
  CheckCircle2,
  UserPlus,
  Inbox,
  Loader,
  CheckCheck,
  AlertCircle,
  XCircle,
  Search,
  Filter,
} from "lucide-react";

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
  Assigned: "Assigned",
  Taken: "Received",
  InProcess: "In Progress",
  DoneInTime: "Completed On Time",
  DoneInLate: "Completed Late",
  Cancel: "Cancelled",
};

const STATUS_COLORS: Record<StatusType, string> = {
  Assigned: "bg-purple-100 text-purple-700 border-purple-200",
  Taken: "bg-blue-100 text-blue-700 border-blue-200",
  InProcess: "bg-yellow-100 text-yellow-700 border-yellow-200",
  DoneInTime: "bg-green-100 text-green-700 border-green-200",
  DoneInLate: "bg-orange-100 text-orange-700 border-orange-200",
  Cancel: "bg-red-100 text-red-700 border-red-200",
};

const STATUS_ICON_COLORS: Record<StatusType, string> = {
  Assigned: "text-purple-500",
  Taken: "text-blue-500",
  InProcess: "text-yellow-500",
  DoneInTime: "text-green-500",
  DoneInLate: "text-orange-500",
  Cancel: "text-red-500",
};

export default function ListTask() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [statusFilter, setStatusFilter] = useState<StatusType | "All">("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [todayFilter, setTodayFilter] = useState(false);

  const [statusCounts, setStatusCounts] = useState<Record<StatusType, number>>({
    Assigned: 0,
    Taken: 0,
    InProcess: 0,
    DoneInTime: 0,
    DoneInLate: 0,
    Cancel: 0,
  });

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

          const myTasks = allTasks.filter((task) => task.technicianId === user?.id);

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

          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const todayTasks = myTasks.filter((task) => {
            const taskEndDate = new Date(task.end_date);
            taskEndDate.setHours(0, 0, 0, 0);
            return taskEndDate.getTime() === today.getTime();
          });

          const totalToday = todayTasks.length;
          const completed = todayTasks.filter(
            (task) => task.status === "DoneInTime" || task.status === "DoneInLate"
          ).length;
          const inProgress = todayTasks.filter(
            (task) =>
              task.status === "Assigned" ||
              task.status === "Taken" ||
              task.status === "InProcess"
          ).length;

          setStatusCounts(counts);
          setStats({ totalToday, completed, inProgress });
        }
      } catch (err) {
        console.error("Error loading summary data:", err);
      }
    };

    void loadSummaryData();
  }, [user?.id]);

  const buildApiQuery = useMemo(() => {
    const params = new URLSearchParams();
    params.append("PageNumber", "1");
    params.append("PageSize", "1000");

    if (searchTerm.trim()) {
      params.append("SearchTerm", searchTerm.trim());
    }

    return params.toString();
  }, [searchTerm]);

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

              let filteredData = data.filter((task) => task.technicianId === user?.id);

              filteredData = [...filteredData].sort((a, b) => {
                const dateA = new Date(a.create_at);
                const dateB = new Date(b.create_at);
                return dateB.getTime() - dateA.getTime();
              });

              if (statusFilter !== "All") {
                filteredData = filteredData.filter((task) => task.status === statusFilter);
              }

              if (todayFilter) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                filteredData = filteredData.filter((task) => {
                  const taskEndDate = new Date(task.end_date);
                  taskEndDate.setHours(0, 0, 0, 0);
                  return taskEndDate.getTime() === today.getTime();
                });
              }

              if (searchTerm.trim()) {
                filteredData = filteredData.filter(
                  (task) =>
                    task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    task.researcher.toLowerCase().includes(searchTerm.toLowerCase())
                );
              }

              const startIndex = (currentPage - 1) * tasksPerPage;
              const endIndex = startIndex + tasksPerPage;
              const paginatedData = filteredData.slice(startIndex, endIndex);

              setTasks(paginatedData);
              setTotalCount(filteredData.length);
            }
          })
          .catch(() => {
            setError("Unable to load task list");
            enqueueSnackbar("Error loading data", { variant: "error" });
          })
          .finally(() => {
            setLoading(false);
          });
      },
      searchTerm ? 300 : 0
    );

    return () => clearTimeout(timeoutId);
  }, [buildApiQuery, statusFilter, searchTerm, todayFilter, currentPage, user?.id, enqueueSnackbar]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm, todayFilter]);

  const totalPages = Math.ceil(totalCount / tasksPerPage);

  const chartData = {
    labels: ["Completed", "In Progress", "Pending"],
    datasets: [
      {
        data: [stats.completed, stats.inProgress, stats.totalToday - stats.completed - stats.inProgress],
        backgroundColor: ["#ec4899", "#22c55e", "#93c5fd"],
        borderWidth: 0,
        spacing: 2,
      },
    ],
  };

  const chartOptions = {
    plugins: {
      legend: {
        display: true,
        position: "right" as const,
        labels: {
          usePointStyle: true,
          pointStyle: "circle",
          padding: 15,
          font: {
            size: 13,
            family: "'Inter', sans-serif",
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: import("chart.js").TooltipItem<"doughnut">) {
            const value = context.parsed;
            return `${context.label} (${value})`;
          },
        },
      },
    },
    cutout: "70%",
  };

  const getStatusIcon = (status: StatusType) => {
    const iconClass = `w-5 h-5 ${STATUS_ICON_COLORS[status]}`;
    switch (status) {
      case "Assigned":
        return <UserPlus className={iconClass} />;
      case "Taken":
        return <Inbox className={iconClass} />;
      case "InProcess":
        return <Loader className={iconClass} />;
      case "DoneInTime":
        return <CheckCheck className={iconClass} />;
      case "DoneInLate":
        return <AlertCircle className={iconClass} />;
      case "Cancel":
        return <XCircle className={iconClass} />;
    }
  };

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-8">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Orchid Lab Task Management
          </h1>
          <p className="text-gray-600 text-lg">
            Monitor and manage cultivation tasks efficiently.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Doughnut Chart */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Today's Task Distribution
            </h3>
            <div className="flex items-center justify-center h-[280px]">
              <div className="relative w-[280px]">
                <Doughnut data={chartData} options={chartOptions} />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="text-4xl font-bold text-gray-900">
                    {stats.totalToday}
                  </div>
                  <div className="text-sm text-gray-500">Tasks</div>
                </div>
              </div>
            </div>
          </div>

          {/* Today's Status Cards */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Today's Status</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-100 rounded-xl p-5 border border-blue-200">
                <Calendar className="w-8 h-8 text-blue-600 mb-3" />
                <div className="text-sm text-blue-700 font-medium mb-1">
                  Tasks Today:
                </div>
                <div className="text-3xl font-bold text-blue-900">
                  {stats.totalToday}
                </div>
              </div>
              <div className="bg-blue-100 rounded-xl p-5 border border-blue-200">
                <Clock className="w-8 h-8 text-blue-600 mb-3" />
                <div className="text-sm text-blue-700 font-medium mb-1">
                  Incomplete:
                </div>
                <div className="text-3xl font-bold text-blue-900">
                  {stats.inProgress}
                </div>
              </div>
              <div className="bg-blue-100 rounded-xl p-5 border border-blue-200">
                <CheckCircle2 className="w-8 h-8 text-blue-600 mb-3" />
                <div className="text-sm text-blue-700 font-medium mb-1">
                  Completed:
                </div>
                <div className="text-3xl font-bold text-blue-900">
                  {stats.completed}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-xl p-5 border border-purple-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <UserPlus className="w-5 h-5 text-purple-500" />
              <span className="text-sm text-gray-600 font-medium">Assigned:</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {statusCounts.Assigned}
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-blue-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Inbox className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-gray-600 font-medium">Received:</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {statusCounts.Taken}
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-yellow-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Loader className="w-5 h-5 text-yellow-500" />
              <span className="text-sm text-gray-600 font-medium">In Progress:</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {statusCounts.InProcess}
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-green-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <CheckCheck className="w-5 h-5 text-green-500" />
              <span className="text-sm text-gray-600 font-medium">Completed On Time:</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {statusCounts.DoneInTime}
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-orange-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              <span className="text-sm text-gray-600 font-medium">Completed Late:</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {statusCounts.DoneInLate}
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-red-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <span className="text-sm text-gray-600 font-medium">Cancelled:</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {statusCounts.Cancel}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusType | "All")}
                className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="All">Status</option>
                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <select className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white">
              <option>Date Range</option>
            </select>

            <select className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white">
              <option>Task Type</option>
            </select>

            <div className="flex-1 min-w-[300px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setStatusFilter("All");
                setSearchTerm("");
                setTodayFilter(false);
              }}
              className="px-4 py-2.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors font-medium"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Tasks Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Loading tasks...</div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center py-12">{error}</div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 font-semibold text-gray-900 text-sm">
                    Task Name
                  </th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-900 text-sm">
                    Created By
                  </th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-900 text-sm">
                    Notes
                  </th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-900 text-sm">
                    Deadline
                  </th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-900 text-sm">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-gray-500">
                      No tasks found
                    </td>
                  </tr>
                ) : (
                  tasks.map((task) => (
                    <tr
                      key={task.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => {
                        void navigate(`/technician/tasks/${task.id}`);
                      }}
                    >
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {task.name}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{task.researcher}</td>
                      <td className="px-6 py-4 text-gray-600 max-w-xs truncate">
                        {task.description ?? task.experimentLogName ?? "No notes"}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {task.end_date
                          ? new Date(task.end_date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : ""}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
                            STATUS_COLORS[task.status]
                          }`}
                        >
                          {getStatusIcon(task.status)}
                          {STATUS_LABELS[task.status]}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Showing {tasks.length} of {totalCount} tasks
                </span>
                <div className="flex gap-2">
                  {currentPage > 1 && (
                    <button
                      type="button"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      className="px-3 py-1.5 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-sm"
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
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1.5 rounded-lg text-sm ${
                          currentPage === pageNum
                            ? "bg-blue-600 text-white"
                            : "bg-white border border-gray-300 hover:bg-gray-50"
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
                      className="px-3 py-1.5 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-sm"
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