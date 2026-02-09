/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  Filter, 
  Beaker, 
  FlaskConical, 
  CheckCircle2, 
  XCircle,
  Clock,
  Calendar,
  TrendingUp,
  BarChart3,
  Microscope
} from "lucide-react";
import axiosInstance from "../../../api/axiosInstance";
import { Doughnut } from "react-chartjs-2";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";
import { useTranslation } from "react-i18next";

Chart.register(ArcElement, Tooltip, Legend);

type ExperimentStatus = "Created" | "InProcess" | "Done" | "Cancel";

interface Stage {
  id: string;
  name: string;
  description?: string;
  dateOfProcessing?: number;
  step: number;
  status: boolean;
  elementDTO?: unknown[];
}

interface Sample {
  id: string;
  name: string;
  description?: string;
  dob?: string;
  status?: boolean;
}

interface ExperimentLogEntry {
  id: string;
  name: string;
  methodName: string;
  description?: string;
  tissueCultureBatchName?: string;
  batchName?: string;
  createdDate?: string;
  status?: number | string;
  samples?: Sample[];
  stages?: Stage[];
  currentStageName?: string;
  currentStageOrder?: number;
  expectedSampleCount?: number;
}

interface ExperimentLogApiResponse {
  totalCount: number;
  pageCount: number;
  pageSize: number;
  pageNumber: number;
  data: ExperimentLogEntry[];
}

interface MethodOption {
  id: string;
  name: string;
}

interface SampleApiResponse {
  totalCount: number;
  pageCount: number;
  pageSize: number;
  pageNumber: number;
  data: unknown[];
}

