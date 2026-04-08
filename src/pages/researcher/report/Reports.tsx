/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-inferrable-types */
/* eslint-disable react-hooks/exhaustive-deps */
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useEffect, useState, useMemo, useRef } from "react";
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
  Search,
  Filter,
  ChevronDown,
} from "lucide-react";

Chart.register(ArcElement, Tooltip, Legend);

const ITEMS_PER_PAGE = 10;

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

const filterPanelVariant: Variants = {
  hidden: { opacity: 0, scaleY: 0.96, y: -8 },
  visible: {
    opacity: 1, scaleY: 1, y: 0,
    transition: { duration: 0.35, ease: EASE_OUT_EXPO },
  },
};

const tableRowVariant: Variants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i: number = 0) => ({
    opacity: 1, x: 0,
    transition: { duration: 0.35, delay: i * 0.04, ease: "easeOut" as const },
  }),
  exit: { opacity: 0, x: 12, transition: { duration: 0.2 } },
};

const dropdownVariant: Variants = {
  hidden: { opacity: 0, scaleY: 0.88, y: -6 },
  visible: {
    opacity: 1, scaleY: 1, y: 0,
    transition: { duration: 0.22, ease: EASE_OUT_EXPO },
  },
  exit: {
    opacity: 0, scaleY: 0.9, y: -4,
    transition: { duration: 0.15, ease: "easeIn" as const },
  },
};

const dropdownItemVariant: Variants = {
  hidden: { opacity: 0, x: -6 },
  visible: (i: number) => ({
    opacity: 1, x: 0,
    transition: { duration: 0.18, delay: i * 0.03, ease: "easeOut" as const },
  }),
};

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<MonitoringLogStatus, string> = {
  Created:            "bg-[#E0F2FE] text-[#005792] border-[#BAE6FD]",
  WaitingForApproval: "bg-[#FFF4E6] text-[#F97316] border-[#FCD5B8]",
  Approved:           "bg-[#E0F2FE] text-[#005792] border-[#BAE6FD]",
  Rejected:           "bg-[#FEE2E2] text-[#B91C1C] border-[#FECACA]",
  Revised:            "bg-[#E0F9FF] text-[#00CED1] border-[#B2F0F5]",
};

const STATUS_ICON_COLORS: Record<MonitoringLogStatus, string> = {
  Created:            "text-[#005792]",
  WaitingForApproval: "text-[#F97316]",
  Approved:           "text-[#005792]",
  Rejected:           "text-[#B91C1C]",
  Revised:            "text-[#00CED1]",
};

const STATUS_FILTER_ORDER: MonitoringLogStatus[] = [
  "Created", "WaitingForApproval", "Approved", "Rejected", "Revised",
];

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

// ─── AnimatedSelect ───────────────────────────────────────────────────────────

interface SelectOption<T extends string> {
  value: T;
  label: string;
}

interface AnimatedSelectProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  disabled?: boolean;
}

