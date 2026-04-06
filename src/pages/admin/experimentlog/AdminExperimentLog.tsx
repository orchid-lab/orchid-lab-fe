/* eslint-disable react-x/no-array-index-key */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable react-dom/no-missing-button-type */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable no-prototype-builtins */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import axiosInstance from "../../../api/axiosInstance";
import { Doughnut } from "react-chartjs-2";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";
import { useTranslation } from "react-i18next";

Chart.register(ArcElement, Tooltip, Legend);

type ExperimentStatus = "Created" | "InProcess" | "Done" | "Cancel";

interface ExperimentLogEntry {
  id: string;
  name: string;
  methodName: string;
  batcheName?: string;
  createdDate?: string;
  status?: string | number;
}

interface MethodOption {
  id: string;
  name: string;
}

const AdminExperimentLog = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // States
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ExperimentStatus | "all">("all");
  const [methodFilter, setMethodFilter] = useState<string>("");
  const [logs, setLogs] = useState<ExperimentLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [sampleCounts, setSampleCounts] = useState<Record<string, number>>({});
  const [methods, setMethods] = useState<MethodOption[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState({ total: 0, Created: 0, InProcess: 0, Done: 0, Cancel: 0 });

  const logsPerPage = 5;

  // 1. Fix lỗi Status & chuẩn hóa
  const normalizeStatus = useCallback((status?: number | string): ExperimentStatus | string => {
    const s = String(status ?? "").trim();
    switch (s) {
      case "1": case "Created": 
        return "Created";
      case "2": case "InProcess": case "InProgress": case "Processing": 
        return "InProcess";
      case "3": case "Done": case "Completed": 
        return "Done";
      case "4": case "Cancel": case "Cancelled": case "Destroyed": 
        return "Cancel"; // Destroyed cho vào nhóm Cancel (màu đỏ)
      default: 
        return s;
    }
  }, []);

  const statusToVietnamese = (status?: number | string) => {
    const normalized = normalizeStatus(status);
    if (normalized === "Created") return t("status.created");
    if (normalized === "InProcess") return t("experimentLog.inProgress");
    if (normalized === "Done") return t("experimentLog.completed");
    if (normalized === "Cancel") return t("experimentLog.cancelled");
    return t("common.none");
  };

  // Charts
  const chartData = {
    labels: [t("status.created"), t("experimentLog.inProgress"), t("experimentLog.completed"), t("experimentLog.cancelled")],
    datasets: [{
      data: [stats.Created, stats.InProcess, stats.Done, stats.Cancel],
      backgroundColor: ["#3b82f6", "#facc15", "#22c55e", "#ef4444"],
      borderWidth: 1,
    }],
  };

  // Actions
  const fetchSampleCount = async (id: string) => {
    try {
      const res = await axiosInstance.get(`/api/sample?pageNo=1&pageSize=1&experimentLogId=${id}`);
      return res.data?.totalCount ?? 0;
    } catch { return 0; }
  };

  const fetchStats = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/api/experiment-logs?pageNo=1&pageSize=1000");
      const allData = res.data?.data ?? [];
      const counts = { Created: 0, InProcess: 0, Done: 0, Cancel: 0 };
      
      allData.forEach((item: any) => {
        const s = normalizeStatus(item.status);
        if (counts.hasOwnProperty(s)) counts[s as keyof typeof counts]++;
      });
      setStats({ total: allData.length, ...counts });
    } catch (err) { console.error(err); }
  }, [normalizeStatus]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const params = new URLSearchParams({
        pageNo: String(currentPage),
        pageSize: String(logsPerPage),
        ...(methodFilter && { methodNameSearchTerm: methodFilter })
      });

      try {
        const res = await axiosInstance.get(`/api/experiment-logs?${params.toString()}`);
        const rawLogs = res.data?.data ?? [];
        setTotalCount(res.data?.totalCount ?? 0);
        setLogs(rawLogs);

        // Fetch sample counts song song
        const counts: Record<string, number> = {};
        await Promise.all(rawLogs.map(async (log: any) => {
          counts[log.id] = await fetchSampleCount(log.id);
        }));
        setSampleCounts(counts);
      } catch {
        setError(t("common.errorLoading"));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    fetchStats();
  }, [currentPage, methodFilter, fetchStats, t]);

  useEffect(() => {
    const fetchMethods = async () => {
      try {
        const res = await axiosInstance.get("/api/methods?pageNumber=1&pageSize=100");
        setMethods(res.data?.data ?? []);
      } catch { setMethods([]); }
    };
    fetchMethods();
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = !searchTerm || log.name.toLowerCase().includes(searchTerm.toLowerCase()) || (log.batcheName ?? "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || normalizeStatus(log.status) === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-50">
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{t("experimentLog.experimentLogTitle")}</h1>
        <div className="flex flex-wrap gap-6 items-center">
          <div className="bg-white rounded-lg shadow p-4 w-[280px]">
            <Doughnut data={chartData} options={{ plugins: { legend: { position: "bottom" } } }} />
          </div>
          <div className="flex flex-wrap gap-4">
            <StatCard label={t("experimentLog.totalExperiments")} value={stats.total} color="blue" />
            <StatCard label={t("experimentLog.inProgress")} value={stats.InProcess} color="yellow" />
            <StatCard label={t("experimentLog.completed")} value={stats.Done} color="green" />
            <StatCard label={t("experimentLog.cancelled")} value={stats.Cancel} color="red" />
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b flex gap-4 flex-wrap items-center">
            <div className="flex-1 relative min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={t("common.search")}
                className="w-full pl-10 pr-4 py-2 border rounded-full outline-none focus:ring-2 focus:ring-green-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="border rounded-full px-4 py-2 text-sm outline-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="all">{t("experimentLog.allStatuses")}</option>
              <option value="Created">{t("status.created")}</option>
              <option value="InProcess">{t("status.inProgress")}</option>
              <option value="Done">{t("status.completed")}</option>
              <option value="Cancel">{t("status.cancelled")}</option>
            </select>
            <select
              className="border rounded-full px-4 py-2 text-sm outline-none"
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
            >
              <option value="">{t("experimentLog.allMethods")}</option>
              {methods.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
            </select>
          </div>

          <table className="w-full">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-6 py-3 text-left">{t("experimentLog.experimentName")}</th>
                <th className="px-6 py-3 text-left">{t("experimentLog.method")}</th>
                <th className="px-6 py-3 text-left">{t("experimentLog.tissueCultureBatch")}</th>
                <th className="px-6 py-3 text-left">{t("experimentLog.dateCreated")}</th>
                <th className="px-6 py-3 text-left">{t("common.status")}</th>
                <th className="px-6 py-3 text-left">{t("experimentLog.sampleCount")}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? <SkeletonRows /> : filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-green-50 cursor-pointer" onClick={() => navigate(`/admin/experiment-log/${log.id}`)}>
                  <td className="px-6 py-4 text-sm font-medium">{log.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{log.methodName}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{log.batcheName}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{log.createdDate ? new Date(log.createdDate).toLocaleDateString("vi-VN") : "---"}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusStyle(normalizeStatus(log.status))}`}>
                      {statusToVietnamese(log.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-blue-600">{sampleCounts[log.id] ?? 0} mẫu</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="px-6 py-4 bg-gray-50 flex justify-between items-center border-t">
            <span className="text-sm text-gray-500">Tổng cộng: {totalCount}</span>
            <div className="flex gap-2">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3 py-1 border rounded disabled:opacity-50">Trước</button>
              <button disabled={currentPage * logsPerPage >= totalCount} onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1 border rounded disabled:opacity-50">Sau</button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

const getStatusStyle = (s: string) => {
  if (s === "Created") return "bg-blue-100 text-blue-800";
  if (s === "InProcess") return "bg-yellow-100 text-yellow-800";
  if (s === "Done") return "bg-green-100 text-green-800";
  if (s === "Cancel") return "bg-red-100 text-red-800";
  return "bg-gray-100 text-gray-800";
};

const StatCard = ({ label, value, color }: any) => {
  const colors: any = { blue: "bg-blue-50 text-blue-700", yellow: "bg-yellow-50 text-yellow-700", green: "bg-green-50 text-green-700", red: "bg-red-50 text-red-700" };
  return (
    <div className={`${colors[color]} p-4 rounded-lg w-36 shadow-sm border`}>
      <div className="text-xs font-medium uppercase opacity-70">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
};

const SkeletonRows = () => (
  <>{[...Array(5)].map((_, i) => (
    <tr key={i} className="animate-pulse"><td colSpan={6} className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-full"></div></td></tr>
  ))}</>
);

export default AdminExperimentLog;