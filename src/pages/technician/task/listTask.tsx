import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
  stageId?: number;
  taskTargetType?: string;
  targetId?: string;
  researcherId: string;
  technicianId: string;
  status: StatusType;
  expectedEndDate: string;
  createdDate?: string;
  targetName?: string; // Added for display
}

type StatusType =
  | "Assigned"
  | "InProgress"
  | "WaitingForApproval"
  | "CompletedInTime"
  | "CompletedOutTime"
  | "Deleted"
  | "DeclinedByTechnician"
  | "ReworkRequired"
  | "Unknown";

interface ApiTaskResponse {
  totalCount?: number;
  pageCount?: number;
  pageSize?: number;
  pageNumber?: number;
  data?: Task[];
}

function isApiTaskResponse(obj: unknown): obj is ApiTaskResponse {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "data" in obj
  );
}

const STATUS_LABELS: Record<StatusType, string> = {
  Assigned: "Assigned",
  InProgress: "In Progress",
  WaitingForApproval: "Waiting For Approval",
  CompletedInTime: "Completed On Time",
  CompletedOutTime: "Completed Late",
  Deleted: "Deleted",
  DeclinedByTechnician: "Declined",
  ReworkRequired: "Rework Required",
  Unknown: "Unknown",
};

const STATUS_TRANSLATION_KEYS: Record<StatusType, string> = {
  Assigned: "status.assigned",
  InProgress: "status.inProgress",
  WaitingForApproval: "status.waitingForApproval",
  CompletedInTime: "status.completedInTime",
  CompletedOutTime: "status.completedOutTime",
  Deleted: "status.deleted",
  DeclinedByTechnician: "status.declinedByTechnician",
  ReworkRequired: "status.reworkRequired",
  Unknown: "status.unknown",
};

const STATUS_COLORS: Record<StatusType, string> = {
  Assigned: "bg-purple-100 text-purple-700 border-purple-200",
  InProgress: "bg-blue-100 text-blue-700 border-blue-200",
  WaitingForApproval: "bg-indigo-100 text-indigo-700 border-indigo-200",
  CompletedInTime: "bg-green-100 text-green-700 border-green-200",
  CompletedOutTime: "bg-orange-100 text-orange-700 border-orange-200",
  Deleted: "bg-gray-100 text-gray-700 border-gray-200",
  DeclinedByTechnician: "bg-red-100 text-red-700 border-red-200",
  ReworkRequired: "bg-amber-100 text-amber-700 border-amber-200",
  Unknown: "bg-gray-100 text-gray-700 border-gray-200",
};

const STATUS_ICON_COLORS: Record<StatusType, string> = {
  Assigned: "text-purple-500",
  InProgress: "text-blue-500",
  WaitingForApproval: "text-indigo-500",
  CompletedInTime: "text-green-500",
  CompletedOutTime: "text-orange-500",
  Deleted: "text-gray-500",
  DeclinedByTechnician: "text-red-500",
  ReworkRequired: "text-amber-500",
  Unknown: "text-gray-500",
};

const STATUS_FILTER_ORDER: StatusType[] = [
  "Assigned",
  "InProgress",
  "WaitingForApproval",
  "CompletedInTime",
  "CompletedOutTime",
  "Deleted",
  "DeclinedByTechnician",
  "ReworkRequired",
];

const normalizeTaskStatus = (status: string): StatusType => {
  if (status in STATUS_LABELS) {
    return status as StatusType;
  }

  return "Unknown";
};

const createEmptyStatusCounts = (): Record<StatusType, number> => ({
  Assigned: 0,
  InProgress: 0,
  WaitingForApproval: 0,
  CompletedInTime: 0,
  CompletedOutTime: 0,
  Deleted: 0,
  DeclinedByTechnician: 0,
  ReworkRequired: 0,
  Unknown: 0,
});