function AnimatedSelect<T extends string>({
  value,
  onChange,
  options,
  placeholder = "Select...",
  disabled = false,
}: AnimatedSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? placeholder;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div ref={ref} className="relative select-none">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={`
          flex items-center gap-2 border rounded-lg px-4 py-2.5 text-sm bg-white
          transition-all duration-150 whitespace-nowrap
          ${open
            ? "border-[#005792] ring-2 ring-[#005792]/20 text-[#005792]"
            : "border-blue-100 text-gray-700 hover:border-[#005792]/50"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
      >
        <span>{selectedLabel}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
          className="flex items-center"
        >
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            key="dropdown"
            variants={dropdownVariant}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{ transformOrigin: "top center" }}
            className="
              absolute z-50 top-[calc(100%+6px)] left-0 min-w-full
              bg-white border border-blue-100 rounded-xl
              shadow-[0_8px_32px_rgba(0,87,146,0.14)]
              overflow-hidden py-1
            "
          >
            {options.map((opt, i) => (
              <motion.li
                key={opt.value}
                custom={i}
                variants={dropdownItemVariant}
                initial="hidden"
                animate="visible"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`
                  px-4 py-2.5 text-sm cursor-pointer whitespace-nowrap
                  transition-colors duration-75
                  ${opt.value === value
                    ? "bg-[#E0F2FE] text-[#005792] font-medium"
                    : "text-gray-700 hover:bg-[#F0F8FF] hover:text-[#005792]"
                  }
                `}
              >
                {opt.label}
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

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
      whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(0,87,146,0.14)" }}
      className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-[0_14px_32px_rgba(0,87,146,0.10)] border ${borderColor} p-5 cursor-default`}
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

  const [loading, setLoading] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [data, setData] = useState<MonitoringLog[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<MonitoringLogStatus | "All">("All");
  const [currentPage, setCurrentPage] = useState(1);

  const getStatusLabel = (status: MonitoringLogStatus) => {
    const map: Record<MonitoringLogStatus, string> = {
      Created:            t("monitoringLog.statusCreated"),
      WaitingForApproval: t("monitoringLog.statusWaitingForApproval"),
      Approved:           t("monitoringLog.statusApproved"),
      Rejected:           t("monitoringLog.statusRejected"),
      Revised:            t("monitoringLog.statusRevised"),
    };
    return map[status] ?? status;
  };

  const statusOptions: SelectOption<MonitoringLogStatus | "All">[] = [
    { value: "All", label: t("common.status") },
    ...STATUS_FILTER_ORDER.map((s) => ({
      value: s as MonitoringLogStatus | "All",
      label: getStatusLabel(s),
    })),
  ];

  const fetchData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ pageNo: "1", pageSize: "10000" });
      const res = await axiosInstance.get(`/api/monitoring-log?${params.toString()}`);
      const json = res.data as MonitoringLogApiResponse;
      const items = json.data ?? json.items ?? [];
      setData(items);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchData(); }, [user?.id]);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter]);

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      if (a.isNewest && !b.isNewest) return -1;
      if (!a.isNewest && b.isNewest) return 1;
      return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
    });
  }, [data]);

  const filteredData = useMemo(() => {
    let result = sortedData;
    if (statusFilter !== "All")
      result = result.filter((log) => log.status === statusFilter);
    if (searchTerm.trim())
      result = result.filter(
        (log) =>
          log.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (log.sampleName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
      );
    return result;
  }, [sortedData, statusFilter, searchTerm]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const total = data.length;

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
      backgroundColor: ["#005792", "#F97316", "#B91C1C", "#00CED1", "#4B5563"],
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
    return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
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
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#F0F8FF] p-8">
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* ── Header ── */}
        <motion.div
          variants={fadeInDown}
          initial="hidden"
          animate="visible"
          className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl shadow-sm p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-semibold text-[#005792] mb-1">
              {t("monitoringLog.title")}
            </h1>
            <p className="text-blue-900/70 text-sm">
              {t("monitoringLog.subtitle", { defaultValue: "Quản lý và theo dõi nhật ký giám sát" })}
            </p>
          </div>
          <motion.button
            type="button"
            whileHover={{ scale: 1.04, boxShadow: "0 8px 24px rgba(0,87,146,0.25)" }}
            whileTap={{ scale: 0.97 }}
            onClick={() => void navigate("/reports/new")}
            className="inline-flex items-center gap-2 bg-[#005792] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#004d73] transition-colors shadow-[0_4px_14px_rgba(0,87,146,0.3)]"
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
            whileHover={{ y: -4, boxShadow: "0 24px 48px rgba(0,87,146,0.18)" }}
            className="lg:col-span-1 bg-white/80 backdrop-blur-sm rounded-2xl shadow-[0_18px_40px_rgba(0,87,146,0.10)] border border-blue-100 p-6"
          >
            <h3 className="text-lg font-semibold text-[#005792] mb-1">
              {t("monitoringLog.totalReports")}
            </h3>
            <p className="text-sm text-blue-900/60 mb-6">
              {t("monitoringLog.reportDistribution", { defaultValue: "Phân bổ theo trạng thái" })}
            </p>
            <div className="flex items-center justify-between gap-6">
              <div className="flex-1 min-w-0">
                <motion.div
                  key={total}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
                  className="text-5xl font-bold text-[#005792]"
                >
                  {total}
                </motion.div>
                <div className="text-sm text-blue-900/60 mt-1">{t("monitoringLog.totalReports")}</div>
                <div className="mt-4 space-y-1.5">
                  {[
                    { label: t("monitoringLog.statusCreated"),            color: "bg-[#005792]", value: statusSummary.created },
                    { label: t("monitoringLog.statusWaitingForApproval"), color: "bg-[#F97316]", value: statusSummary.waitingForApproval },
                    { label: t("monitoringLog.statusApproved"),           color: "bg-[#4B5563]", value: statusSummary.approved },
                    { label: t("monitoringLog.statusRejected"),           color: "bg-[#B91C1C]", value: statusSummary.rejected },
                    { label: t("monitoringLog.statusRevised"),            color: "bg-[#00CED1]", value: statusSummary.revised },
                  ].map(({ label, color, value }) => (
                    <div key={label} className="flex items-center gap-2 text-xs text-blue-900/60">
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

          {/* Stat cards */}
          <motion.div
            className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <StatCard dotColor="bg-[#005792]" label={t("monitoringLog.statusCreated")}
              value={statusSummary.created} valueColor="text-[#005792]" borderColor="border-blue-100" />
            <StatCard dotColor="bg-[#F97316]" label={t("monitoringLog.statusWaitingForApproval")}
              value={statusSummary.waitingForApproval} valueColor="text-[#F97316]" borderColor="border-[#FCD5B8]" />
            <StatCard dotColor="bg-[#4B5563]" label={t("monitoringLog.statusApproved")}
              value={statusSummary.approved} valueColor="text-[#4B5563]" borderColor="border-[#E5E7EB]" />
            <StatCard dotColor="bg-[#B91C1C]" label={t("monitoringLog.statusRejected")}
              value={statusSummary.rejected} valueColor="text-[#B91C1C]" borderColor="border-[#FECACA]" />
            <StatCard dotColor="bg-[#00CED1]" label={t("monitoringLog.statusRevised")}
              value={statusSummary.revised} valueColor="text-[#00CED1]" borderColor="border-[#B2F0F5]" />
          </motion.div>
        </div>

        {/* ── Filter panel ── */}
        <motion.div
          variants={filterPanelVariant}
          initial="hidden"
          animate="visible"
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-[0_10px_20px_rgba(0,87,146,0.08)] border border-blue-100 p-6 origin-top"
        >
          <div className="flex flex-wrap items-center gap-4">
            {/* Status filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-[#005792]" />
              <AnimatedSelect
                value={statusFilter}
                onChange={(v) => setStatusFilter(v as MonitoringLogStatus | "All")}
                options={statusOptions}
                placeholder={t("common.status")}
              />
            </div>

            {/* Search */}
            <div className="flex-1 min-w-[300px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={t("monitoringLog.searchPlaceholder", { defaultValue: "Tìm theo tên báo cáo, tên mẫu..." })}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-blue-100 bg-white/90 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-[#005792]/30 focus:border-[#005792] transition-shadow"
              />
            </div>

            {/* Clear filters */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { setSearchTerm(""); setStatusFilter("All"); setCurrentPage(1); }}
              className="px-4 py-2.5 text-sm text-[#005792] hover:text-[#004d73] hover:bg-[#E0F2FE] border border-blue-100 rounded-lg transition-colors font-medium"
            >
              {t("common.clearFilters")}
            </motion.button>
          </div>
        </motion.div>

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
              <span className="text-blue-900/50 text-sm">{t("common.loadingData")}</span>
            </motion.div>
          ) : (
            <motion.div
              key="table"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-[0_18px_40px_rgba(0,87,146,0.08)] border border-blue-100 overflow-hidden"
            >
              <table className="w-full">
                <thead className="bg-white/60 border-b border-blue-100">
                  <tr>
                    {[
                      t("monitoringLog.reportName"),
                      t("monitoringLog.createdDate"),
                      t("monitoringLog.sampleName"),
                      t("common.status"),
                      t("monitoringLog.newest"),
                      t("common.action"),
                    ].map((header) => (
                      <th key={header} className="text-left px-6 py-4 font-semibold text-[#005792] text-xs uppercase tracking-wider">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-blue-50">
                  <AnimatePresence>
                    {paginatedData.length === 0 ? (
                      <motion.tr
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <td colSpan={6} className="p-12 text-center text-blue-900/40">
                          {t("monitoringLog.noReports")}
                        </td>
                      </motion.tr>
                    ) : (
                      paginatedData.map((log, i) => (
                        <motion.tr
                          key={log.id}
                          custom={i}
                          variants={tableRowVariant}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          layout
                          whileHover={{ backgroundColor: "rgba(239,246,255,0.85)" }}
                          className="cursor-default transition-colors"
                        >
                          <td className="px-6 py-4 font-medium text-blue-950">{log.name}</td>
                          <td className="px-6 py-4 text-blue-900/60">{formatDate(log.createdDate)}</td>
                          <td className="px-6 py-4 text-blue-900/70">{log.sampleName}</td>

                          {/* Status badge */}
                          <td className="px-6 py-4">
                            <motion.span
                              initial={{ opacity: 0, scale: 0.85 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.03 + 0.1, type: "spring", stiffness: 280, damping: 22 }}
                              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
                                STATUS_COLORS[log.status] ?? "bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]"
                              }`}
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
                                className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border bg-[#E0F9FF] text-[#00CED1] border-[#B2F0F5]"
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
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#005792] text-[#005792] hover:bg-[#005792] hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-blue-100 text-blue-900/60 hover:bg-[#E0F2FE] hover:text-[#005792] transition-colors"
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

              {/* ── Pagination ── */}
              {totalPages > 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="px-6 py-4 bg-white/70 border-t border-blue-100 flex justify-between items-center"
                >
                  <span className="text-sm text-blue-900/60 font-medium">
                    {t("common.showing")} {paginatedData.length} {t("common.of")} {filteredData.length}{" "}
                    {t("monitoringLog.reports", { defaultValue: "báo cáo" })}
                  </span>
                  <div className="flex gap-2">
                    {currentPage > 1 && (
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.93 }}
                        onClick={() => setCurrentPage(currentPage - 1)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-blue-100 hover:bg-[#E0F2FE] hover:border-blue-300 text-sm font-medium shadow-sm"
                      >
                        ←
                      </motion.button>
                    )}

                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5)                    pageNum = i + 1;
                      else if (currentPage <= 3)              pageNum = i + 1;
                      else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                      else                                    pageNum = currentPage - 2 + i;
                      return (
                        <motion.button
                          key={pageNum}
                          type="button"
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.93 }}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm ${
                            currentPage === pageNum
                              ? "bg-[#005792] text-white"
                              : "bg-white border border-blue-100 hover:bg-[#E0F2FE] hover:border-blue-300"
                          }`}
                        >
                          {pageNum}
                        </motion.button>
                      );
                    })}

                    {currentPage < totalPages && (
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.93 }}
                        onClick={() => setCurrentPage(currentPage + 1)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-blue-100 hover:bg-[#E0F2FE] hover:border-blue-300 text-sm font-medium shadow-sm"
                      >
                        →
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}