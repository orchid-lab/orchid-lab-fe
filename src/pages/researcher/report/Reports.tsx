import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import axiosInstance from "../../../api/axiosInstance";
import type { MonitoringLog, MonitoringLogStatus } from "../../../types/MonitoringLog";

ChartJS.register(ArcElement, Tooltip, Legend);

interface MonitoringLogApiResponse {
  data?: MonitoringLog[];
  items?: MonitoringLog[];
  totalCount?: number;
}

const PAGE_SIZE = 10;

export default function Reports() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();

  const [data, setData] = useState<MonitoringLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<MonitoringLogStatus | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        pageNo: "1",
        pageSize: "10000",
      });
      if (statusFilter) {
        params.append("status", statusFilter);
      }
      if (searchTerm) {
        params.append("nameSearchTerm", searchTerm);
      }
      const res = await axiosInstance.get(`/api/monitoring-log?${params.toString()}`);
      const json = res.data as MonitoringLogApiResponse;
      const items = json.data ?? json.items ?? [];
      setData(items);
      setTotal(json.totalCount ?? items.length);
    } catch {
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, searchTerm]);

  // Memoized status summary
  const statusSummary = useMemo(() => {
    return {
      created: data.filter((d) => d.status === "Created").length,
      waitingForApproval: data.filter((d) => d.status === "WaitingForApproval").length,
      approved: data.filter((d) => d.status === "Approved").length,
      rejected: data.filter((d) => d.status === "Rejected").length,
      revised: data.filter((d) => d.status === "Revised").length,
    };
  }, [data]);

  // Memoized chart data
  const chartData = useMemo(() => {
    return {
      labels: [
        t("monitoringLog.statusCreated"),
        t("monitoringLog.statusWaitingForApproval"),
        t("monitoringLog.statusApproved"),
        t("monitoringLog.statusRejected"),
        t("monitoringLog.statusRevised"),
      ],
      datasets: [
        {
          label: t("monitoringLog.title"),
          data: [
            statusSummary.created,
            statusSummary.waitingForApproval,
            statusSummary.approved,
            statusSummary.rejected,
            statusSummary.revised,
          ],
          backgroundColor: [
            "rgb(59, 130, 246)", // blue
            "rgb(249, 115, 22)", // orange
            "rgb(34, 197, 94)", // green
            "rgb(239, 68, 68)", // red
            "rgb(99, 102, 241)", // indigo
          ],
          borderColor: [
            "rgb(59, 130, 246)",
            "rgb(249, 115, 22)",
            "rgb(34, 197, 94)",
            "rgb(239, 68, 68)",
            "rgb(99, 102, 241)",
          ],
          borderWidth: 2,
        },
      ],
    };
  }, [statusSummary, t]);

  const chartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          font: {
            size: 12,
          },
        },
      },
    },
  };

  // Memoized and sorted data
  const sortedData = useMemo(() => {
    const sorted = [...data].sort((a, b) => {
      // Sort by isNewest first
      if (a.isNewest !== b.isNewest) {
        return a.isNewest ? -1 : 1;
      }
      // Then by creation date (newest first)
      return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
    });
    return sorted;
  }, [data]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Get status label
  const getStatusLabel = (status: MonitoringLogStatus) => {
    switch (status) {
      case "Created":
        return t("monitoringLog.statusCreated");
      case "WaitingForApproval":
        return t("monitoringLog.statusWaitingForApproval");
      case "Approved":
        return t("monitoringLog.statusApproved");
      case "Rejected":
        return t("monitoringLog.statusRejected");
      case "Revised":
        return t("monitoringLog.statusRevised");
      default:
        return status;
    }
  };

  // Get status color
  const getStatusColor = (status: MonitoringLogStatus) => {
    switch (status) {
      case "Created":
        return "bg-blue-50 border border-blue-200 text-blue-700";
      case "WaitingForApproval":
        return "bg-orange-50 border border-orange-200 text-orange-700";
      case "Approved":
        return "bg-green-50 border border-green-200 text-green-700";
      case "Rejected":
        return "bg-red-50 border border-red-200 text-red-700";
      case "Revised":
        return "bg-indigo-50 border border-indigo-200 text-indigo-700";
      default:
        return "bg-gray-50 border border-gray-200 text-gray-700";
    }
  };

  const handleSubmitApprovalRequest = async (log: MonitoringLog) => {
    setSubmittingId(log.id);
    try {
      await axiosInstance.patch(`/api/monitoring-log/${log.id}/approve`);
      enqueueSnackbar(t("monitoringLog.approveSuccess"), { variant: "success" });
      await fetchData();
    } catch (error) {
      const apiError = error as {
        response?: { data?: string };
        message?: string;
      };
      enqueueSnackbar(
        apiError.response?.data ?? apiError.message ?? t("monitoringLog.approveFailed"),
        { variant: "error" }
      );
    } finally {
      setSubmittingId(null);
    }
  };

  const canApprove = (status: MonitoringLogStatus): boolean =>
    status === "WaitingForApproval";


  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 p-6">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-2">
        <h1 className="text-xl sm:text-2xl font-bold text-black">
          {t("monitoringLog.title")} - {t("roles.researcher")}
        </h1>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6 items-start">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm min-h-[240px] lg:col-span-2 lg:row-span-2">
          <div className="font-semibold text-gray-700 mb-4">
            {t("monitoringLog.totalReports")}
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <div className="text-4xl font-bold text-gray-900">{total}</div>
              <div className="text-sm text-gray-500 mt-1">{t("monitoringLog.totalReports")}</div>
            </div>
            <div className="h-36 w-36 sm:h-44 sm:w-44">
              <Doughnut data={chartData} options={chartOptions} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-blue-200 shadow-sm min-h-[112px]">
          <div className="flex items-center gap-2 mb-2 text-blue-700">
            <span
              className="inline-block h-3 w-3 rounded-full bg-blue-500"
              aria-hidden="true"
            ></span>
            <span className="text-sm font-medium leading-tight">
              {t("monitoringLog.statusCreated")}
            </span>
          </div>
          <div className="text-2xl font-bold text-blue-800">{statusSummary.created}</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-orange-200 shadow-sm min-h-[112px]">
          <div className="flex items-center gap-2 mb-2 text-orange-700">
            <span
              className="inline-block h-3 w-3 rounded-full bg-orange-500"
              aria-hidden="true"
            ></span>
            <span className="text-sm font-medium leading-tight">
              {t("monitoringLog.statusWaitingForApproval")}
            </span>
          </div>
          <div className="text-2xl font-bold text-orange-800">
            {statusSummary.waitingForApproval}
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-green-200 shadow-sm min-h-[112px]">
          <div className="flex items-center gap-2 mb-2 text-green-700">
            <span
              className="inline-block h-3 w-3 rounded-full bg-green-500"
              aria-hidden="true"
            ></span>
            <span className="text-sm font-medium leading-tight">
              {t("monitoringLog.statusApproved")}
            </span>
          </div>
          <div className="text-2xl font-bold text-green-800">{statusSummary.approved}</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-red-200 shadow-sm min-h-[112px]">
          <div className="flex items-center gap-2 mb-2 text-red-700">
            <span
              className="inline-block h-3 w-3 rounded-full bg-red-500"
              aria-hidden="true"
            ></span>
            <span className="text-sm font-medium leading-tight">
              {t("monitoringLog.statusRejected")}
            </span>
          </div>
          <div className="text-2xl font-bold text-red-800">{statusSummary.rejected}</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-indigo-200 shadow-sm min-h-[112px]">
          <div className="flex items-center gap-2 mb-2 text-indigo-700">
            <span
              className="inline-block h-3 w-3 rounded-full bg-indigo-500"
              aria-hidden="true"
            ></span>
            <span className="text-sm font-medium leading-tight">
              {t("monitoringLog.statusRevised")}
            </span>
          </div>
          <div className="text-2xl font-bold text-indigo-800">{statusSummary.revised}</div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                className="w-full border border-gray-300 rounded-full px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-green-600"
                placeholder={t("common.search")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="absolute left-3 top-2.5 text-gray-400">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                  <path
                    stroke="currentColor"
                    strokeWidth="2"
                    d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1 0 6.5 6.5a7.5 7.5 0 0 0 10.6 10.6z"
                  />
                </svg>
              </span>
            </div>
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-64">
            <select
              className="w-full border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
              value={statusFilter ?? ""}
              onChange={(e) => setStatusFilter((e.target.value || null) as MonitoringLogStatus | null)}
            >
              <option value="">{t("common.all")}</option>
              <option value="Created">{t("monitoringLog.statusCreated")}</option>
              <option value="WaitingForApproval">
                {t("monitoringLog.statusWaitingForApproval")}
              </option>
              <option value="Approved">{t("monitoringLog.statusApproved")}</option>
              <option value="Rejected">{t("monitoringLog.statusRejected")}</option>
              <option value="Revised">{t("monitoringLog.statusRevised")}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="py-3 px-4 text-sm font-semibold text-gray-700">
                {t("monitoringLog.reportName")}
              </th>
              <th className="px-4 text-sm font-semibold text-gray-700">
                {t("monitoringLog.createdDate")}
              </th>
              <th className="px-4 text-sm font-semibold text-gray-700">
                {t("monitoringLog.sampleName")}
              </th>
              <th className="px-4 text-sm font-semibold text-gray-700">
                {t("common.status")}
              </th>
              <th className="px-4 text-sm font-semibold text-gray-700">
                {t("monitoringLog.newest")}
              </th>
              <th className="px-4 text-sm font-semibold text-gray-700">
                {t("common.action")}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: PAGE_SIZE }).map((_, idx) => (
                // eslint-disable-next-line react/no-array-index-key
                <tr key={idx} className="border-t animate-pulse">
                  <td className="py-3 px-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </td>
                  <td className="px-4">
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </td>
                  <td className="px-4">
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </td>
                  <td className="px-4">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  </td>
                  <td className="px-4">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </td>
                  <td className="px-4">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </td>
                </tr>
              ))
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-400">
                  {t("monitoringLog.noReports")}
                </td>
              </tr>
            ) : (
              sortedData.map((log) => (
                <tr key={log.id} className="border-t hover:bg-green-50">
                  <td className="py-3 px-4 font-medium">{log.name}</td>
                  <td className="px-4">{formatDate(log.createdDate)}</td>
                  <td className="px-4">{log.sampleName}</td>
                  <td className="px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                        log.status
                      )}`}
                    >
                      {getStatusLabel(log.status)}
                    </span>
                  </td>
                  <td className="px-4">
                    {log.isNewest && (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-purple-50 border border-purple-200 text-purple-700">
                        {t("monitoringLog.newest")}
                      </span>
                    )}
                  </td>
                  <td className="px-4">
                    <div className="flex items-center gap-2">
                      {canApprove(log.status) && (
                        <button
                          type="button"
                          disabled={submittingId === log.id}
                          className="border cursor-pointer border-blue-700 text-blue-700 rounded-full px-3 py-1 hover:bg-blue-700 hover:text-white transition disabled:bg-gray-200 disabled:border-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
                          onClick={() => {
                            void handleSubmitApprovalRequest(log);
                          }}
                        >
                          {submittingId === log.id
                            ? t("monitoringLog.approving")
                            : t("monitoringLog.approve")}
                        </button>
                      )}
                      <button
                        type="button"
                        className="border cursor-pointer border-green-800 text-green-800 rounded-full px-4 py-1 hover:bg-green-800 hover:text-white transition"
                        onClick={() => void navigate(`/monitoring-logs/${log.id}`)}
                      >
                        {t("common.details")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}