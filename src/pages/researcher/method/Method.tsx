/* eslint-disable @typescript-eslint/no-inferrable-types */
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
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Plus,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Eye,
  Send,
} from "lucide-react";

Chart.register(ArcElement, Tooltip, Legend);

// ─── Animation Variants ───────────────────────────────────────────────────────

const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as [number, number, number, number];

const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_OUT_EXPO } },
};

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const cardVariant: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: EASE_OUT_EXPO } },
};

// Row variant: NO layout, NO whileHover — entrance only
const tableRowVariant: Variants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i: number = 0) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, delay: i * 0.03, ease: "easeOut" as const },
  }),
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<MonitoringLogStatus, string> = {
  Created:            "bg-cyan-50 text-cyan-700 border-cyan-100",
  WaitingForApproval: "bg-yellow-50 text-yellow-700 border-yellow-100",
  Approved:           "bg-emerald-50 text-emerald-700 border-emerald-100",
  Rejected:           "bg-red-50 text-red-700 border-red-100",
  Revised:            "bg-indigo-50 text-indigo-700 border-indigo-100",
};

const STATUS_ICON_COLORS: Record<MonitoringLogStatus, string> = {
  Created:            "text-cyan-700",
  WaitingForApproval: "text-yellow-700",
  Approved:           "text-emerald-700",
  Rejected:           "text-red-700",
  Revised:            "text-indigo-700",
};

const getStatusIcon = (status: MonitoringLogStatus) => {
  const cls = `w-4 h-4 ${STATUS_ICON_COLORS[status]}`;
  switch (status) {
    case "Created":            return <FileText className={cls} />;
    case "WaitingForApproval": return <Clock className={cls} />;
    case "Approved":           return <CheckCircle2 className={cls} />;
    case "Rejected":           return <XCircle className={cls} />;
    case "Revised":            return <RefreshCw className={cls} />;
  }
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  dotColor: string;
  label: string;
  value: number;
  valueColor: string;
  borderColor: string;
}

