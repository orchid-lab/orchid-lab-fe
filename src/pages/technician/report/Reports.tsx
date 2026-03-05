import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useEffect, useState, useMemo } from "react";
import axiosInstance from "../../../api/axiosInstance";
import type { MonitoringLog, MonitoringLogApiResponse, MonitoringLogStatus } from "../../../types/MonitoringLog";
import { useTranslation } from "react-i18next";

const PAGE_SIZE = 10;

export default function ReportsTechnician() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<MonitoringLog[]>([]);

  // Fetch monitoring logs
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      try {
        const params = new URLSearchParams({
          pageNo: "1",
          pageSize: "10000",
          TechnicianId: user.id,
        });
        const res = await axiosInstance.get(
          `/api/monitoring-log?${params.toString()}`
        );
        const json = res.data as MonitoringLogApiResponse;
        setData(json.data || []);
        setTotal(json.totalCount || 0);
      } catch {
        setData([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };
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
      default:
        return "bg-gray-50 border border-gray-200 text-gray-700";
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
          className="bg-green-800 text-white px-5 py-2 rounded-full font-semibold hover:bg-green-950 transition cursor-pointer"
          onClick={() => void navigate("/reports/new")}
        >
          + {t("monitoringLog.createNew")}
        </button>
      </div>

      {/* Summary card */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded p-4 flex-1">
          <div className="font-semibold text-blue-700">
            {t("monitoringLog.totalReports")}
          </div>
          <div className="text-2xl font-bold text-blue-700">{total}</div>
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
                    <button
                      type="button"
                      className="border cursor-pointer border-green-800 text-green-800 rounded-full px-4 py-1 hover:bg-green-800 hover:text-white transition"
                      onClick={() => void navigate(`/reports/${log.id}`)}
                    >
                      {t("common.details")}
                    </button>
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
