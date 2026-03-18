/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axiosInstance from "../../../api/axiosInstance";
import { useSnackbar } from "notistack";
import { useAuth } from "../../../context/AuthContext";
import type { TaskStatusType, TaskItem, TaskListApiResponse } from "../../../types/TechnicianTask";
import {
  Clock,
  UserPlus,
  Inbox,
  Loader,
  CheckCheck,
  AlertCircle,
  XCircle,
  Search,
  Filter,
} from "lucide-react";

function isTaskListApiResponse(obj: unknown): obj is TaskListApiResponse {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "data" in obj
  );
}

const STATUS_LABELS: Record<TaskStatusType, string> = {
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

const STATUS_TRANSLATION_KEYS: Record<TaskStatusType, string> = {
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

const STATUS_COLORS: Record<TaskStatusType, string> = {
  Assigned: "bg-[#E4F0E8] text-[#2D5A27] border-[#C9E7D2]",
  InProgress: "bg-[#E4F0E8] text-[#2D5A27] border-[#C9E7D2]",
  WaitingForApproval: "bg-[#FFF0F9] text-[#DA70D6] border-[#F3D4EB]",
  CompletedInTime: "bg-[#E4F0E8] text-[#2D5A27] border-[#C9E7D2]",
  CompletedOutTime: "bg-[#FFF4E6] text-[#F97316] border-[#FCD5B8]",
  Deleted: "bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]",
  DeclinedByTechnician: "bg-[#FEE2E2] text-[#B91C1C] border-[#FECACA]",
  ReworkRequired: "bg-[#FFF4E6] text-[#F97316] border-[#FCD5B8]",
  Unknown: "bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]",
};

const STATUS_ICON_COLORS: Record<TaskStatusType, string> = {
  Assigned: "text-[#2D5A27]",
  InProgress: "text-[#2D5A27]",
  WaitingForApproval: "text-[#DA70D6]",
  CompletedInTime: "text-[#2D5A27]",
  CompletedOutTime: "text-[#F97316]",
  Deleted: "text-[#6B7280]",
  DeclinedByTechnician: "text-[#B91C1C]",
  ReworkRequired: "text-[#F97316]",
  Unknown: "text-[#6B7280]",
};

const STATUS_FILTER_ORDER: TaskStatusType[] = [
  "Assigned",
  "InProgress",
  "WaitingForApproval",
  "CompletedInTime",
  "CompletedOutTime",
  "Deleted",
  "DeclinedByTechnician",
  "ReworkRequired",
];

const normalizeTaskStatus = (status: string): TaskStatusType => {
  if (status in STATUS_LABELS) {
    return status as TaskStatusType;
  }

  return "Unknown";
};

const createEmptyStatusCounts = (): Record<TaskStatusType, number> => ({
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

  const getStatusLabel = (status: TaskStatusType) =>
    t(STATUS_TRANSLATION_KEYS[status], { defaultValue: STATUS_LABELS[status] });

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [statusFilter, setStatusFilter] = useState<TaskStatusType | "All">("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [todayFilter, setTodayFilter] = useState(false);

  const [statusCounts, setStatusCounts] = useState<Record<TaskStatusType, number>>(
    createEmptyStatusCounts()
  );

  const [totalTasks, setTotalTasks] = useState(0);

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
        return data?.name ?? t("common.none");
      }
    } catch (error) {
      console.error("Error fetching target:", error);
    }
    return t("common.none");
  };

  useEffect(() => {
    const loadSummaryData = async () => {
      try {
        const params = new URLSearchParams();
        params.append("PageNumber", "1");
        params.append("PageSize", "1000");

        const response = await axiosInstance.get(`/api/tasks?${params.toString()}`);

        if (isTaskListApiResponse(response.data)) {
          const allTasks = Array.isArray(response.data.data)
            ? response.data.data
                .filter((task) => String(task.status ?? "") !== "Template")
                .map((task) => ({
                ...task,
                status: normalizeTaskStatus(String(task.status ?? "")),
              }))
            : [];

          const myTasks = allTasks.filter((task) => task.technicianId === user?.id);

          const counts: Record<TaskStatusType, number> = createEmptyStatusCounts();

          myTasks.forEach((task) => {
            counts[task.status] = (counts[task.status] || 0) + 1;
          });

          console.log("All my tasks:", myTasks.length);
          console.log("Tasks by status:", counts);

          setStatusCounts(counts);
          setTotalTasks(myTasks.length);
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
            
            if (isTaskListApiResponse(res.data)) {
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
            setError(t("technicianTask.unableToLoadTaskList"));
            enqueueSnackbar(t("common.errorLoading"), { variant: "error" });
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

  const urgentCount =
    statusCounts.Assigned + statusCounts.InProgress + statusCounts.ReworkRequired;
  const inProgressCount = statusCounts.InProgress;
  const waitingApprovalCount = statusCounts.WaitingForApproval;
  const completedCount = statusCounts.CompletedInTime + statusCounts.CompletedOutTime;

  const totalTrackedTasks = Math.max(totalTasks, 1);
  const completedPercent = Math.round((completedCount / totalTrackedTasks) * 100);

  const getStatusIcon = (status: TaskStatusType) => {
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
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#F4F7F4] p-8">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#2D5A27] mb-2">
            {t("technicianTask.pageTitle")}
          </h1>
          <p className="text-[#4B6C54] text-lg">
            {t("technicianTask.pageSubtitle")}
          </p>
        </div>

        {/* Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-[0_18px_40px_rgba(45,90,39,0.12)] border border-[#DDEEE0] p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-[#2D5A27] mb-1">
                  {t("technicianTask.overallTaskDistribution")}
                </h3>
                <p className="text-sm text-[#4B6C54]">
                  {t("technicianTask.overallTaskSummary", { defaultValue: "Overview of your tasks" })}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-[#2D5A27]">{totalTasks}</div>
                <div className="text-xs text-[#4B6C54] mt-1">{t("task.taskList")}</div>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between text-sm text-[#4B6C54] mb-2">
                <span>{t("technicianTask.completedRate", { defaultValue: "Completed" })}</span>
                <span className="font-semibold text-[#2D5A27]">{completedPercent}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-[#E4F0E8] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#2D5A27] transition-all duration-500"
                  style={{ width: `${completedPercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl shadow-[0_14px_32px_rgba(45,90,39,0.10)] border border-[#DDEEE0] p-5">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-[#DA70D6]/30 to-[#F97316]/30 text-[#DA70D6]">
                    <AlertCircle className="w-5 h-5" />
                  </span>
                  <span className="text-sm font-medium text-[#2D5A27]">
                    {t("technicianTask.urgentTasks", { defaultValue: "Cần làm ngay / Trễ hạn" })}
                  </span>
                </div>
                <span className="text-2xl font-semibold text-[#DA70D6]">{urgentCount}</span>
              </div>
              <p className="text-xs text-[#4B6C54]">
                {t("technicianTask.urgentTasksHelp", { defaultValue: "Tasks past due or require immediate attention." })}
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-[0_14px_32px_rgba(45,90,39,0.10)] border border-[#DDEEE0] p-5">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#DDEEE0] text-[#2D5A27]">
                    <Loader className="w-5 h-5" />
                  </span>
                  <span className="text-sm font-medium text-[#2D5A27]">
                    {t("technicianTask.inProgress", { defaultValue: "Đang thực hiện" })}
                  </span>
                </div>
                <span className="text-2xl font-semibold text-[#2D5A27]">{inProgressCount}</span>
              </div>
              <p className="text-xs text-[#4B6C54]">
                {t("technicianTask.inProgressHelp", { defaultValue: "Tasks currently in progress." })}
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-[0_14px_32px_rgba(45,90,39,0.10)] border border-[#DDEEE0] p-5">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#FFF0F9] text-[#DA70D6]">
                    <Clock className="w-5 h-5" />
                  </span>
                  <span className="text-sm font-medium text-[#2D5A27]">
                    {t("technicianTask.waitingApproval", { defaultValue: "Chờ phê duyệt" })}
                  </span>
                </div>
                <span className="text-2xl font-semibold text-[#DA70D6]">{waitingApprovalCount}</span>
              </div>
              <p className="text-xs text-[#4B6C54]">
                {t("technicianTask.waitingApprovalHelp", { defaultValue: "Tasks waiting for approval." })}
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-[0_14px_32px_rgba(45,90,39,0.10)] border border-[#DDEEE0] p-5">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#E5E7EB] text-[#4B5563]">
                    <CheckCheck className="w-5 h-5" />
                  </span>
                  <span className="text-sm font-medium text-[#2D5A27]">
                    {t("technicianTask.completed", { defaultValue: "Hoàn thành" })}
                  </span>
                </div>
                <span className="text-2xl font-semibold text-[#4B5563]">{completedCount}</span>
              </div>
              <p className="text-xs text-[#4B6C54]">
                {t("technicianTask.completedHelp", { defaultValue: "Tasks completed on time or late." })}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-[0_10px_20px_rgba(45,90,39,0.08)] border border-[#DDEEE0] p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-[#2D5A27]" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as TaskStatusType | "All")}
                className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent bg-white"
              >
                <option value="All">{t("common.status")}</option>
                {STATUS_FILTER_ORDER.map((key) => (
                  <option key={key} value={key}>
                      {getStatusLabel(key)}
                  </option>
                ))}
              </select>
            </div>

            <select className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent bg-white">
              <option>{t("technicianTask.dateRange")}</option>
            </select>

            <select className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent bg-white">
              <option>{t("technicianTask.taskType")}</option>
            </select>

            <div className="flex-1 min-w-[300px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={t("task.searchTasks")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setStatusFilter("All");
                setSearchTerm("");
                setTodayFilter(false);
              }}
              className="px-4 py-2.5 text-sm text-[#2D5A27] hover:text-[#1e3e1c] hover:bg-[#E4F0E8] rounded-lg transition-colors font-medium"
            >
              {t("common.clearFilters")}
            </button>
          </div>
        </div>

        {/* Tasks Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">{t("technicianTask.loadingTasks")}</div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center py-12">{error}</div>
        ) : (
          <div className="bg-white rounded-2xl shadow-[0_18px_40px_rgba(45,90,39,0.08)] border border-[#DDEEE0] overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#F4F7F4] border-b border-[#DDEEE0]">
                <tr>
                  <th className="text-left px-6 py-4 font-semibold text-[#2D5A27] text-sm">
                    {t("task.taskName")}
                  </th>
                  <th className="text-left px-6 py-4 font-semibold text-[#2D5A27] text-sm">
                    {t("task.targetType")}
                  </th>
                  <th className="text-left px-6 py-4 font-semibold text-[#2D5A27] text-sm">
                    {t("technicianTask.targetName")}
                  </th>
                  <th className="text-left px-6 py-4 font-semibold text-[#2D5A27] text-sm">
                    {t("task.deadline")}
                  </th>
                  <th className="text-left px-6 py-4 font-semibold text-[#2D5A27] text-sm">
                    {t("common.createdAt")}
                  </th>
                  <th className="text-left px-6 py-4 font-semibold text-[#2D5A27] text-sm">
                    {t("common.status")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-gray-500">
                      {t("task.noTasks")}
                    </td>
                  </tr>
                ) : (
                  tasks.map((task) => (
                    <tr
                      key={task.id}
                      className="hover:bg-[#EBF7EE] cursor-pointer transition-colors"
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
                      <td className="px-6 py-4 text-[#4B6C54]">
                        {formatDateVi(task.expectedEndDate)}
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
              <div className="px-6 py-4 bg-[#F4F7F4] border-t border-[#DDEEE0] flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  {t("common.showing")} {tasks.length} {t("common.of")} {totalCount} {t("common.tasks")}
                </span>
                <div className="flex gap-2">
                  {currentPage > 1 && (
                    <button
                      type="button"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      className="px-3 py-1.5 rounded-lg bg-white border border-[#DDEEE0] hover:bg-[#E4F0E8] text-sm"
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
                            ? "bg-[#2D5A27] text-white"
                            : "bg-white border border-[#DDEEE0] hover:bg-[#E4F0E8]"
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
                      className="px-3 py-1.5 rounded-lg bg-white border border-[#DDEEE0] hover:bg-[#E4F0E8] text-sm"
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