const TechnicianExperimentLog = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ExperimentStatus | "all">("all");
  const [methodFilter, setMethodFilter] = useState<string>("");
  const [stageFilter, setStageFilter] = useState<"all" | "Giai đoạn 1" | "Giai đoạn 2" | "Giai đoạn 3" | "Giai đoạn 4">("all");
  const [logs, setLogs] = useState<ExperimentLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [sampleCounts, setSampleCounts] = useState<Record<string, number>>({});
  const [methods, setMethods] = useState<MethodOption[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    Created: number;
    InProcess: number;
    Done: number;
    Cancel: number;
  }>({
    total: 0,
    Created: 0,
    InProcess: 0,
    Done: 0,
    Cancel: 0,
  });

  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 5;

  const normalizeStatus = (status?: number | string) => {
    const statusStr = String(status ?? "");
    switch (statusStr) {
      case "1":
        return "Created";
      case "2":
        return "InProcess";
      case "3":
        return "Done";
      case "4":
        return "Cancel";
      case "Created":
        return "Created";
      case "WaitingForChangeStage":
        return "InProcess";
      case "InProcess":
        return "InProcess";
      case "Done":
        return "Done";
      case "Cancel":
        return "Cancel";
      default:
        return statusStr;
    }
  };

  const statusToVietnamese = (status?: number | string) => {
    switch (normalizeStatus(status)) {
      case "Created":
        return t("status.created");
      case "InProcess":
        return t("experimentLog.inProgress");
      case "Done":
        return t("experimentLog.completed");
      case "Cancel":
        return t("experimentLog.cancelled");
      default:
        return t("common.none");
    }
  };

  const chartData = {
    labels: [
      statusToVietnamese("Created"),
      statusToVietnamese("InProcess"),
      statusToVietnamese("Done"),
      statusToVietnamese("Cancel"),
    ],
    datasets: [
      {
        data: [stats.Created, stats.InProcess, stats.Done, stats.Cancel],
        backgroundColor: ["#ec4899", "#22c55e", "#93c5fd", "#ef4444"],
        borderWidth: 0,
        spacing: 2,
      },
    ],
  };

  // CẬP NHẬT CHART OPTIONS TẠI ĐÂY
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: 0,
    },
    plugins: {
      legend: {
        display: false, // Tắt legend mặc định để biểu đồ nở ra giữa
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

  const parseApiResponse = (data: unknown): { logs: ExperimentLogEntry[]; totalCount: number } => {
    if (typeof data === "object" && data !== null && "data" in data && "totalCount" in data) {
      const res = data as ExperimentLogApiResponse;
      if (Array.isArray(res.data)) {
        return {
          logs: res.data as ExperimentLogEntry[],
          totalCount: res.totalCount ?? res.data.length,
        };
      }
    }
    if (Array.isArray(data)) {
      return { logs: data as ExperimentLogEntry[], totalCount: data.length };
    }
    return { logs: [], totalCount: 0 };
  };

  const fetchSampleCount = async (experimentLogId: string): Promise<number> => {
    try {
      const response = await axiosInstance.get(`/api/samples?pageNo=1&pageSize=1000&experimentLogId=${experimentLogId}`);
      const data = response.data;

      if (typeof data === "object" && data !== null && "totalCount" in data) {
        return (data as SampleApiResponse).totalCount ?? 0;
      }
      if (typeof data === "object" && data !== null && "data" in data) {
        const inner = (data as SampleApiResponse).data;
        return Array.isArray(inner) ? inner.length : 0;
      }
      return Array.isArray(data) ? data.length : 0;
    } catch {
      return 0;
    }
  };

  const fetchAllSampleCounts = useCallback(async (experimentLogs: ExperimentLogEntry[]) => {
    const counts: Record<string, number> = {};
    const promises = experimentLogs.map(async (log) => {
      const count = await fetchSampleCount(log.id);
      counts[log.id] = count;
    });
    await Promise.all(promises);
    setSampleCounts(counts);
  }, []);

  useEffect(() => {
    const fetchMethods = async () => {
      try {
        const res = await axiosInstance.get("/api/methods?PageNo=1&PageSize=100");
        const raw = res.data;
        if (typeof raw === "object" && raw !== null && "data" in raw && Array.isArray((raw as { data: unknown[] }).data)) {
          const arr = (raw as { data: { id: string; name: string }[] }).data;
          setMethods(arr.map((m) => ({ id: m.id, name: m.name })));
        } else if (typeof raw === "object" && raw !== null && "value" in raw) {
          const val = (raw as { value?: { data?: { id: string; name: string }[] } }).value;
          const arr = Array.isArray(val?.data) ? val.data : [];
          setMethods(arr.map((m) => ({ id: m.id, name: m.name })));
        } else {
          setMethods([]);
        }
      } catch {
        setMethods([]);
      }
    };
    void fetchMethods();
  }, []);

  const fetchStatsOnly = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/api/experiment-logs?PageNo=1&PageSize=1000");
      const { logs: allLogs } = parseApiResponse(res.data);

      const counts = {
        Created: 0,
        InProcess: 0,
        Done: 0,
        Cancel: 0,
      };

      allLogs.forEach((log) => {
        const status = normalizeStatus(log.status);
        switch (status) {
          case "Created":
            counts.Created++;
            break;
          case "InProcess":
            counts.InProcess++;
            break;
          case "Done":
            counts.Done++;
            break;
          case "Cancel":
            counts.Cancel++;
            break;
        }
      });

      const total = counts.Created + counts.InProcess + counts.Done + counts.Cancel;

      setStats({
        total,
        Created: counts.Created,
        InProcess: counts.InProcess,
        Done: counts.Done,
        Cancel: counts.Cancel,
      });
    } catch (err) {
      console.error(t("common.errorLoading"), err);
      setStats({ total: 0, Created: 0, InProcess: 0, Done: 0, Cancel: 0 });
    }
  }, [t]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.append("PageNo", String(Math.max(1, currentPage)));
      params.append("PageSize", String(logsPerPage));

      if (methodFilter) {
        const selectedMethod = methods.find((m) => m.id === methodFilter);
        if (selectedMethod) {
          params.append("MethodNameSearchTerm", selectedMethod.name);
        }
      }

      try {
        const res = await axiosInstance.get(`/api/experiment-logs?${params.toString()}`);
        const { logs: arr, totalCount: total } = parseApiResponse(res.data);

        const normalizedLogs = arr.map((log) => ({
          ...log,
          tissueCultureBatchName: log.tissueCultureBatchName ?? log.batchName ?? "",
          status: normalizeStatus(log.status),
        }));

        setLogs(normalizedLogs);
        setTotalCount(total);

        if (normalizedLogs.length > 0) {
          await fetchAllSampleCounts(normalizedLogs);
        }
      } catch {
        setError(t("common.errorLoading"));
        setLogs([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
    void fetchStatsOnly();
  }, [currentPage, logsPerPage, methodFilter, methods, fetchAllSampleCounts, fetchStatsOnly, t]);

  const getStatusColor = (status?: number | string): string => {
    switch (normalizeStatus(status)) {
      case "Created":
        return "bg-pink-100 text-pink-700 border-pink-200";
      case "InProcess":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "Done":
        return "bg-green-100 text-green-700 border-green-200";
      case "Cancel":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusIcon = (status?: number | string) => {
    const iconClass = "w-4 h-4";
    switch (normalizeStatus(status)) {
      case "Created":
        return <Beaker className={`${iconClass} text-pink-600`} />;
      case "InProcess":
        return <Clock className={`${iconClass} text-blue-600`} />;
      case "Done":
        return <CheckCircle2 className={`${iconClass} text-green-600`} />;
      case "Cancel":
        return <XCircle className={`${iconClass} text-red-600`} />;
      default:
        return null;
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      !searchTerm ||
      log.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.tissueCultureBatchName ?? "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || normalizeStatus(log.status) === statusFilter;

    let matchesStage = true;
    if (stageFilter !== "all") {
      const stageNumber = parseInt(stageFilter.split(" ")[2]);
      if (log.currentStageOrder !== undefined) {
        matchesStage = log.currentStageOrder === stageNumber - 1;
      } else if (log.stages && log.stages.length > 0 && log.currentStageName) {
        if (stageNumber >= 1 && stageNumber <= log.stages.length) {
          const targetStageName = log.stages[stageNumber - 1].name;
          matchesStage = log.currentStageName === targetStageName;
        } else {
          matchesStage = false;
        }
      }
    }

    return matchesSearch && matchesStatus && matchesStage;
  });

  const totalPages = Math.ceil(totalCount / logsPerPage);

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-8">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Microscope className="w-10 h-10 text-purple-600" />
            <h1 className="text-4xl font-bold text-gray-900">
              {t("experimentLog.experimentLogTitle")}
            </h1>
          </div>
          <p className="text-gray-600 text-lg ml-13">
            Monitor and manage cultivation experiments efficiently.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Doughnut Chart */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t("experimentLog.latestStatusChart")}
            </h3>
            
            {/* CẬP NHẬT GIAO DIỆN CHART TẠI ĐÂY */}
            <div className="flex items-center justify-center h-[280px]">
              <div className="relative w-[280px] h-[280px]">
                <Doughnut data={chartData} options={chartOptions} />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="text-4xl font-bold text-gray-900">
                    {stats.total}
                  </div>
                  <div className="text-sm text-gray-500">Experiments</div>
                </div>
              </div>
            </div>
            {/* KẾT THÚC CẬP NHẬT CHART */}

          </div>

          {/* Status Cards */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Experiment Statistics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-pink-100 rounded-xl p-5 border border-pink-200">
                <Beaker className="w-8 h-8 text-pink-600 mb-3" />
                <div className="text-sm text-pink-700 font-medium mb-1">
                  {statusToVietnamese("Created")}
                </div>
                <div className="text-3xl font-bold text-pink-900">
                  {stats.Created}
                </div>
              </div>
              <div className="bg-blue-100 rounded-xl p-5 border border-blue-200">
                <Clock className="w-8 h-8 text-blue-600 mb-3" />
                <div className="text-sm text-blue-700 font-medium mb-1">
                  {statusToVietnamese("InProcess")}
                </div>
                <div className="text-3xl font-bold text-blue-900">
                  {stats.InProcess}
                </div>
              </div>
              <div className="bg-green-100 rounded-xl p-5 border border-green-200">
                <CheckCircle2 className="w-8 h-8 text-green-600 mb-3" />
                <div className="text-sm text-green-700 font-medium mb-1">
                  {statusToVietnamese("Done")}
                </div>
                <div className="text-3xl font-bold text-green-900">
                  {stats.Done}
                </div>
              </div>
              <div className="bg-red-100 rounded-xl p-5 border border-red-200">
                <XCircle className="w-8 h-8 text-red-600 mb-3" />
                <div className="text-sm text-red-700 font-medium mb-1">
                  {statusToVietnamese("Cancel")}
                </div>
                <div className="text-3xl font-bold text-red-900">
                  {stats.Cancel}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-6 border border-purple-200">
          <div className="flex items-center gap-4">
            <div className="bg-white p-4 rounded-xl">
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
              <p className="text-gray-600">{t("experimentLog.totalExperiments")}</p>
            </div>
            <div className="ml-auto flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.Done}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.InProcess}</div>
                <div className="text-sm text-gray-600">In Progress</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-6 h-6 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {t("experimentLog.experimentLogList")}
            </h2>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ExperimentStatus | "all")}
                className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
              >
                <option value="all">{t("experimentLog.allStatuses")}</option>
                <option value="Created">{t("status.created")}</option>
                <option value="InProcess">{t("status.inProgress")}</option>
                <option value="Done">{t("status.completed")}</option>
                <option value="Cancel">{t("status.cancelled")}</option>
              </select>
            </div>

            <select
              className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
            >
              <option value="">{t("experimentLog.allMethods")}</option>
              {methods.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>

            <select
              className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value as "all" | "Giai đoạn 1" | "Giai đoạn 2" | "Giai đoạn 3" | "Giai đoạn 4")}
            >
              <option value="all">{t("experimentLog.allStages")}</option>
              <option value="Giai đoạn 1">Giai đoạn 1</option>
              <option value="Giai đoạn 2">Giai đoạn 2</option>
              <option value="Giai đoạn 3">Giai đoạn 3</option>
              <option value="Giai đoạn 4">Giai đoạn 4</option>
            </select>

            <div className="flex-1 min-w-[300px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={t("common.search") + "..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setStatusFilter("all");
                setMethodFilter("");
                setStageFilter("all");
                setSearchTerm("");
              }}
              className="px-4 py-2.5 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors font-medium"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Experiments Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Loading experiments...</div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center py-12">{error}</div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 font-semibold text-gray-900 text-sm">
                    {t("experimentLog.experimentName")}
                  </th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-900 text-sm">
                    {t("experimentLog.method")}
                  </th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-900 text-sm">
                    {t("experimentLog.tissueCultureBatch")}
                  </th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-900 text-sm">
                    {t("experimentLog.dateCreated")}
                  </th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-900 text-sm">
                    {t("common.status")}
                  </th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-900 text-sm">
                    {t("experimentLog.sampleCount")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-gray-500">
                      {t("common.noData")}
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-purple-50 cursor-pointer transition-colors"
                      onClick={() => void navigate(`/technician/experiment-log/${log.id}`)}
                    >
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {log.name}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        <div className="flex items-center gap-2">
                          <FlaskConical className="w-4 h-4 text-purple-500" />
                          {log.methodName}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {log.tissueCultureBatchName}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {log.createdDate
                            ? new Date(log.createdDate).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : ""}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(log.status)}`}
                        >
                          {getStatusIcon(log.status)}
                          {statusToVietnamese(log.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="bg-purple-100 px-3 py-1 rounded-full">
                            <span className="font-semibold text-purple-700">
                              {sampleCounts[log.id] ?? 0}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">samples</span>
                        </div>
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
                  {t("common.showing")} {filteredLogs.length} {t("common.of")} {totalCount}
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

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                    <button
                      key={number}
                      type="button"
                      onClick={() => setCurrentPage(number)}
                      className={`px-3 py-1.5 rounded-lg text-sm ${
                        currentPage === number
                          ? "bg-purple-600 text-white"
                          : "bg-white border border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {number}
                    </button>
                  ))}

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
};

export default TechnicianExperimentLog;