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
import { useTranslation } from 'react-i18next';

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

function getStatusLabel(status: StatusType, t: (key: string) => string): string {
  const labels: Record<StatusType, string> = {
    Assigned: t('status.taskAssigned'),
    Taken: t('status.taskTaken'),
    InProcess: t('status.taskInProcess'),
    DoneInTime: t('status.taskDoneInTime'),
    DoneInLate: t('status.taskDoneInLate'),
    Cancel: t('status.taskCancelled'),
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

const STATUS_BG_COLORS: Record<StatusType, string> = {
  Assigned: "bg-blue-50 border-blue-200",
  Taken: "bg-purple-50 border-purple-200",
  InProcess: "bg-yellow-50 border-yellow-200",
  DoneInTime: "bg-green-50 border-green-200",
  DoneInLate: "bg-orange-50 border-orange-200",
  Cancel: "bg-red-50 border-red-200",
};

export default function AdminTasks() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [statusFilter, setStatusFilter] = useState<StatusType | string>(
    t('common.all')
  );
  const [researcherFilter, setResearcherFilter] = useState<string>(t('common.all'));
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
        label: t('task.totalTasksCreated'),
        data: chartStats.map((item) => item.total),
        backgroundColor: "#3b82f6",
      },
      {
        label: t('task.tasksCompletedOnTime'),
        data: chartStats.map((item) => item.completedOnTime),
        backgroundColor: "#22c55e",
      },
    ],
  };

  const filteredChartStats = useMemo(() => {
    if (!filterDate) return [];
    const grouped: Record<
      string,
      { created: number; completedOnTime: number }
    > = {};

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
        label: "Được tạo",
        data: filteredChartStats.map((item) => item.created),
        backgroundColor: "#3b82f6",
      },
      {
        label: "Hoàn thành đúng hạn",
        data: filteredChartStats.map((item) => item.completedOnTime),
        backgroundColor: "#22c55e",
      },
    ],
  };

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }

        .animate-scale-in {
          animation: scaleIn 0.5s ease-out forwards;
        }

        .animate-slide-in-left {
          animation: slideInLeft 0.5s ease-out forwards;
        }

        .stagger-1 { animation-delay: 0.1s; opacity: 0; }
        .stagger-2 { animation-delay: 0.2s; opacity: 0; }
        .stagger-3 { animation-delay: 0.3s; opacity: 0; }
        .stagger-4 { animation-delay: 0.4s; opacity: 0; }
        .stagger-5 { animation-delay: 0.5s; opacity: 0; }
        .stagger-6 { animation-delay: 0.6s; opacity: 0; }

        .hover-lift {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .hover-lift:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px -6px rgba(0, 0, 0, 0.15);
        }

        .row-hover {
          transition: all 0.2s ease;
        }

        .row-hover:hover {
          transform: scale(1.01);
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.2);
        }
      `}</style>

      <div className="space-y-6">
        {/* Header with Chart 1 */}
        <div className="animate-fade-in-up">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              {t('task.taskStatisticsTitle')}
            </h1>
            <select
              value={timeMode}
              onChange={(e) =>
                setTimeMode(e.target.value as "day" | "week" | "month")
              }
              className="border border-gray-300 px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="day">{t('common.byDay')}</option>
              <option value="week">{t('common.byWeek')}</option>
              <option value="month">{t('common.byMonth')}</option>
            </select>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 hover-lift">
            <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: true }} />
          </div>
        </div>

        {/* Chart 2 */}
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-4 animate-fade-in-up stagger-1 hover-lift">
          <div className="flex items-center gap-4 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">
              {t('task.specificTaskStatistics')}
            </h1>
            <select
              value={filterMode}
              onChange={(e) =>
                setFilterMode(e.target.value as "day" | "week" | "month")
              }
              className="border border-gray-300 px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="day">{t('common.byDay')}</option>
              <option value="week">{t('common.byWeek')}</option>
              <option value="month">{t('common.byMonth')}</option>
            </select>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="border border-gray-300 px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <Bar data={filteredChartData} options={{ responsive: true, maintainAspectRatio: true }} />
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
          {Object.keys(STATUS_COLORS).map((key, index) => (
            <div
              key={key}
              className={`rounded-xl border ${STATUS_BG_COLORS[key as StatusType]} px-6 py-4 flex flex-col items-center animate-scale-in hover-lift stagger-${index + 1}`}
            >
              <span className="text-sm text-gray-600 mb-2 font-medium">{getStatusLabel(key as StatusType, t)}</span>
              <span
                className={`text-3xl font-bold ${
                  STATUS_COLORS[key as StatusType]
                } transition-all duration-300`}
              >
                {statusCounts[key as StatusType]}
              </span>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-xl shadow-lg animate-slide-in-left">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700 font-semibold">
                Trạng thái:
              </span>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value)
                }
                className="border border-gray-300 rounded-full px-4 py-2 text-sm shadow-sm hover:shadow-md transition-all duration-200 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value={t('common.all')}>{t('common.all')}</option>
                {Object.keys(STATUS_COLORS).map((key) => (
                  <option key={key} value={key}>
                    {getStatusLabel(key as StatusType, t)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700 font-semibold">
                {t('task.taskCreator')}:
              </span>
              <select
                value={researcherFilter}
                onChange={(e) => setResearcherFilter(e.target.value)}
                className="border border-gray-300 rounded-full px-4 py-2 text-sm shadow-sm hover:shadow-md transition-all duration-200 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value={t('common.all')}>{t('common.all')}</option>
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
                placeholder={`🔍 ${t('task.searchTasks')}`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-full px-6 py-2 text-sm shadow-sm hover:shadow-md transition-all duration-200 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600 font-medium">{t('common.loadingData')}</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-500 text-lg font-medium">{error}</div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden animate-fade-in-up stagger-2">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-green-50 to-blue-50 border-b-2 border-green-200">
                  <tr>
                    <th className="text-left p-4 font-semibold text-gray-900">
                      {t('task.taskName')}
                    </th>
                    <th className="text-left p-4 font-semibold text-gray-900">
                      {t('task.taskCreator')}
                    </th>
                    <th className="text-left p-4 font-semibold text-gray-900">
                      {t('task.experimentLog')}
                    </th>
                    <th className="text-left p-4 font-semibold text-gray-900">
                      {t('task.deadline')}
                    </th>
                    <th className="text-left p-4 font-semibold text-gray-900">
                      {t('common.status')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center p-12 text-gray-500">
                        <div className="text-6xl mb-4">📋</div>
                        <div className="text-lg font-medium">Không có nhiệm vụ nào</div>
                      </td>
                    </tr>
                  ) : (
                    tasks.map((task, index) => (
                      <tr
                        key={task.id}
                        className="border-b hover:bg-gradient-to-r hover:from-green-50 hover:to-blue-50 cursor-pointer row-hover"
                        onClick={() => void navigate(`/admin/tasks/${task.id}`)}
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <td className="p-4 font-medium text-gray-900">{task.name}</td>
                        <td className="p-4 text-gray-700">{task.researcher}</td>
                        <td className="p-4 text-gray-700">
                          {task.experimentLogName ?? "Không có"}
                        </td>
                        <td className="p-4 text-gray-700">
                          {task.end_date
                            ? new Date(task.end_date).toLocaleDateString("vi-VN")
                            : ""}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                              STATUS_COLORS[task.status]
                            } bg-opacity-10 border transition-all duration-200 hover:scale-105`}
                            style={{
                              backgroundColor: STATUS_BG_COLORS[task.status].includes('blue') ? '#dbeafe' :
                                STATUS_BG_COLORS[task.status].includes('purple') ? '#f3e8ff' :
                                STATUS_BG_COLORS[task.status].includes('yellow') ? '#fef3c7' :
                                STATUS_BG_COLORS[task.status].includes('green') ? '#d1fae5' :
                                STATUS_BG_COLORS[task.status].includes('orange') ? '#fed7aa' :
                                '#fee2e2'
                            }}
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

            {totalPages > 1 && (
              <div className="flex justify-between items-center text-sm text-gray-600 p-6 bg-gray-50">
                <span className="font-medium">
                  {t('common.showing')} {tasks.length} {t('task.tasks')} {t('common.on')} {t('common.total')} {totalCount}{" "}
                  {t('task.tasks')}
                </span>
                <div className="flex gap-2">
                  {currentPage > 1 && (
                    <button
                      type="button"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      className="px-4 py-2 rounded-lg bg-white border border-gray-300 hover:bg-green-50 hover:border-green-500 transition-all duration-200 font-medium shadow-sm hover:shadow"
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
                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                          currentPage === pageNum
                            ? "bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg scale-105"
                            : "bg-white border border-gray-300 hover:bg-green-50 hover:border-green-500 shadow-sm hover:shadow"
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
                      className="px-4 py-2 rounded-lg bg-white border border-gray-300 hover:bg-green-50 hover:border-green-500 transition-all duration-200 font-medium shadow-sm hover:shadow"
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