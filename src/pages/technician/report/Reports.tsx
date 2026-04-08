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

const tableRowVariant: Variants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i: number = 0) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, delay: i * 0.04, ease: "easeOut" as const },
  }),
  exit: { opacity: 0, x: 12, transition: { duration: 0.2 } },
};

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<MonitoringLogStatus, string> = {
  Created:            "bg-[#E4F0E8] text-[#2D5A27] border-[#C9E7D2]",
  WaitingForApproval: "bg-[#FFF4E6] text-[#F97316] border-[#FCD5B8]",
  Approved:           "bg-[#E4F0E8] text-[#2D5A27] border-[#C9E7D2]",
  Rejected:           "bg-[#FEE2E2] text-[#B91C1C] border-[#FECACA]",
  Revised:            "bg-[#FFF0F9] text-[#DA70D6] border-[#F3D4EB]",
};

const STATUS_ICON_COLORS: Record<MonitoringLogStatus, string> = {
  Created:            "text-[#2D5A27]",
  WaitingForApproval: "text-[#F97316]",
  Approved:           "text-[#2D5A27]",
  Rejected:           "text-[#B91C1C]",
  Revised:            "text-[#DA70D6]",
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
      whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(45,90,39,0.14)" }}
      className={`bg-white rounded-2xl shadow-[0_14px_32px_rgba(45,90,39,0.10)] border ${borderColor} p-5 cursor-default`}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className={`inline-block h-3 w-3 rounded-full ${dotColor}`} />
        <span className="text-sm font-medium text-[#2D5A27] leading-tight">{label}</span>
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
      backgroundColor: ["#2D5A27", "#F97316", "#B91C1C", "#DA70D6", "#4B5563"],
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
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#F4F7F4] p-8">
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* ── Header ── */}
        <motion.div
          variants={fadeInDown}
          initial="hidden"
          animate="visible"
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-4xl font-bold text-[#2D5A27] mb-2">
              {t("monitoringLog.title")}
            </h1>
            <p className="text-[#4B6C54] text-lg">
              {t("monitoringLog.subtitle", { defaultValue: "Quản lý và theo dõi nhật ký giám sát" })}
            </p>
          </div>
          <motion.button
            type="button"
            whileHover={{ scale: 1.04, boxShadow: "0 8px 24px rgba(45,90,39,0.25)" }}
            whileTap={{ scale: 0.97 }}
            onClick={() => void navigate("/reports/new")}
            className="inline-flex items-center gap-2 bg-[#2D5A27] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#1e3e1c] transition-colors shadow-[0_4px_14px_rgba(45,90,39,0.3)]"
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
            whileHover={{ y: -4, boxShadow: "0 24px 48px rgba(45,90,39,0.18)" }}
            className="lg:col-span-1 bg-white rounded-2xl shadow-[0_18px_40px_rgba(45,90,39,0.12)] border border-[#DDEEE0] p-6"
          >
            <h3 className="text-lg font-semibold text-[#2D5A27] mb-1">
              {t("monitoringLog.totalReports")}
            </h3>
            <p className="text-sm text-[#4B6C54] mb-6">
              {t("monitoringLog.reportDistribution", { defaultValue: "Phân bổ theo trạng thái" })}
            </p>

            <div className="flex items-center justify-between gap-6">
              <div>
                <motion.div
                  key={total}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
                  className="text-5xl font-bold text-[#2D5A27]"
                >
                  {total}
                </motion.div>
                <div className="text-sm text-[#4B6C54] mt-1">
                  {t("monitoringLog.totalReports")}
                </div>

                {/* Legend */}
                <div className="mt-4 space-y-1.5">
                  {[
                    { label: t("monitoringLog.statusCreated"),            color: "bg-[#2D5A27]",  value: statusSummary.created },
                    { label: t("monitoringLog.statusWaitingForApproval"), color: "bg-[#F97316]",  value: statusSummary.waitingForApproval },
                    { label: t("monitoringLog.statusApproved"),           color: "bg-[#4B5563]",  value: statusSummary.approved },
                    { label: t("monitoringLog.statusRejected"),           color: "bg-[#B91C1C]",  value: statusSummary.rejected },
                    { label: t("monitoringLog.statusRevised"),            color: "bg-[#DA70D6]",  value: statusSummary.revised },
                  ].map(({ label, color, value }) => (
                    <div key={label} className="flex items-center gap-2 text-xs text-[#4B6C54]">
                      <span className={`inline-block h-2.5 w-2.5 rounded-full flex-shrink-0 ${color}`} />
                      <span className="truncate">{label}</span>
                      <span className="ml-auto font-semibold text-[#2D5A27]">{value}</span>
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
            <StatCard
              dotColor="bg-[#2D5A27]"
              label={t("monitoringLog.statusCreated")}
              value={statusSummary.created}
              valueColor="text-[#2D5A27]"
              borderColor="border-[#DDEEE0]"
            />
            <StatCard
              dotColor="bg-[#F97316]"
              label={t("monitoringLog.statusWaitingForApproval")}
              value={statusSummary.waitingForApproval}
              valueColor="text-[#F97316]"
              borderColor="border-[#FCD5B8]"
            />
            <StatCard
              dotColor="bg-[#4B5563]"
              label={t("monitoringLog.statusApproved")}
              value={statusSummary.approved}
              valueColor="text-[#4B5563]"
              borderColor="border-[#E5E7EB]"
            />
            <StatCard
              dotColor="bg-[#B91C1C]"
              label={t("monitoringLog.statusRejected")}
              value={statusSummary.rejected}
              valueColor="text-[#B91C1C]"
              borderColor="border-[#FECACA]"
            />
            <StatCard
              dotColor="bg-[#DA70D6]"
              label={t("monitoringLog.statusRevised")}
              value={statusSummary.revised}
              valueColor="text-[#DA70D6]"
              borderColor="border-[#F3D4EB]"
            />
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
                className="w-10 h-10 border-4 border-[#DDEEE0] border-t-[#2D5A27] rounded-full"
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
              className="bg-white rounded-2xl shadow-[0_18px_40px_rgba(45,90,39,0.08)] border border-[#DDEEE0] overflow-hidden"
            >
              <table className="w-full">
                <thead className="bg-[#F4F7F4] border-b border-[#DDEEE0]">
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
                        className="text-left px-6 py-4 font-semibold text-[#2D5A27] text-sm"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
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
                        <motion.tr
                          key={log.id}
                          custom={i}
                          variants={tableRowVariant}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          className="cursor-default transition-colors hover:bg-[#EBF7EE]" 
                        >
                          <td className="px-6 py-4 font-medium text-gray-900">{log.name}</td>
                          <td className="px-6 py-4 text-[#4B6C54]">{formatDate(log.createdDate)}</td>
                          <td className="px-6 py-4 text-gray-600">{log.sampleName}</td>

                          {/* Status badge */}
                          <td className="px-6 py-4">
                            <motion.span
                              initial={{ opacity: 0, scale: 0.85 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.03 + 0.1, type: "spring", stiffness: 280, damping: 22 }}
                              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${STATUS_COLORS[log.status] ?? "bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]"}`}
                            >
                              {getStatusIcon(log.status)}
                              {getStatusLabel(log.status)}
                            </motion.span>
                          </td>

                          {/* Newest badge */}
                          <td className="px-6 py-4">
                            {log.isNewest && (
                              <motion.span
                                initial={{ opacity: 0, scale: 0.85 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.03 + 0.15, type: "spring", stiffness: 280, damping: 22 }}
                                className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border bg-[#FFF0F9] text-[#DA70D6] border-[#F3D4EB]"
                              >
                                {t("monitoringLog.newest")}
                              </motion.span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {canSubmit(log.status) && (
                                <motion.button
                                  type="button"
                                  disabled={submittingId === log.id}
                                  whileHover={{ scale: 1.04 }}
                                  whileTap={{ scale: 0.96 }}
                                  onClick={() => { void handleSubmitForApproval(log); }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#2D5A27] text-[#2D5A27] hover:bg-[#2D5A27] hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  <Send className="w-3.5 h-3.5" />
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
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#DDEEE0] text-[#4B6C54] hover:bg-[#E4F0E8] hover:text-[#2D5A27] transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
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