const formatDateVi = (value?: string): string => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export default function ListTask() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();

  const getStatusLabel = (status: StatusType) =>
    t(STATUS_TRANSLATION_KEYS[status], { defaultValue: STATUS_LABELS[status] });

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [statusFilter, setStatusFilter] = useState<StatusType | "All">("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [todayFilter, setTodayFilter] = useState(false);

  const [statusCounts, setStatusCounts] = useState<Record<StatusType, number>>(
    createEmptyStatusCounts()
  );

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

  // Helper function to fetch target name
  const fetchTargetName = async (
    targetType: string | undefined,
    targetId: string | undefined
  ): Promise<string> => {
    if (!targetId || !targetType) return "-";

    try {
      let endpoint = "";
      if (targetType === "ExperimentLog") {
        endpoint = `/api/experiment-logs/${targetId}`;
      } else if (targetType === "Sample") {
        endpoint = `/api/sample/${targetId}`;
      }

      if (endpoint) {
        const response = await axiosInstance.get(endpoint);
        const data = response.data?.value ?? response.data;
        return data?.name || "Không xác định";
      }
    } catch (error) {
      console.error("Error fetching target:", error);
    }
    return "Không xác định";
  };

  useEffect(() => {
    const loadSummaryData = async () => {
      try {
        const params = new URLSearchParams();
        params.append("PageNumber", "1");
        params.append("PageSize", "1000");

        const response = await axiosInstance.get(`/api/tasks?${params.toString()}`);

        if (isApiTaskResponse(response.data)) {
          const allTasks = Array.isArray(response.data.data)
            ? response.data.data
                .filter((task) => String(task.status ?? "") !== "Template")
                .map((task) => ({
                ...task,
                status: normalizeTaskStatus(String(task.status ?? "")),
              }))
            : [];

          const myTasks = allTasks.filter((task) => task.technicianId === user?.id);

          const counts: Record<StatusType, number> = createEmptyStatusCounts();

          myTasks.forEach((task) => {
            counts[task.status] = (counts[task.status] || 0) + 1;
          });

          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const todayTasks = myTasks.filter((task) => {
            const taskEndDate = new Date(task.expectedEndDate);
            taskEndDate.setHours(0, 0, 0, 0);
            return taskEndDate.getTime() === today.getTime();
          });

          const totalToday = todayTasks.length;
          const completed = todayTasks.filter(
            (task) =>
              task.status === "CompletedInTime" ||
              task.status === "CompletedOutTime"
          ).length;
          const inProgress = todayTasks.filter(
            (task) =>
              task.status === "Assigned" ||
              task.status === "InProgress" ||
              task.status === "ReworkRequired"
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
    params.append("TechnicianId", user?.id ?? "");  

    if (searchTerm.trim()) {
      params.append("SearchTerm", searchTerm.trim());
    }

    return params.toString();
  }, [searchTerm]);

  useEffect(() => {
    const timeoutId = setTimeout(
      () => {
        const fetchTasks = async () => {
          setLoading(true);
          setError(null);

          try {
            const res = await axiosInstance.get(`/api/tasks?${buildApiQuery}`);
            
            if (isApiTaskResponse(res.data)) {
              const data = Array.isArray(res.data.data)
                ? res.data.data
                    .filter((task) => String(task.status ?? "") !== "Template")
                    .map((task) => ({
                      ...task,
                      status: normalizeTaskStatus(String(task.status ?? "")),
                    }))
                : [];
              
              console.log("Raw data from API:", data);

              let filteredData = data.filter((task) => task.technicianId === user?.id);
              
              console.log("Filtered data (my tasks):", filteredData);

              filteredData = [...filteredData].sort((a, b) => {
                const dateA = new Date(a.expectedEndDate);
                const dateB = new Date(b.expectedEndDate);
                return dateA.getTime() - dateB.getTime();
              });

              if (statusFilter !== "All") {
                filteredData = filteredData.filter((task) => task.status === statusFilter);
              }

              if (todayFilter) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                filteredData = filteredData.filter((task) => {
                  const taskEndDate = new Date(task.expectedEndDate);
                  taskEndDate.setHours(0, 0, 0, 0);
                  return taskEndDate.getTime() === today.getTime();
                });
              }

              if (searchTerm.trim()) {
                filteredData = filteredData.filter(
                  (task) =>
                    task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
                );
              }

              const startIndex = (currentPage - 1) * tasksPerPage;
              const endIndex = startIndex + tasksPerPage;
              const paginatedData = filteredData.slice(startIndex, endIndex);

              // Fetch target names for each task
              const tasksWithTargetNames = await Promise.all(
                paginatedData.map(async (task) => {
                  const targetName = await fetchTargetName(
                    task.taskTargetType,
                    task.targetId
                  );
                  return { ...task, targetName };
                })
              );

              setTasks(tasksWithTargetNames);
              setTotalCount(filteredData.length);
            }
          } catch {
            setError("Unable to load task list");
            enqueueSnackbar("Error loading data", { variant: "error" });
          } finally {
            setLoading(false);
          }
        };

        void fetchTasks();
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
      case "InProgress":
        return <Loader className={iconClass} />;
      case "WaitingForApproval":
        return <Clock className={iconClass} />;
      case "CompletedInTime":
        return <CheckCheck className={iconClass} />;
      case "CompletedOutTime":
        return <AlertCircle className={iconClass} />;
      case "Deleted":
        return <XCircle className={iconClass} />;
      case "DeclinedByTechnician":
        return <Inbox className={iconClass} />;
      case "ReworkRequired":
        return <AlertCircle className={iconClass} />;
      case "Unknown":
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
          <div className="bg-white rounded-xl p-5 border border-purple-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <UserPlus className="w-5 h-5 text-purple-500" />
              <span className="text-sm text-gray-600 font-medium">{getStatusLabel("Assigned")}:</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {statusCounts.Assigned}
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-blue-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Loader className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-gray-600 font-medium">{getStatusLabel("InProgress")}:</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {statusCounts.InProgress}
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-indigo-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-indigo-500" />
              <span className="text-sm text-gray-600 font-medium">{getStatusLabel("WaitingForApproval")}:</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {statusCounts.WaitingForApproval}
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-green-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <CheckCheck className="w-5 h-5 text-green-500" />
              <span className="text-sm text-gray-600 font-medium">{getStatusLabel("CompletedInTime")}:</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {statusCounts.CompletedInTime}
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-orange-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              <span className="text-sm text-gray-600 font-medium">{getStatusLabel("CompletedOutTime")}:</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {statusCounts.CompletedOutTime}
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-5 h-5 text-gray-500" />
              <span className="text-sm text-gray-600 font-medium">{getStatusLabel("Deleted")}:</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {statusCounts.Deleted}
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-red-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Inbox className="w-5 h-5 text-red-500" />
              <span className="text-sm text-gray-600 font-medium">{getStatusLabel("DeclinedByTechnician")}:</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {statusCounts.DeclinedByTechnician}
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
                {STATUS_FILTER_ORDER.map((key) => (
                  <option key={key} value={key}>
                      {getStatusLabel(key)}
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
                    Target Type
                  </th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-900 text-sm">
                    Target Name
                  </th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-900 text-sm">
                    Deadline
                  </th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-900 text-sm">
                    Ngày tạo
                  </th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-900 text-sm">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-gray-500">
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
                      <td className="px-6 py-4 text-gray-600">
                        {task.taskTargetType ?? "-"}
                      </td>
                      <td className="px-6 py-4 text-gray-600 max-w-xs truncate">
                        {task.targetName ?? "-"}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {task.expectedEndDate
                          ? new Date(task.expectedEndDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : ""}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {formatDateVi(task.createdDate)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
                            STATUS_COLORS[task.status]
                          }`}
                        >
                          {getStatusIcon(task.status)}
                          {getStatusLabel(task.status)}
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