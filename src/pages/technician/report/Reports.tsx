/* eslint-disable react-x/no-array-index-key */
/* eslint-disable react-hooks/exhaustive-deps */
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useEffect, useState, useMemo } from "react";
import axiosInstance from "../../../api/axiosInstance";
import type { MonitoringLog, MonitoringLogApiResponse, MonitoringLogStatus } from "../../../types/MonitoringLog";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import { Doughnut } from "react-chartjs-2";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";
import type { ChartOptions, TooltipItem } from "chart.js";

const PAGE_SIZE = 10;

Chart.register(ArcElement, Tooltip, Legend);

export default function ReportsTechnician() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [data, setData] = useState<MonitoringLog[]>([]);

  const fetchData = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        pageNo: "1",
        pageSize: "10000",
        technicianId: user.id,
      });
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

  // Fetch monitoring logs
  useEffect(() => {
    void fetchData();
  }, [user?.id]);

  // Sort data by isNewest (newest first), then by createdDate (newest first)
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      // First sort by isNewest
      if (a.isNewest && !b.isNewest) return -1;
      if (!a.isNewest && b.isNewest) return 1;
      
      // Then sort by createdDate (newest first)
      const dateA = new Date(a.createdDate).getTime();
      const dateB = new Date(b.createdDate).getTime();
      return dateB - dateA;
    });
  }, [data]);

  const statusSummary = useMemo(() => {
    return data.reduce(
      (acc, log) => {
        if (log.status === "Created") {
          acc.created += 1;
        }
        if (log.status === "WaitingForApproval") {
          acc.waitingForApproval += 1;
        }
        if (log.status === "Rejected") {
          acc.rejected += 1;
        }
        if (log.status === "Revised") {
          acc.revised += 1;
        }
        if (log.status === "Approved") {
          acc.approved += 1;
        }
        return acc;
      },
      { created: 0, waitingForApproval: 0, rejected: 0, revised: 0, approved: 0 }
    );
  }, [data]);

  const chartData = useMemo(
    () => ({
      labels: [
        t("monitoringLog.statusCreated"),
        t("monitoringLog.statusWaitingForApproval"),
        t("monitoringLog.statusRejected"),
        t("monitoringLog.statusRevised"),
        t("monitoringLog.statusApproved"),
      ],
      datasets: [
        {
          data: [
            statusSummary.created,
            statusSummary.waitingForApproval,
            statusSummary.rejected,
            statusSummary.revised,
            statusSummary.approved,
          ],
          backgroundColor: ["#3b82f6", "#f59e0b", "#ef4444", "#6366f1", "#22c55e"],
          borderWidth: 0,
          spacing: 2,
        },
      ],
    }),
    [
      statusSummary.created,
      statusSummary.waitingForApproval,
      statusSummary.rejected,
      statusSummary.revised,
      statusSummary.approved,
      t,
    ]
  );

  const chartOptions: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label(context: TooltipItem<"doughnut">) {
            return `${context.label}: ${context.parsed}`;
          },
        },
      },
    },
    cutout: "68%",
  };

  // Format date to Vietnamese format (dd/mm/yyyy)
  const formatDate = (dateString: string) => {
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

  const canSubmit = (status: MonitoringLogStatus): boolean =>
    status === "Created" || status === "Rejected";

  const handleSubmitForApproval = async (log: MonitoringLog) => {
    setSubmittingId(log.id);
    try {
      await axiosInstance.patch(`/api/monitoring-log/${log.id}/submit`);
      enqueueSnackbar(
        log.status === "Created"
          ? t("monitoringLog.submitDraftSuccess")
          : t("monitoringLog.resubmitSuccess"),
        { variant: "success" }
      );
      await fetchData();
    } catch (error) {
      const apiError = error as {
        response?: { data?: string };
        message?: string;
      };
      enqueueSnackbar(
        apiError.response?.data ?? apiError.message ?? t("monitoringLog.submitDraftFailed"),
        { variant: "error" }
      );
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 p-6">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-2">
        <h1 className="text-xl sm:text-2xl font-bold text-black">
          {t("monitoringLog.title")}
        </h1>
        <button
          type="button"
          className="bg-indigo-600 text-white px-5 py-2 rounded-full font-semibold hover:bg-indigo-800 transition cursor-pointer"
          onClick={() => void navigate("/reports/new")}
        >
          + {t("monitoringLog.createNew")}
        </button>
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
            <span className="inline-block h-3 w-3 rounded-full bg-blue-500" aria-hidden="true"></span>
            <span className="text-sm font-medium leading-tight">{t("monitoringLog.statusCreated")}</span>
          </div>
          <div className="text-2xl font-bold text-blue-800">{statusSummary.created}</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-orange-200 shadow-sm min-h-[112px]">
          <div className="flex items-center gap-2 mb-2 text-orange-700">
            <span className="inline-block h-3 w-3 rounded-full bg-orange-500" aria-hidden="true"></span>
            <span className="text-sm font-medium leading-tight">{t("monitoringLog.statusWaitingForApproval")}</span>
          </div>
          <div className="text-2xl font-bold text-orange-800">
            {statusSummary.waitingForApproval}
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-green-200 shadow-sm min-h-[112px]">
          <div className="flex items-center gap-2 mb-2 text-green-700">
            <span className="inline-block h-3 w-3 rounded-full bg-green-500" aria-hidden="true"></span>
            <span className="text-sm font-medium leading-tight">{t("monitoringLog.statusApproved")}</span>
          </div>
          <div className="text-2xl font-bold text-green-800">{statusSummary.approved}</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-red-200 shadow-sm min-h-[112px]">
          <div className="flex items-center gap-2 mb-2 text-red-700">
            <span className="inline-block h-3 w-3 rounded-full bg-red-500" aria-hidden="true"></span>
            <span className="text-sm font-medium leading-tight">{t("monitoringLog.statusRejected")}</span>
          </div>
          <div className="text-2xl font-bold text-red-800">{statusSummary.rejected}</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-indigo-200 shadow-sm min-h-[112px]">
          <div className="flex items-center gap-2 mb-2 text-indigo-700">
            <span className="inline-block h-3 w-3 rounded-full bg-indigo-500" aria-hidden="true"></span>
            <span className="text-sm font-medium leading-tight">{t("monitoringLog.statusRevised")}</span>
          </div>
          <div className="text-2xl font-bold text-indigo-800">{statusSummary.revised}</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="py-3 px-4 text-sm font-semibold text-gray-700">{t("monitoringLog.reportName")}</th>
              <th className="px-4 text-sm font-semibold text-gray-700">{t("monitoringLog.createdDate")}</th>
              <th className="px-4 text-sm font-semibold text-gray-700">{t("monitoringLog.sampleName")}</th>
              <th className="px-4 text-sm font-semibold text-gray-700">{t("common.status")}</th>
              <th className="px-4 text-sm font-semibold text-gray-700">{t("monitoringLog.newest")}</th>
              <th className="px-4 text-sm font-semibold text-gray-700">{t("common.action")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: PAGE_SIZE }).map((_, idx) => (
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
                      {canSubmit(log.status) && (
                        <button
                          type="button"
                          disabled={submittingId === log.id}
                          className="border cursor-pointer border-blue-700 text-blue-700 rounded-full px-3 py-1 hover:bg-blue-700 hover:text-white transition disabled:bg-gray-200 disabled:border-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
                          onClick={() => {
                            void handleSubmitForApproval(log);
                          }}
                        >
                          {submittingId === log.id
                            ? t("monitoringLog.submitting")
                            : log.status === "Created"
                            ? t("monitoringLog.submitDraft")
                            : t("monitoringLog.resubmit")}
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