function StatCard({ dotColor, label, value, valueColor, borderColor }: StatCardProps) {
  return (
    <motion.div
      variants={cardVariant}
      // CSS transition instead of JS-driven whileHover for perf
      className={`bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-100 ${borderColor} p-5 cursor-default
        transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-sm`}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className={`inline-block h-3 w-3 rounded-full ${dotColor}`} />
        <span className="text-sm font-medium text-[#005792] leading-tight">{label}</span>
      </div>
      <motion.div
        key={value}
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={`text-3xl font-bold ${valueColor}`}
      >
        {value}
      </motion.div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

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
      const params = new URLSearchParams({ pageNo: "1", pageSize: "10000", technicianId: user.id });
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

  useEffect(() => { void fetchData(); }, [user?.id]);

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      if (a.isNewest && !b.isNewest) return -1;
      if (!a.isNewest && b.isNewest) return 1;
      return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
    });
  }, [data]);

  const statusSummary = useMemo(() => {
    return data.reduce(
      (acc, log) => {
        if (log.status === "Created")            acc.created += 1;
        if (log.status === "WaitingForApproval") acc.waitingForApproval += 1;
        if (log.status === "Rejected")           acc.rejected += 1;
        if (log.status === "Revised")            acc.revised += 1;
        if (log.status === "Approved")           acc.approved += 1;
        return acc;
      },
      { created: 0, waitingForApproval: 0, rejected: 0, revised: 0, approved: 0 }
    );
  }, [data]);

  const chartData = useMemo(() => ({
    labels: [
      t("monitoringLog.statusCreated"),
      t("monitoringLog.statusWaitingForApproval"),
      t("monitoringLog.statusRejected"),
      t("monitoringLog.statusRevised"),
      t("monitoringLog.statusApproved"),
    ],
    datasets: [{
      data: [
        statusSummary.created,
        statusSummary.waitingForApproval,
        statusSummary.rejected,
        statusSummary.revised,
        statusSummary.approved,
      ],
      backgroundColor: ["#005792", "#00CED1", "#10B981", "#FF6F61", "#F97316"],
      borderWidth: 0,
      spacing: 2,
    }],
  }), [statusSummary, t]);

  const chartOptions: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day   = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year  = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getStatusLabel = (status: MonitoringLogStatus) => {
    switch (status) {
      case "Created":            return t("monitoringLog.statusCreated");
      case "WaitingForApproval": return t("monitoringLog.statusWaitingForApproval");
      case "Approved":           return t("monitoringLog.statusApproved");
      case "Rejected":           return t("monitoringLog.statusRejected");
      case "Revised":            return t("monitoringLog.statusRevised");
      default:                   return status;
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
      const apiError = error as { response?: { data?: string }; message?: string };
      enqueueSnackbar(
        apiError.response?.data ?? apiError.message ?? t("monitoringLog.submitDraftFailed"),
        { variant: "error" }
      );
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#F0F8FF] text-blue-950">
      <div className="max-w-[1400px] mx-auto space-y-6 px-6 py-8">

        {/* ── Header ── */}
        <motion.div
          variants={fadeInDown}
          initial="hidden"
          animate="visible"
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold text-[#005792] mb-2">
              {t("monitoringLog.title")}
            </h1>
            <p className="text-sm md:text-base text-slate-600">
              {t("monitoringLog.subtitle", { defaultValue: "Quản lý và theo dõi nhật ký giám sát" })}
            </p>
          </div>
          <motion.button
            type="button"
            whileHover={{ scale: 1.03, boxShadow: "0 10px 24px rgba(0,87,146,0.28)" }}
            whileTap={{ scale: 0.97 }}
            onClick={() => void navigate("/reports/new")}
            className="inline-flex items-center gap-2 bg-[#005792] text-white px-5 py-2 rounded-full font-semibold hover:bg-[#004d73] transition-all duration-200 shadow-sm"
          >
            <Plus className="w-5 h-5" />
            {t("monitoringLog.createNew")}
          </motion.button>
        </motion.div>

        {/* ── Summary ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Donut card */}
          <motion.div
            variants={cardVariant}
            initial="hidden"
            animate="visible"
            className="lg:col-span-1 bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
          >
            <h3 className="text-lg font-semibold text-[#005792] mb-1">
              {t("monitoringLog.totalReports")}
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              {t("monitoringLog.reportDistribution", { defaultValue: "Phân bổ theo trạng thái" })}
            </p>

            <div className="flex items-center justify-between gap-6">
              <div>
                <motion.div
                  key={total}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
                  className="text-5xl font-bold text-[#005792]"
                >
                  {total}
                </motion.div>
                <div className="text-sm text-slate-600 mt-1">
                  {t("monitoringLog.totalReports")}
                </div>

                {/* Legend */}
                <div className="mt-4 space-y-1.5">
                  {[
                    { label: t("monitoringLog.statusCreated"),            color: "bg-[#005792]",  value: statusSummary.created },
                    { label: t("monitoringLog.statusWaitingForApproval"), color: "bg-[#F97316]",  value: statusSummary.waitingForApproval },
                    { label: t("monitoringLog.statusApproved"),           color: "bg-[#4B5563]",  value: statusSummary.approved },
                    { label: t("monitoringLog.statusRejected"),           color: "bg-[#B91C1C]",  value: statusSummary.rejected },
                    { label: t("monitoringLog.statusRevised"),            color: "bg-[#DA70D6]",  value: statusSummary.revised },
                  ].map(({ label, color, value }) => (
                    <div key={label} className="flex items-center gap-2 text-xs text-slate-600">
                      <span className={`inline-block h-2.5 w-2.5 rounded-full flex-shrink-0 ${color}`} />
                      <span className="truncate">{label}</span>
                      <span className="ml-auto font-semibold text-[#005792]">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="h-36 w-36 flex-shrink-0">
                <Doughnut data={chartData} options={chartOptions} />
              </div>
            </div>
          </motion.div>

          {/* Stat cards 2x2 */}
          <motion.div
            className="lg:col-span-2 grid grid-cols-2 gap-4"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <StatCard dotColor="bg-[#005792]" label={t("monitoringLog.statusCreated")}            value={statusSummary.created}            valueColor="text-[#005792]"  borderColor="border-blue-100" />
            <StatCard dotColor="bg-[#F97316]" label={t("monitoringLog.statusWaitingForApproval")} value={statusSummary.waitingForApproval}  valueColor="text-[#F97316]"  borderColor="border-orange-100" />
            <StatCard dotColor="bg-[#10B981]" label={t("monitoringLog.statusApproved")}           value={statusSummary.approved}           valueColor="text-[#10B981]"  borderColor="border-emerald-100" />
            <StatCard dotColor="bg-[#EF4444]" label={t("monitoringLog.statusRejected")}           value={statusSummary.rejected}           valueColor="text-[#EF4444]"  borderColor="border-red-100" />
            <StatCard dotColor="bg-[#7C3AED]" label={t("monitoringLog.statusRevised")}            value={statusSummary.revised}            valueColor="text-[#7C3AED]"  borderColor="border-purple-100" />
          </motion.div>
        </div>

        {/* ── Table ── */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16 gap-3"
            >
              <motion.div
                className="w-10 h-10 border-4 border-blue-100 border-t-[#005792] rounded-full"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
              />
              <span className="text-gray-500 text-sm">{t("common.loadingData")}</span>
            </motion.div>
          ) : (
            <motion.div
              key="table"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
              className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl overflow-hidden shadow-sm"
            >
              <table className="w-full">
                <thead className="bg-gradient-to-r from-[#E6F1FF] to-[#F0F8FF] border-b border-blue-100">
                  <tr>
                    {[
                      t("monitoringLog.reportName"),
                      t("monitoringLog.createdDate"),
                      t("monitoringLog.sampleName"),
                      t("common.status"),
                      t("monitoringLog.newest"),
                      t("common.action"),
                    ].map((header) => (
                      <th
                        key={header}
                        className="text-left px-4 py-3 font-semibold text-slate-800 text-sm"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  <AnimatePresence>
                    {sortedData.length === 0 ? (
                      <motion.tr
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <td colSpan={6} className="p-12 text-center text-gray-500">
                          {t("monitoringLog.noReports")}
                        </td>
                      </motion.tr>
                    ) : (
                      sortedData.map((log, i) => (
                        // ⚠️ Key change: plain <tr> with CSS hover — no whileHover, no layout prop
                        // This prevents Framer Motion from running JS on every mouse event
                        <motion.tr
                          key={log.id}
                          custom={i}
                          variants={tableRowVariant}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          // NO layout prop — avoids costly re-layout on every hover
                          // NO whileHover — CSS handles this instantly via GPU
className="border-b hover:bg-blue-50/60 cursor-pointer transition-colors duration-150"
                      >
                          <td className="p-4 font-medium text-gray-900">{log.name}</td>
                          <td className="p-4 text-slate-700">{formatDate(log.createdDate)}</td>
                          <td className="p-4 text-gray-600">{log.sampleName}</td>

                          {/* Status badge — plain span, no motion wrapper */}
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border bg-opacity-25 ${STATUS_COLORS[log.status] ?? "bg-gray-100 text-gray-700 border-gray-200"}`}
                            >
                              {getStatusIcon(log.status)}
                              {getStatusLabel(log.status)}
                            </span>
                          </td>

                          {/* Newest badge — plain span */}
                          <td className="px-6 py-4">
                            {log.isNewest && (
                              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border bg-cyan-50 text-cyan-700 border-cyan-100">
                                {t("monitoringLog.newest")}
                              </span>
                            )}
                          </td>

                          {/* Actions — keep whileHover only on buttons, not rows */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {canSubmit(log.status) && (
                                <motion.button
                                  type="button"
                                  disabled={submittingId === log.id}
                                  whileHover={{ scale: 1.04 }}
                                  whileTap={{ scale: 0.96 }}
                                  onClick={() => { void handleSubmitForApproval(log); }}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border border-[#005792] text-[#005792] bg-white/70 hover:bg-white hover:text-[#004d73] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  <Send className="w-4 h-4" />
                                  {submittingId === log.id
                                    ? t("monitoringLog.submitting")
                                    : log.status === "Created"
                                    ? t("monitoringLog.submitDraft")
                                    : t("monitoringLog.resubmit")}
                                </motion.button>
                              )}
                              <motion.button
                                type="button"
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.96 }}
                                onClick={() => void navigate(`/monitoring-logs/${log.id}`)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border border-blue-100 bg-white/70 text-[#005792] hover:bg-white hover:text-[#004d73] transition-all duration-200"
                              >
                                <Eye className="w-4 h-4" />
                                {t("common.details")}
                              </motion.button>
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}